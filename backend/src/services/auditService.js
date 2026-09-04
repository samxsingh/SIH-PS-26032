const AuditLog = require('../models/AuditLog');

const inMemoryAuditLogs = [];

const logQueueAction = async ({
  userId,
  userRole,
  centreId,
  queueEntryId,
  action,
  previousState,
  newState,
  details = {},
  ipAddress = '127.0.0.1'
}) => {
  try {
    const entry = {
      userId,
      userRole,
      centreId,
      queueEntryId,
      action,
      previousState,
      newState,
      details,
      ipAddress,
      createdAt: new Date()
    };

    try {
      await AuditLog.create(entry);
    } catch (dbErr) {
      inMemoryAuditLogs.push(entry);
    }
    return true;
  } catch (err) {
    console.warn('[Audit Log Warning] Failed to persist audit trail:', err.message);
    return false;
  }
};

module.exports = {
  logQueueAction,
  logAuditEvent: logQueueAction,
  inMemoryAuditLogs
};
