const Booking = require('../models/Booking');
const ProcurementCentre = require('../models/ProcurementCentre');
const { createBooking, inMemoryBookings } = require('../services/bookingService');
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

    const formattedBookings = bookings.map((b) => ({
      id: b._id ? b._id.toString() : b.id,
      bookingReference: b.bookingReference,
      tokenNumber: b.tokenNumber,
      bookingDate: b.bookingDate,
      timeWindow: b.timeWindow,
      cropType: b.cropType,
      estimatedQuantityQuintals: b.estimatedQuantityQuintals,
      bookingStatus: b.bookingStatus,
      operationalStatus: b.operationalStatus || (b.bookingStatus === 'COMPLETED' ? 'COMPLETED' : b.bookingStatus === 'CANCELLED' ? 'CANCELLED' : 'BOOKED'),
      statusHistory: b.statusHistory || [],
      assignedStaffName: b.assignedStaffName,
      assignedStaffDesignation: b.assignedStaffDesignation,
      assignmentStatus: b.assignmentStatus || 'PENDING',
      createdAt: b.createdAt,
      centre: b.centreId || {
        name: 'Krishi Seva Procurement Centre — Gomti Nagar',
        address: 'Vibhuti Khand, Gomti Nagar, Lucknow',
        district: 'Lucknow',
        contactPhone: '+91 522 2720011'
      }
    }));

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

module.exports = {
  createFarmerBooking,
  getMyBookings,
  cancelBooking
};
