const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userRole: {
      type: String,
      required: true
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre'
    },
    queueEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueEntry'
    },
    action: {
      type: String,
      required: true // e.g. CALL_NEXT, MARK_ARRIVED, START_VERIFICATION, START_WEIGHING, COMPLETE, CANCEL, NO_SHOW
    },
    previousState: String,
    newState: String,
    details: {
      type: Object,
      default: {}
    },
    ipAddress: String
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

auditLogSchema.index({ centreId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
