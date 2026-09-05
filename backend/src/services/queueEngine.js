const QueueEntry = require('../models/QueueEntry');
const Booking = require('../models/Booking');
const ProcurementCentre = require('../models/ProcurementCentre');
const { getTodayIST } = require('../utils/dateUtils');
const { logQueueAction } = require('./auditService');
const { inMemoryQueueEntries, inMemoryBookings } = require('./bookingService');

// Explicit State Machine Transition Map
const VALID_TRANSITIONS = {
  WAITING: ['CALLED', 'CANCELLED', 'NO_SHOW'],
  CALLED: ['ARRIVED', 'NO_SHOW', 'CANCELLED'],
  ARRIVED: ['VERIFICATION', 'CANCELLED'],
  VERIFICATION: ['WEIGHING', 'CANCELLED'],
  WEIGHING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
  NO_SHOW: []    // Terminal
};

const isValidTransition = (currentState, targetState) => {
  const allowed = VALID_TRANSITIONS[currentState] || [];
  return allowed.includes(targetState);
};

// Broadcast Socket.IO event helper
const broadcastQueueEvent = (io, centreId, farmerId, eventName, payload) => {
  if (!io) return;
  if (centreId) {
    io.to(`centre_${centreId}`).emit('queue:updated', payload);
    io.to(`centre_${centreId}`).emit(eventName, payload);
  }
  if (farmerId) {
    io.to(`farmer_${farmerId}`).emit('queue:updated', payload);
    io.to(`farmer_${farmerId}`).emit(eventName, payload);
  }
};

/**
 * Atomic Call Next Token
 * Claims exactly ONE waiting entry using atomic findOneAndUpdate with condition state === 'WAITING'
 */
const callNextFarmer = async ({ centreId, queueDate, staffUser, counterId = 'Counter 1', io }) => {
  const dateStr = queueDate || getTodayIST();

  const centreQuery = [centreId, centreId ? centreId.toString() : 'c1'];
  if (centreId?.toString() === 'c1' || staffUser?.assignedCentreId) {
    centreQuery.push('c1');
    if (staffUser?.assignedCentreId) centreQuery.push(staffUser.assignedCentreId.toString());
  }

  let nextEntry = null;
  try {
    nextEntry = await QueueEntry.findOneAndUpdate(
      {
        centreId: { $in: centreQuery },
        queueDate: dateStr,
        state: 'WAITING'
      },
      {
        $set: {
          state: 'CALLED',
          calledAt: new Date(),
          counterId
        }
      },
      {
        sort: { sequenceNumber: 1, createdAt: 1 },
        new: true
      }
    ).populate('farmerId', 'fullName phone');
  } catch (dbErr) {
    // In-memory fallback claim
    for (const [, qe] of inMemoryQueueEntries) {
      const matchesCentre = centreQuery.includes(qe.centreId) || centreQuery.includes(qe.centreId?.toString());
      if (matchesCentre && qe.queueDate === dateStr && qe.state === 'WAITING') {
        qe.state = 'CALLED';
        qe.calledAt = new Date();
        qe.counterId = counterId;
        nextEntry = qe;
        break;
      }
    }
  }

  if (!nextEntry) {
    // Check in-memory store directly if DB returned null
    for (const [, qe] of inMemoryQueueEntries) {
      const matchesCentre = centreQuery.includes(qe.centreId) || centreQuery.includes(qe.centreId?.toString());
      if (matchesCentre && qe.queueDate === dateStr && qe.state === 'WAITING') {
        qe.state = 'CALLED';
        qe.calledAt = new Date();
        qe.counterId = counterId;
        nextEntry = qe;
        break;
      }
    }
  }

  if (!nextEntry) {
    throw new Error('No waiting farmers currently in line for today.');
  }

  const farmerIdStr = nextEntry.farmerId?._id ? nextEntry.farmerId._id.toString() : nextEntry.farmerId?.toString();

  // Log Audit Action
  await logQueueAction({
    userId: staffUser.id || staffUser._id,
    userRole: staffUser.role,
    centreId,
    queueEntryId: nextEntry._id ? nextEntry._id.toString() : nextEntry.id,
    action: 'CALL_NEXT',
    previousState: 'WAITING',
    newState: 'CALLED',
    details: { tokenNumber: nextEntry.tokenNumber, counterId }
  });

  // Broadcast Socket Event
  const payload = {
    queueEntryId: nextEntry._id ? nextEntry._id.toString() : nextEntry.id,
    tokenNumber: nextEntry.tokenNumber,
    state: 'CALLED',
    counterId,
    calledAt: nextEntry.calledAt,
    farmerName: nextEntry.farmerId?.fullName || 'Farmer'
  };

  broadcastQueueEvent(io, centreId, farmerIdStr, 'queue:called', payload);

  return nextEntry;
};

/**
 * Execute State Transition
 * Validates transition, updates state atomically, logs audit, and broadcasts Socket event
 */
const transitionQueueState = async ({ queueEntryId, targetState, staffUser, counterId, notes, io }) => {
  let queueEntry = null;
  try {
    queueEntry = await QueueEntry.findById(queueEntryId);
  } catch (err) {
    queueEntry = inMemoryQueueEntries.get(queueEntryId);
  }

  if (!queueEntry && inMemoryQueueEntries.has(queueEntryId)) {
    queueEntry = inMemoryQueueEntries.get(queueEntryId);
  }

  if (!queueEntry) {
    throw new Error('Queue entry not found.');
  }

  const currentState = queueEntry.state;

  if (!isValidTransition(currentState, targetState)) {
    throw new Error(`Invalid state transition from ${currentState} to ${targetState}.`);
  }

  const updateFields = {
    state: targetState,
    ...(counterId && { counterId }),
    ...(notes && { notes })
  };

  const now = new Date();
  if (targetState === 'ARRIVED') updateFields.arrivedAt = now;
  if (targetState === 'VERIFICATION') updateFields.verificationStartedAt = now;
  if (targetState === 'WEIGHING') updateFields.weighingStartedAt = now;
  if (targetState === 'COMPLETED') updateFields.completedAt = now;
  if (targetState === 'CANCELLED') updateFields.cancelledAt = now;
  if (targetState === 'NO_SHOW') updateFields.noShowAt = now;

  // Update in DB or memory
  try {
    queueEntry = await QueueEntry.findByIdAndUpdate(
      queueEntryId,
      { $set: updateFields },
      { new: true }
    ).populate('farmerId', 'fullName phone');
  } catch (dbErr) {
    Object.assign(queueEntry, updateFields);
  }

  // Synchronize Booking status if COMPLETED or CANCELLED
  if (targetState === 'COMPLETED' || targetState === 'CANCELLED') {
    try {
      await Booking.findByIdAndUpdate(queueEntry.bookingId, {
        bookingStatus: targetState === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED'
      });
    } catch (err) {
      const b = inMemoryBookings.get(queueEntry.bookingId.toString());
      if (b) b.bookingStatus = targetState === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED';
    }
  }

  const farmerIdStr = queueEntry.farmerId?._id ? queueEntry.farmerId._id.toString() : queueEntry.farmerId?.toString();
  const centreIdStr = queueEntry.centreId?._id ? queueEntry.centreId._id.toString() : queueEntry.centreId?.toString();

  // Audit Log
  await logQueueAction({
    userId: staffUser.id || staffUser._id,
    userRole: staffUser.role,
    centreId: centreIdStr,
    queueEntryId: queueEntry._id ? queueEntry._id.toString() : queueEntry.id,
    action: `MARK_${targetState}`,
    previousState: currentState,
    newState: targetState,
    details: { tokenNumber: queueEntry.tokenNumber, counterId, notes }
  });

  // Socket Broadcast
  const payload = {
    queueEntryId: queueEntry._id ? queueEntry._id.toString() : queueEntry.id,
    tokenNumber: queueEntry.tokenNumber,
    state: targetState,
    counterId: queueEntry.counterId,
    updatedAt: now,
    farmerName: queueEntry.farmerId?.fullName || 'Farmer'
  };

  broadcastQueueEvent(io, centreIdStr, farmerIdStr, `queue:${targetState.toLowerCase()}`, payload);

  return queueEntry;
};

/**
 * Get Farmer Live Queue Ticket Info
 * Calculates position, people ahead, currently serving token, and estimated wait
 */
const getFarmerQueueStatus = async (farmerId) => {
  let activeEntry = null;
  try {
    activeEntry = await QueueEntry.findOne({
      farmerId,
      state: { $in: ['WAITING', 'CALLED', 'ARRIVED', 'VERIFICATION', 'WEIGHING'] }
    })
      .populate('centreId', 'name address centreCode')
      .populate('bookingId', 'bookingDate timeWindow cropType estimatedQuantityQuintals')
      .lean();
  } catch (err) {
    for (const [, qe] of inMemoryQueueEntries) {
      if ((qe.farmerId === farmerId || qe.farmerId.toString() === farmerId.toString()) && ['WAITING', 'CALLED', 'ARRIVED', 'VERIFICATION', 'WEIGHING'].includes(qe.state)) {
        activeEntry = qe;
        break;
      }
    }
  }

  if (!activeEntry) {
    return null;
  }

  const centreId = activeEntry.centreId?._id || activeEntry.centreId;
  const queueDate = activeEntry.queueDate;

  // Calculate people ahead & current token
  let peopleAhead = 0;
  let currentlyServingToken = 'TOK-SEH01-001';

  try {
    peopleAhead = await QueueEntry.countDocuments({
      centreId,
      queueDate,
      state: 'WAITING',
      sequenceNumber: { $lt: activeEntry.sequenceNumber }
    });

    const servingEntry = await QueueEntry.findOne({
      centreId,
      queueDate,
      state: { $in: ['CALLED', 'ARRIVED', 'VERIFICATION', 'WEIGHING'] }
    }).sort({ updatedAt: -1 });

    if (servingEntry) {
      currentlyServingToken = servingEntry.tokenNumber;
    }
  } catch (dbErr) {
    peopleAhead = Math.max(0, activeEntry.sequenceNumber - 1);
  }

  const estimatedWaitMinutes = Math.max(10, (peopleAhead + 1) * 8);

  return {
    queueEntryId: activeEntry._id ? activeEntry._id.toString() : activeEntry.id,
    tokenNumber: activeEntry.tokenNumber,
    state: activeEntry.state,
    sequenceNumber: activeEntry.sequenceNumber,
    position: peopleAhead + 1,
    peopleAhead,
    currentlyServingToken,
    estimatedWaitMinutes,
    counterId: activeEntry.counterId || 'Counter 1',
    centre: activeEntry.centreId,
    booking: activeEntry.bookingId
  };
};

/**
 * Get Centre Queue Statistics for Staff Dashboard
 */
const getCentreQueueStats = async (centreId, dateStr) => {
  const dateQuery = dateStr || getTodayIST();

  let entries = [];
  try {
    entries = await QueueEntry.find({ centreId, queueDate: dateQuery }).lean();
  } catch (err) {
    for (const [, qe] of inMemoryQueueEntries) {
      if ((qe.centreId === centreId || qe.centreId.toString() === centreId.toString()) && qe.queueDate === dateQuery) {
        entries.push(qe);
      }
    }
  }

  const stats = {
    totalWaiting: entries.filter((e) => e.state === 'WAITING').length,
    currentlyCalled: entries.filter((e) => e.state === 'CALLED').length,
    arrived: entries.filter((e) => e.state === 'ARRIVED').length,
    inVerification: entries.filter((e) => e.state === 'VERIFICATION').length,
    inWeighing: entries.filter((e) => e.state === 'WEIGHING').length,
    completedToday: entries.filter((e) => e.state === 'COMPLETED').length,
    cancelledToday: entries.filter((e) => e.state === 'CANCELLED').length,
    noShowToday: entries.filter((e) => e.state === 'NO_SHOW').length
  };

  return stats;
};

module.exports = {
  VALID_TRANSITIONS,
  isValidTransition,
  callNextFarmer,
  transitionQueueState,
  getFarmerQueueStatus,
  getCentreQueueStats
};
