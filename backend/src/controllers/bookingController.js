const Booking = require('../models/Booking');
const QueueEntry = require('../models/QueueEntry');
const ProcurementCentre = require('../models/ProcurementCentre');
const { createBooking, inMemoryBookings, inMemoryQueueEntries } = require('../services/bookingService');
const { inMemoryCentres } = require('./centreController');

const createFarmerBooking = async (req, res, next) => {
  try {
    const farmerId = req.user.id || req.user._id;
    const { centreId, slotId, cropType, estimatedQuantityQuintals } = req.body;

    if (!centreId || !slotId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Centre ID and Slot ID are required.'
        }
      });
    }

    const booking = await createBooking({
      farmerId,
      centreId,
      slotId,
      cropType: cropType || 'Wheat',
      estimatedQuantityQuintals: Number(estimatedQuantityQuintals) || 50
    });

    // Populate centre info for response
    let centre = null;
    try {
      centre = await ProcurementCentre.findById(centreId).lean();
    } catch (err) {
      centre = inMemoryCentres.find((c) => c._id === centreId || c.id === centreId);
    }
    if (!centre) {
      centre = inMemoryCentres.find((c) => c._id === centreId || c.id === centreId) || inMemoryCentres[0];
    }

    const bookingObj = booking.toObject ? booking.toObject() : booking;

    res.status(201).json({
      success: true,
      message: 'Procurement slot booked successfully!',
      data: {
        booking: {
          ...bookingObj,
          id: booking._id ? booking._id.toString() : booking.id,
          centreName: centre.name,
          centreAddress: centre.address,
          centrePhone: centre.contactPhone,
          assignedStaffName: bookingObj.assignedStaffName,
          assignedStaffDesignation: bookingObj.assignedStaffDesignation,
          assignmentStatus: bookingObj.assignmentStatus || 'PENDING'
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BOOKING_FAILED',
        message: error.message
      }
    });
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const farmerId = req.user.id || req.user._id;

    let bookings = [];
    try {
      bookings = await Booking.find({ farmerId })
        .populate('centreId', 'name address district centreCode contactPhone')
        .sort({ createdAt: -1 })
        .lean();
    } catch (dbErr) {
      for (const [, b] of inMemoryBookings) {
        if (b.farmerId === farmerId || b.farmerId.toString() === farmerId.toString()) {
          const centre = inMemoryCentres.find((c) => c._id === b.centreId || c.id === b.centreId) || inMemoryCentres[0];
          bookings.push({
            ...b,
            centreId: centre
          });
        }
      }
    }

    if (!bookings || bookings.length === 0) {
      for (const [, b] of inMemoryBookings) {
        if (b.farmerId === farmerId || b.farmerId.toString() === farmerId.toString()) {
          const centre = inMemoryCentres.find((c) => c._id === b.centreId || c.id === b.centreId) || inMemoryCentres[0];
          bookings.push({
            ...b,
            centreId: centre
          });
        }
      }
    }

    // Enrich active bookings with real queue calculations
    const bookingIds = bookings.map((b) => b._id || b.id);
    let queueEntries = [];
    try {
      queueEntries = await QueueEntry.find({ bookingId: { $in: bookingIds } }).lean();
    } catch (qeErr) {
      queueEntries = [];
    }

    const formattedBookings = await Promise.all(
      bookings.map(async (b) => {
        const bIdStr = (b._id || b.id).toString();
        let qEntry = queueEntries.find((qe) => qe.bookingId?.toString() === bIdStr);
        if (!qEntry) {
          for (const [, qe] of inMemoryQueueEntries) {
            if (qe.bookingId?.toString() === bIdStr) {
              qEntry = qe;
              break;
            }
          }
        }

        const opStatus = b.operationalStatus || (b.bookingStatus === 'COMPLETED' ? 'COMPLETED' : b.bookingStatus === 'CANCELLED' ? 'CANCELLED' : 'BOOKED');
        const centreId = b.centreId?._id || b.centreId?.id || b.centreId;
        const queueDate = b.bookingDate;

        let queuePosition = null;
        let farmersAhead = 0;
        let estimatedWaitMinutes = 0;
        let currentlyServingToken = 'LKO-101';
        let assignedStation = qEntry?.counterId || 'Counter 01';

        if (qEntry) {
          assignedStation = qEntry.counterId || 'Counter 01';

          if (opStatus === 'WAITING') {
            try {
              const earlierWaitingCount = await QueueEntry.countDocuments({
                centreId,
                queueDate,
                state: 'WAITING',
                sequenceNumber: { $lt: qEntry.sequenceNumber }
              });
              queuePosition = earlierWaitingCount + 1;
              farmersAhead = earlierWaitingCount;
              estimatedWaitMinutes = Math.max(6, farmersAhead * 6);
            } catch (cntErr) {
              farmersAhead = Math.max(0, (qEntry.sequenceNumber || 1) - 1);
              queuePosition = farmersAhead + 1;
              estimatedWaitMinutes = Math.max(6, farmersAhead * 6);
            }

            try {
              const serving = await QueueEntry.findOne({
                centreId,
                queueDate,
                state: { $in: ['CALLED', 'ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING'] }
              }).sort({ updatedAt: -1 }).lean();
              if (serving) {
                currentlyServingToken = serving.tokenNumber;
              }
            } catch (srvErr) {
              // fallback
            }
          } else if (opStatus === 'CALLED') {
            queuePosition = 1;
            farmersAhead = 0;
            estimatedWaitMinutes = 0;
            currentlyServingToken = b.tokenNumber;
          } else if (['ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING'].includes(opStatus)) {
            queuePosition = 1;
            farmersAhead = 0;
            estimatedWaitMinutes = 0;
            currentlyServingToken = b.tokenNumber;
          }
        }

        return {
          id: bIdStr,
          bookingReference: b.bookingReference,
          tokenNumber: b.tokenNumber,
          bookingDate: b.bookingDate,
          timeWindow: b.timeWindow,
          cropType: b.cropType,
          estimatedQuantityQuintals: b.estimatedQuantityQuintals,
          bookingStatus: b.bookingStatus,
          operationalStatus: opStatus,
          statusHistory: b.statusHistory || [],
          assignedStaffName: b.assignedStaffName,
          assignedStaffDesignation: b.assignedStaffDesignation,
          assignmentStatus: b.assignmentStatus || 'PENDING',
          createdAt: b.createdAt,
          queuePosition,
          farmersAhead,
          estimatedWaitMinutes,
          currentlyServingToken,
          assignedStation,
          counterId: assignedStation,
          centre: b.centreId || {
            name: 'Krishi Seva Procurement Centre — Gomti Nagar',
            address: 'Vibhuti Khand, Gomti Nagar, Lucknow',
            district: 'Lucknow',
            contactPhone: '+91 522 2720011'
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      data: formattedBookings
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id || req.user._id;

    let booking = null;
    try {
      booking = await Booking.findOne({ _id: id, farmerId });
      if (booking) {
        booking.bookingStatus = 'CANCELLED';
        booking.cancelledAt = new Date();
        await booking.save();
      }
    } catch (err) {
      booking = inMemoryBookings.get(id);
      if (booking) {
        booking.bookingStatus = 'CANCELLED';
        booking.cancelledAt = new Date();
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found or unauthorized.'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let booking = null;
    try {
      booking = await Booking.findById(id)
        .populate('centreId', 'name address district centreCode contactPhone location')
        .populate('farmerId', 'fullName phone district villageName')
        .lean();
    } catch (dbErr) {
      booking = inMemoryBookings.get(id);
    }

    if (!booking) {
      booking = inMemoryBookings.get(id);
      if (!booking) {
        for (const [, b] of inMemoryBookings) {
          if (b.id === id || b._id === id || b.bookingReference === id) {
            booking = b;
            break;
          }
        }
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' }
      });
    }

    // Role-based authorization & ownership check:
    // If user is a FARMER, ensure the booking belongs to this farmer
    const userId = req.user.id || req.user._id;
    if (req.user.role === 'FARMER') {
      const bookingFarmerId = booking.farmerId?._id ? booking.farmerId._id.toString() : (booking.farmerId ? booking.farmerId.toString() : '');
      if (bookingFarmerId && bookingFarmerId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to access this booking.' }
        });
      }
    } else if (req.user.role === 'CENTRE_STAFF') {
      const staffCentreId = req.user.assignedCentreId ? req.user.assignedCentreId.toString() : '';
      const bookingCentreId = booking.centreId?._id ? booking.centreId._id.toString() : (booking.centreId ? booking.centreId.toString() : '');
      if (staffCentreId && bookingCentreId && staffCentreId !== bookingCentreId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Staff can only view bookings for their assigned procurement centre.' }
        });
      }
    }

    let centre = booking.centreId;
    if (!centre || typeof centre === 'string') {
      centre = inMemoryCentres.find((c) => c._id === booking.centreId || c.id === booking.centreId) || inMemoryCentres[0];
    }

    const bookingObj = booking.toObject ? booking.toObject() : booking;

    res.status(200).json({
      success: true,
      data: {
        ...bookingObj,
        id: booking._id ? booking._id.toString() : booking.id,
        centre: {
          id: centre._id || centre.id,
          name: centre.name,
          address: centre.address,
          contactPhone: centre.contactPhone,
          centreCode: centre.centreCode,
          district: centre.district,
          location: centre.location
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFarmerBooking,
  getMyBookings,
  cancelBooking,
  getBookingById
};

