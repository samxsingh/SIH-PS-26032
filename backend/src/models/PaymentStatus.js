const mongoose = require('mongoose');

const paymentStatusSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procurement'
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    currentStage: {
      type: String,
      enum: [
        'SLOT_CONFIRMED',
        'PRODUCE_RECEIVED',
        'QUALITY_VERIFIED',
        'WEIGHED',
        'PROCUREMENT_COMPLETED',
        'PAYMENT_INITIATED',
        'PAYMENT_PROCESSING',
        'PAID',
        'PAYMENT_FAILED'
      ],
      default: 'SLOT_CONFIRMED',
      required: true
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    demoReferenceNumber: {
      type: String,
      required: true
    },
    stageHistory: [
      {
        stage: String,
        updatedAt: { type: Date, default: Date.now },
        updatedByRole: String,
        remarks: String
      }
    ],
    failureReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

paymentStatusSchema.index({ farmerId: 1, currentStage: 1 });
paymentStatusSchema.index({ bookingId: 1 });

const PaymentStatus = mongoose.model('PaymentStatus', paymentStatusSchema);

module.exports = PaymentStatus;
