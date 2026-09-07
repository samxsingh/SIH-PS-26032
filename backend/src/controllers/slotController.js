const Slot = require('../models/Slot');
const ProcurementCentre = require('../models/ProcurementCentre');
const { inMemorySlots } = require('../services/bookingService');

// Generate 8 standard 1-hour delivery windows for a centre & date
const generateStandardSlots = (centreId, dateStr) => {
  const timeWindows = [
    { start: '08:00', end: '09:00', label: '08:00 AM - 09:00 AM' },
    { start: '09:00', end: '10:00', label: '09:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 01:00 PM' },
    { start: '14:00', end: '15:00', label: '02:00 PM - 03:00 PM' },
    { start: '15:00', end: '16:00', label: '03:00 PM - 04:00 PM' },
    { start: '16:00', end: '17:00', label: '04:00 PM - 05:00 PM' },
  ];

  return timeWindows.map((tw, index) => {
    const id = `slot_${centreId}_${dateStr.replace(/-/g, '')}_${index + 1}`;

    // Mark 11:00 AM slot as full for demo variance if needed
    const isFullDemo = index === 2 && centreId.toString().includes('AST');
    const bookedCount = isFullDemo ? 15 : Math.floor(index * 1.5);
    const status = bookedCount >= 15 ? 'FULL' : 'AVAILABLE';

    const slotObj = {
      _id: id,
      id,
      centreId,
      date: dateStr,
      startTime: tw.start,
      endTime: tw.end,
      timeWindow: tw.label,
      maxCapacityQuintals: 200,
      bookedCapacityQuintals: bookedCount * 12,
      maxFarmersAllowed: 15,
      bookedFarmersCount: bookedCount,
      status
    };

    inMemorySlots.set(id, slotObj);
    return slotObj;
  });
};

const getSlots = async (req, res, next) => {
  try {
    const { centreId, date } = req.query;

    if (!centreId || !date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'Both centreId and date parameters are required.'
        }
      });
    }

    let centre = null;
    try {
      centre = await ProcurementCentre.findById(centreId);
    } catch (cErr) {
      // Check in-memory centres
      const { inMemoryCentres } = require('./centreController');
      if (inMemoryCentres) {
        centre = inMemoryCentres.find((c) => c._id === centreId || c.id === centreId || c.centreCode === centreId);
      }
    }

    if (centre && (centre.isActive === false || centre.verificationStatus === 'INACTIVE')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CENTRE_INACTIVE',
          message: 'This procurement centre is currently inactive and not accepting deliveries.'
        }
      });
    }

    let slots = [];
    try {
      slots = await Slot.find({ centreId, date }).lean();
    } catch (dbErr) {
      // Use standard generator
    }

    if (!slots || slots.length === 0) {
      slots = generateStandardSlots(centreId, date);
    } else {
      slots = slots.map((s) => {
        const id = s._id.toString();
        inMemorySlots.set(id, s);
        return {
          ...s,
          id
        };
      });
    }

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSlots,
  generateStandardSlots
};
