const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true
    },
    queueEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueEntry'
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: true
    },
    tokenNumber: {
      type: String,
      required: true
    },
    cropType: {
      type: String,
      enum: ['Wheat', 'Paddy', 'Pulses', 'Mustard'],
      required: true
    },
    declaredQuantityQuintals: {
      type: Number,
      required: true
    },
    verifiedQuantityQuintals: {
      type: Number,
      default: 0
    },
    netWeightQuintals: {
      type: Number,
      default: 0
    },
    moisturePercentage: {
      type: Number,
      min: [0, 'Moisture percentage cannot be negative'],
      max: [100, 'Moisture percentage cannot exceed 100%'],
      default: 12.0
    },
    qualityGrade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Rejected', 'Pending'],
      default: 'Pending'
    },
    procurementRatePerQuintal: {
      type: Number,
      required: true,
      default: 2275 // MSP rate per quintal for Wheat
    },
    grossAmount: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netPayableAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'VERIFICATION',
        'QUALITY_CHECK',
        'WEIGHING',
        'PROCUREMENT_CONFIRMED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED'
      ],
      default: 'PENDING'
    },
    receiptSerialNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    processedByStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

procurementSchema.index({ farmerId: 1, status: 1 });
procurementSchema.index({ centreId: 1, createdAt: -1 });

const Procurement = mongoose.model('Procurement', procurementSchema);

module.exports = Procurement;
