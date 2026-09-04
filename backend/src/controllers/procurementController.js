const {
  recordVerification,
  completeProcurementTransaction,
  inMemoryProcurements
} = require('../services/procurementService');
const Procurement = require('../models/Procurement');
const Booking = require('../models/Booking');

const handleRecordVerification = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { verifiedQuantityQuintals, moisturePercentage, qualityGrade, notes } = req.body;
    const io = req.app.get('io');

    const procurement = await recordVerification({
      bookingId,
      verifiedQuantityQuintals,
      moisturePercentage,
      qualityGrade,
      staffUser: req.user,
      notes,
      io
    });

    res.status(200).json({
      success: true,
      message: 'Produce quality verification recorded successfully.',
      data: procurement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'VERIFICATION_FAILED', message: error.message }
    });
  }
};

const handleCompleteProcurement = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { netWeightQuintals, deductions, notes } = req.body;
    const io = req.app.get('io');

    const result = await completeProcurementTransaction({
      bookingId,
      netWeightQuintals,
      deductions,
      staffUser: req.user,
      notes,
      io
    });

    res.status(200).json({
      success: true,
      message: 'Procurement transaction completed and digital receipt generated.',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'PROCUREMENT_COMPLETION_FAILED', message: error.message }
    });
  }
};

const getProcurementDetails = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    let procurement = null;
    try {
      procurement = await Procurement.findOne({ bookingId })
        .populate('farmerId', 'fullName phone district villageName')
        .populate('centreId', 'name address centreCode')
        .populate('bookingId', 'tokenNumber bookingDate timeWindow cropType estimatedQuantityQuintals')
        .lean();
    } catch (err) {
      procurement = inMemoryProcurements.get(bookingId);
    }

    if (!procurement) {
      procurement = inMemoryProcurements.get(bookingId);
    }

    if (!procurement) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Procurement transaction record not found for this booking.' }
      });
    }

    res.status(200).json({
      success: true,
      data: procurement
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleRecordVerification,
  handleCompleteProcurement,
  getProcurementDetails
};
