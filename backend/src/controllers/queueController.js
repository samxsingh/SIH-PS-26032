const QueueEntry = require('../models/QueueEntry');
const { getTodayIST } = require('../utils/dateUtils');
const {
  callNextFarmer,
  transitionQueueState,
  getFarmerQueueStatus,
  getCentreQueueStats
} = require('../services/queueEngine');
const { inMemoryQueueEntries } = require('../services/bookingService');
const { inMemoryCentres } = require('./centreController');

// Helper to determine authorized centre ID for staff
const getAuthorizedCentreId = (user, requestedCentreId) => {
  if (user.role === 'ADMIN') {
    return requestedCentreId || user.assignedCentreId || 'c1';
  }
  if (user.role === 'CENTRE_STAFF') {
    const assigned = user.assignedCentreId ? user.assignedCentreId.toString() : null;
    if (requestedCentreId && assigned && requestedCentreId.toString() !== assigned) {
      return null; // Explicitly reject unauthorized cross-centre operation attempt
    }
    return user.assignedCentreId || requestedCentreId;
  }
  return null;
};

const getTodayQueue = async (req, res, next) => {
  try {
    const centreId = getAuthorizedCentreId(req.user, req.query.centreId);
    if (!centreId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not assigned to a procurement centre.' }
      });
    }

    const dateStr = req.query.date || getTodayIST();

    let queue = [];
    try {
      queue = await QueueEntry.find({ centreId, queueDate: dateStr })
        .populate('farmerId', 'fullName phone district villageName')
        .sort({ sequenceNumber: 1 })
        .lean();
    } catch (dbErr) {
      for (const [, qe] of inMemoryQueueEntries) {
        if ((qe.centreId === centreId || qe.centreId.toString() === centreId.toString()) && qe.queueDate === dateStr) {
          queue.push(qe);
        }
      }
    }

    if (!queue || queue.length === 0) {
      for (const [, qe] of inMemoryQueueEntries) {
        if ((qe.centreId === centreId || qe.centreId.toString() === centreId.toString()) && qe.queueDate === dateStr) {
          queue.push(qe);
        }
      }
    }

    const formattedQueue = queue.map((q) => ({
      id: q._id ? q._id.toString() : q.id,
      tokenNumber: q.tokenNumber,
      sequenceNumber: q.sequenceNumber,
      state: q.state,
      timeWindow: q.timeWindow || '09:00 - 10:00 AM',
      counterId: q.counterId || 'Counter 1',
      calledAt: q.calledAt,
      arrivedAt: q.arrivedAt,
      completedAt: q.completedAt,
      farmer: q.farmerId || { fullName: 'Ramesh Kumar', phone: '9876543210' }
    }));

    res.status(200).json({
      success: true,
      centreId,
      date: dateStr,
      count: formattedQueue.length,
      data: formattedQueue
    });
  } catch (error) {
    next(error);
  }
};

const handleCallNext = async (req, res, next) => {
  try {
    const centreId = getAuthorizedCentreId(req.user, req.body.centreId);
    if (!centreId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Unauthorized staff centre assignment.' }
      });
    }

    const io = req.app.get('io');
    const { counterId } = req.body;

    const calledEntry = await callNextFarmer({
      centreId,
      queueDate: req.body.date,
      staffUser: req.user,
      counterId: counterId || 'Counter 1',
      io
    });

    res.status(200).json({
      success: true,
      message: `Token ${calledEntry.tokenNumber} called to ${counterId || 'Counter 1'}`,
      data: {
        queueEntry: calledEntry
      }
    });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      error: {
        code: error.code || 'CALL_NEXT_FAILED',
        message: error.message
      }
    });
  }
};

const handleTransition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetState, counterId, notes } = req.body;

    if (!targetState) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TARGET_STATE', message: 'Target state is required.' }
      });
    }

    const io = req.app.get('io');

    const updatedEntry = await transitionQueueState({
      queueEntryId: id,
      targetState,
      staffUser: req.user,
      counterId: counterId || 'Counter 1',
      notes: notes || '',
      io
    });

    res.status(200).json({
      success: true,
      message: `Queue status updated to ${targetState}`,
      data: {
        queueEntry: updatedEntry
      }
    });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      error: {
        code: error.code || 'TRANSITION_FAILED',
        message: error.message
      }
    });
  }
};

const getStats = async (req, res, next) => {
  try {
    const centreId = getAuthorizedCentreId(req.user, req.query.centreId);
    const dateStr = req.query.date || getTodayIST();

    const stats = await getCentreQueueStats(centreId, dateStr);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

const getMyQueueStatus = async (req, res, next) => {
  try {
    const farmerId = req.user.id || req.user._id;
    const status = await getFarmerQueueStatus(farmerId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayQueue,
  handleCallNext,
  handleTransition,
  getStats,
  getMyQueueStatus
};
