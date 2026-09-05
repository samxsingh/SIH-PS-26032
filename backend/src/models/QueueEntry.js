const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true
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
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true
    },
    tokenNumber: {
      type: String,
      required: true
    },
    queueDate: {
      type: String, // YYYY-MM-DD
      required: true
    },
    sequenceNumber: {
      type: Number,
      required: true
    },
    state: {
      type: String,
      enum: [
        'BOOKED',
        'WAITING',
        'CALLED',
        'ARRIVED',
        'VERIFICATION',
        'QUALITY_CHECK',
        'WEIGHING',
        'PROCUREMENT_CONFIRMED',
        'PAYMENT_PROCESSING',
        'PAYMENT_COMPLETED',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'REJECTED'
      ],
      default: 'WAITING',
      required: true
    },
    calledAt: Date,
    arrivedAt: Date,
    verificationStartedAt: Date,
    weighingStartedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    noShowAt: Date,
    counterId: {
      type: String,
      default: 'Counter 1'
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

// Database indexes for fast operational queue queries
queueEntrySchema.index({ centreId: 1, queueDate: 1, state: 1 });
queueEntrySchema.index({ farmerId: 1, state: 1 });
queueEntrySchema.index({ tokenNumber: 1 });

const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

module.exports = QueueEntry;
