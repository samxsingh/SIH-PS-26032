const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['IN_APP', 'SMS'],
      default: 'IN_APP'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    event: {
      type: String,
      default: 'GENERAL'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
