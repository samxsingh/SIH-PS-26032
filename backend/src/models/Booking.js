const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    tokenNumber: {
      type: String,
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
    bookingDate: {
      type: String, // YYYY-MM-DD
      required: true
    },
    timeWindow: {
      type: String,
      required: true
    },
    cropType: {
      type: String,
      enum: ['Wheat', 'Paddy', 'Pulses', 'Mustard', 'Maize', 'Barley'],
      default: 'Wheat',
      required: true
    },
    estimatedQuantityQuintals: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1 quintal'],
      max: [500, 'Quantity cannot exceed 500 quintals per slot']
    },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED'
    },
    operationalStatus: {
      type: String,
      enum: [
        'BOOKED',
        'ARRIVED',
        'IN QUEUE',
        'QUALITY CHECK',
        'WEIGHING',
        'PROCUREMENT COMPLETE',
        'PAYMENT PROCESSING',
        'COMPLETED',
        'CANCELLED'
      ],
      default: 'BOOKED'
    },
    statusHistory: [
      {
        status: String,
        updatedAt: { type: Date, default: Date.now },
        updatedBy: String,
        note: String
      }
    ],
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedStaffName: {
      type: String,
      default: null
    },
    assignedStaffDesignation: {
      type: String,
      default: null
    },
    assignmentStatus: {
      type: String,
      enum: ['ASSIGNED', 'PENDING'],
      default: 'PENDING'
    },
    cancelledAt: Date,
    cancellationReason: String
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

bookingSchema.index({ farmerId: 1, bookingStatus: 1 });
bookingSchema.index({ centreId: 1, bookingDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
