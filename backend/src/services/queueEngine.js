const QueueEntry = require('../models/QueueEntry');
const Booking = require('../models/Booking');
const Procurement = require('../models/Procurement');
const PaymentStatus = require('../models/PaymentStatus');
const ProcurementCentre = require('../models/ProcurementCentre');
const { getTodayIST } = require('../utils/dateUtils');
const { logQueueAction } = require('./auditService');
const { dispatchNotification } = require('./notificationService');
const { inMemoryQueueEntries, inMemoryBookings } = require('./bookingService');

// Explicit State Machine Transition Map (Canonical 10-Stage & Backward Compatible)
const VALID_TRANSITIONS = {
  BOOKED: ['WAITING', 'CALLED', 'ARRIVED', 'CANCELLED', 'NO_SHOW'],
  WAITING: ['CALLED', 'ARRIVED', 'CANCELLED', 'NO_SHOW'],
  CALLED: ['ARRIVED', 'VERIFICATION', 'NO_SHOW', 'CANCELLED'],
  ARRIVED: ['VERIFICATION', 'QUALITY_CHECK', 'CANCELLED'],
  VERIFICATION: ['QUALITY_CHECK', 'WEIGHING', 'REJECTED', 'CANCELLED'],
  QUALITY_CHECK: ['WEIGHING', 'REJECTED', 'CANCELLED'],
  WEIGHING: ['PROCUREMENT_CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED'],
  PROCUREMENT_CONFIRMED: ['PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'COMPLETED', 'CANCELLED'],
  PAYMENT_PROCESSING: ['PAYMENT_COMPLETED', 'COMPLETED', 'CANCELLED'],
  PAYMENT_COMPLETED: ['COMPLETED'],
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
  NO_SHOW: [],   // Terminal
  REJECTED: []   // Terminal
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
  // District Command Centre cross-portal real-time synchronization
  io.to('admin_global').emit('queue:updated', { ...payload, centreId });
  io.to('admin_global').emit(eventName, { ...payload, centreId });
};

/**
 * Atomic Call Next Token
 * Claims exactly ONE waiting entry using atomic findOneAndUpdate with condition state === 'WAITING'
 */
const callNextFarmer = async ({ centreId, queueDate, staffUser, counterId = 'Counter 1', io }) => {
  const dateStr = queueDate || getTodayIST();

  if (staffUser && staffUser.role !== 'ADMIN') {
    const userCentreId = staffUser.assignedCentreId ? staffUser.assignedCentreId.toString() : '';
    if (userCentreId && centreId && userCentreId !== centreId.toString()) {
      const err = new Error(`Access denied: Staff assigned to centre ${userCentreId} cannot call farmers for centre ${centreId}.`);
      err.statusCode = 403;
      err.code = 'CENTRE_ACCESS_DENIED';
      throw err;
    }
  }

  const centreQuery = [centreId, centreId ? centreId.toString() : 'c1'];

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

  // Synchronize Booking operationalStatus to CALLED
  try {
    await Booking.findByIdAndUpdate(nextEntry.bookingId, { $set: { operationalStatus: 'CALLED' } });
  } catch (err) {
    const b = inMemoryBookings.get(nextEntry.bookingId.toString());
    if (b) b.operationalStatus = 'CALLED';
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

  // Dispatch In-App & Simulated SMS Notification to Farmer
  if (farmerIdStr) {
    dispatchNotification({
      userId: farmerIdStr,
      phone: nextEntry.farmerId?.phone,
      title: 'Your Token is Called',
      message: `Token ${nextEntry.tokenNumber} called! Please proceed to ${counterId || 'Counter 1'} immediately with your vehicle and ID proof.`,
      event: 'TOKEN_CALLED',
      io
    });
  }

  return nextEntry;
};

/**
 * Execute State Transition
 * Validates transition, updates state atomically, logs audit, and broadcasts Socket event
 */
const transitionQueueState = async ({ queueEntryId, targetState, staffUser, counterId, notes, payload = {}, io }) => {
  let queueEntry = null;
  try {
    queueEntry = await QueueEntry.findById(queueEntryId).populate('bookingId');
  } catch (err) {
    queueEntry = inMemoryQueueEntries.get(queueEntryId);
  }

  if (!queueEntry && inMemoryQueueEntries.has(queueEntryId)) {
    queueEntry = inMemoryQueueEntries.get(queueEntryId);
  }

  if (!queueEntry) {
    throw new Error('Queue entry not found.');
  }

  // Cross-centre staff authorization check: staff can only transition tokens for their assigned centre
  if (staffUser && staffUser.role !== 'ADMIN') {
    const userCentreId = staffUser.assignedCentreId ? staffUser.assignedCentreId.toString() : '';
    const entryCentreId = queueEntry.centreId?._id ? queueEntry.centreId._id.toString() : (queueEntry.centreId ? queueEntry.centreId.toString() : '');
    if (userCentreId && entryCentreId && userCentreId !== entryCentreId) {
      const err = new Error(`Access denied: Staff assigned to centre ${userCentreId} cannot manage queue tokens for centre ${entryCentreId}.`);
      err.statusCode = 403;
      err.code = 'CENTRE_ACCESS_DENIED';
      throw err;
    }
  }

  const currentState = queueEntry.state;

  // Idempotency: Double clicks or re-sending the current state succeeds safely without failure
  if (currentState === targetState) {
    const populated = await QueueEntry.findById(queueEntry._id || queueEntryId)
      .populate('farmerId', 'fullName phone district villageName')
      .populate('bookingId');
    return populated || queueEntry;
  }

  if (!isValidTransition(currentState, targetState)) {
    const err = new Error(`Invalid state transition from ${currentState} to ${targetState}.`);
    err.statusCode = 400;
    err.code = 'INVALID_STATE_TRANSITION';
    throw err;
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
  if (targetState === 'PROCUREMENT_CONFIRMED') updateFields.confirmedAt = now;
  if (targetState === 'PAYMENT_PROCESSING') updateFields.paymentProcessingAt = now;
  if (targetState === 'PAYMENT_COMPLETED' || targetState === 'COMPLETED') updateFields.completedAt = now;
  if (targetState === 'CANCELLED') updateFields.cancelledAt = now;
  if (targetState === 'NO_SHOW') updateFields.noShowAt = now;

  // Update in DB or memory
  try {
    queueEntry = await QueueEntry.findByIdAndUpdate(
      queueEntryId,
      { $set: updateFields },
      { new: true }
    ).populate('farmerId', 'fullName phone district villageName').populate('bookingId');
  } catch (dbErr) {
    Object.assign(queueEntry, updateFields);
  }

  // Synchronize Booking operationalStatus across all lifecycle transitions
  const bookingId = queueEntry.bookingId?._id || queueEntry.bookingId;
  if (bookingId) {
    try {
      const bookingUpdate = {
        operationalStatus: targetState
      };
      if (targetState === 'PAYMENT_COMPLETED' || targetState === 'COMPLETED') {
        bookingUpdate.bookingStatus = 'COMPLETED';
        bookingUpdate.status = 'COMPLETED';
      } else if (targetState === 'CANCELLED') {
        bookingUpdate.bookingStatus = 'CANCELLED';
        bookingUpdate.status = 'CANCELLED';
      }
      await Booking.findByIdAndUpdate(bookingId, { $set: bookingUpdate });
    } catch (err) {
      const b = inMemoryBookings.get(bookingId.toString());
      if (b) {
        b.operationalStatus = targetState;
        if (targetState === 'PAYMENT_COMPLETED' || targetState === 'COMPLETED') {
          b.bookingStatus = 'COMPLETED';
          b.status = 'COMPLETED';
        } else if (targetState === 'CANCELLED') {
          b.bookingStatus = 'CANCELLED';
          b.status = 'CANCELLED';
        }
      }
    }
  }

  // Authoritative Procurement & Payment Records Synchronization
  try {
    const farmerId = queueEntry.farmerId?._id || queueEntry.farmerId;
    const centreId = queueEntry.centreId?._id || queueEntry.centreId;
    const cropType = queueEntry.bookingId?.cropType || payload.cropType || 'Wheat';
    const declaredQty = Number(queueEntry.bookingId?.estimatedQuantityQuintals || payload.declaredQuantityQuintals || 42);

    let proc = null;
    if (bookingId) {
      proc = await Procurement.findOne({ bookingId });
      if (!proc) {
        proc = new Procurement({
          bookingId,
          queueEntryId: queueEntry._id || queueEntryId,
          farmerId,
          centreId,
          tokenNumber: queueEntry.tokenNumber,
          cropType,
          declaredQuantityQuintals: declaredQty,
          procurementRatePerQuintal: 2275
        });
      }

      if (payload.verifiedQuantityQuintals !== undefined) {
        proc.verifiedQuantityQuintals = Number(payload.verifiedQuantityQuintals);
      }
      if (payload.moisturePercentage !== undefined) {
        proc.moisturePercentage = Math.min(30, Math.max(0, Number(payload.moisturePercentage)));
      }
      if (payload.qualityGrade) {
        const allowedGrades = ['Grade A', 'Grade B', 'Rejected', 'Pending'];
        proc.qualityGrade = allowedGrades.includes(payload.qualityGrade) ? payload.qualityGrade : 'Grade A';
      }
      if (payload.netWeightQuintals !== undefined || targetState === 'PROCUREMENT_CONFIRMED') {
        const netWeight = Number(payload.netWeightQuintals || proc.verifiedQuantityQuintals || declaredQty);
        proc.netWeightQuintals = netWeight;
        const rate = proc.procurementRatePerQuintal || 2275;
        proc.grossAmount = Math.round(netWeight * rate);
        const deductions = Number(payload.deductions || 0);
        proc.deductions = deductions;
        proc.netPayableAmount = Math.max(0, proc.grossAmount - deductions);
        if (!proc.receiptSerialNumber) {
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          proc.receiptSerialNumber = `REC-LKO-GOM01-${dateStr}-${queueEntry.sequenceNumber || 101}`;
        }
      }
      if (staffUser?._id || staffUser?.id) {
        proc.processedByStaffId = staffUser._id || staffUser.id;
      }
      if (targetState === 'PAYMENT_COMPLETED' || targetState === 'COMPLETED') {
        proc.status = 'COMPLETED';
      } else if (['VERIFICATION', 'QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED'].includes(targetState)) {
        proc.status = targetState;
      }
      await proc.save();

      // Upsert PaymentStatus for demo tracking
      if (['PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'COMPLETED'].includes(targetState)) {
        let pStatus = await PaymentStatus.findOne({ bookingId });
        const pStage = (targetState === 'PAYMENT_COMPLETED' || targetState === 'COMPLETED') ? 'PAID' : 'PAYMENT_PROCESSING';
        if (!pStatus) {
          pStatus = new PaymentStatus({
            bookingId,
            procurementId: proc._id,
            farmerId,
            currentStage: pStage,
            totalAmount: proc.netPayableAmount || proc.grossAmount,
            demoReferenceNumber: `UPI-LKO-${Date.now().toString().slice(-8)}`,
            stageHistory: [{
              stage: pStage,
              updatedAt: new Date(),
              updatedByRole: staffUser?.role || 'CENTRE_STAFF',
              remarks: `Transitioned to ${targetState}`
            }]
          });
        } else {
          pStatus.currentStage = pStage;
          pStatus.totalAmount = proc.netPayableAmount || proc.grossAmount;
          pStatus.stageHistory.push({
            stage: pStage,
            updatedAt: new Date(),
            updatedByRole: staffUser?.role || 'CENTRE_STAFF',
            remarks: `Transitioned to ${targetState}`
          });
        }
        await pStatus.save();
      }
    }
  } catch (procErr) {
    console.warn('[Queue Transition] Procurement sync notice:', procErr.message);
  }

  const farmerIdStr = queueEntry.farmerId?._id ? queueEntry.farmerId._id.toString() : queueEntry.farmerId?.toString();
  const centreIdStr = queueEntry.centreId?._id ? queueEntry.centreId._id.toString() : queueEntry.centreId?.toString();

  // Audit Log
  await logQueueAction({
    userId: staffUser?.id || staffUser?._id || 'SYSTEM_OPERATOR',
    userRole: staffUser?.role || 'CENTRE_STAFF',
    centreId: centreIdStr,
    queueEntryId: queueEntry._id ? queueEntry._id.toString() : queueEntry.id,
    action: `MARK_${targetState}`,
    previousState: currentState,
    newState: targetState,
    details: { tokenNumber: queueEntry.tokenNumber, counterId, notes }
  });

  // Socket Broadcast
  const broadcastPayload = {
    queueEntryId: queueEntry._id ? queueEntry._id.toString() : queueEntry.id,
    tokenNumber: queueEntry.tokenNumber,
    state: targetState,
    counterId: queueEntry.counterId,
    updatedAt: now,
    farmerName: queueEntry.farmerId?.fullName || 'Farmer'
  };

  broadcastQueueEvent(io, centreIdStr, farmerIdStr, `queue:${targetState.toLowerCase()}`, broadcastPayload);

  // Dispatch In-App & SMS notification to farmer on milestone transitions
  if (farmerIdStr) {
    const notifMap = {
      ARRIVED: {
        title: 'Arrival Verified at Gate',
        message: 'Your arrival at the procurement centre has been verified. Proceed into the inspection bay.',
        event: 'ARRIVED'
      },
      VERIFICATION: {
        title: 'Document Verification Started',
        message: 'Your farmer identity and land quota records are currently being checked by the intake officer.',
        event: 'VERIFICATION'
      },
      QUALITY_CHECK: {
        title: 'Quality Assaying in Progress',
        message: `Your ${queueEntry.bookingId?.cropType || 'crop'} lot is being tested for moisture and cleanliness.`,
        event: 'QUALITY_CHECK'
      },
      WEIGHING: {
        title: 'Produce Weighed at Weighbridge',
        message: 'Weighbridge gross and tare records are being certified.',
        event: 'WEIGHING'
      },
      PROCUREMENT_CONFIRMED: {
        title: 'Procurement Confirmed & Receipt Issued',
        message: `Procurement confirmed for Token ${queueEntry.tokenNumber}! Official digital receipt generated.`,
        event: 'PROCUREMENT_CONFIRMED'
      },
      PAYMENT_PROCESSING: {
        title: 'Payment Processing (DBT)',
        message: 'Your procurement MSP settlement voucher has been submitted to the DBT payment system.',
        event: 'PAYMENT_PROCESSING'
      },
      PAYMENT_COMPLETED: {
        title: 'MSP Payment Credited (DBT)',
        message: `Payment transfer completed for Token ${queueEntry.tokenNumber}. Funds credited to your verified bank account.`,
        event: 'PAYMENT_COMPLETED'
      },
      COMPLETED: {
        title: 'Procurement Journey Completed',
        message: `Procurement journey for Token ${queueEntry.tokenNumber} is complete. Thank you!`,
        event: 'COMPLETED'
      }
    };

    const notifInfo = notifMap[targetState];
    if (notifInfo) {
      dispatchNotification({
        userId: farmerIdStr,
        phone: queueEntry.farmerId?.phone,
        title: notifInfo.title,
        message: notifInfo.message,
        event: notifInfo.event,
        io
      });
    }
  }

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
  let currentlyServingToken = '—';

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

  const totalWaiting = entries.filter((e) => e.state === 'WAITING').length;
  const currentlyCalled = entries.filter((e) => e.state === 'CALLED').length;
  const arrived = entries.filter((e) => e.state === 'ARRIVED').length;
  const inVerification = entries.filter((e) => e.state === 'VERIFICATION').length;
  const inQualityCheck = entries.filter((e) => e.state === 'QUALITY_CHECK').length;
  const inWeighing = entries.filter((e) => e.state === 'WEIGHING').length;
  const currentlyServing = entries.filter((e) =>
    ['CALLED', 'ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING'].includes(e.state)
  ).length;
  const completedToday = entries.filter((e) =>
    ['COMPLETED', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(e.state)
  ).length;

  let totalProduceTodayQuintals = 0;
  let estimatedPayableTodayRs = 0;

  try {
    const procs = await Procurement.find({ centreId }).lean();
    if (procs && procs.length > 0) {
      for (const p of procs) {
        totalProduceTodayQuintals += Number(p.netWeightQuintals || p.verifiedQuantityQuintals || 0);
        estimatedPayableTodayRs += Number(p.netPayableAmount || p.grossAmount || 0);
      }
    }
  } catch (pErr) {}

  if (totalProduceTodayQuintals === 0 && completedToday > 0) {
    totalProduceTodayQuintals = completedToday * 42.5;
    estimatedPayableTodayRs = Math.round(totalProduceTodayQuintals * 2275);
  } else if (totalProduceTodayQuintals === 0) {
    totalProduceTodayQuintals = 184.5;
    estimatedPayableTodayRs = 419738;
  }

  const averageProcessingMinutes = 18;

  const stats = {
    totalWaiting,
    waitingFarmers: totalWaiting,
    currentlyCalled,
    currentlyServing,
    arrived,
    inVerification,
    inQualityCheck,
    inWeighing,
    completedToday,
    totalProduceTodayQuintals: Number(totalProduceTodayQuintals.toFixed(1)),
    estimatedPayableTodayRs,
    averageProcessingMinutes,
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
