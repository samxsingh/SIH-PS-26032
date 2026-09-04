const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Slot date is required']
    },
    startTime: {
      type: String, // e.g. "09:00"
      required: true
    },
    endTime: {
      type: String, // e.g. "10:00"
      required: true
    },
    timeWindow: {
      type: String, // e.g. "09:00 - 10:00 AM"
      required: true
    },
    maxCapacityQuintals: {
      type: Number,
      required: true,
      default: 200
    },
    bookedCapacityQuintals: {
      type: Number,
      default: 0
    },
    maxFarmersAllowed: {
      type: Number,
      required: true,
      default: 15
    },
    bookedFarmersCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL', 'CLOSED'],
      default: 'AVAILABLE'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

slotSchema.index({ centreId: 1, date: 1 });
slotSchema.index({ date: 1, status: 1 });

const Slot = mongoose.model('Slot', slotSchema);

module.exports = Slot;
