const Notification = require('../models/Notification');

const inMemoryNotifications = [];

/**
 * In-App Notification Provider
 * Writes to Notification collection and emits real-time Socket event
 */
const sendInAppNotification = async ({ userId, title, message, event, io }) => {
  try {
    const doc = {
      userId,
      type: 'IN_APP',
      title,
      message,
      event: event || 'GENERAL',
      isRead: false,
      createdAt: new Date()
    };

    try {
      const created = await Notification.create(doc);
      if (io) {
        io.to(`farmer_${userId}`).emit('notification:new', created);
      }
    } catch (dbErr) {
      const memDoc = { ...doc, _id: 'notif_' + Date.now() };
      inMemoryNotifications.push(memDoc);
      if (io) {
        io.to(`farmer_${userId}`).emit('notification:new', memDoc);
      }
    }
    return true;
  } catch (err) {
    console.warn('[Notification Provider Notice] In-App delivery warning:', err.message);
    return false;
  }
};

/**
 * Simulated SMS Provider
 * Logs simulated SMS to console without external network dependencies
 */
const sendSimulatedSms = async ({ phone, message }) => {
  try {
    const maskedPhone = phone ? phone.replace(/(\d{2})\d{5}(\d{3})/, '$1XXXXX$2') : '+91 XXXXX XXXXX';
    console.log(`[SIMULATED SMS LOG] To: ${maskedPhone} | Message: "${message}"`);
    return true;
  } catch (err) {
    console.warn('[Notification Provider Notice] Simulated SMS warning:', err.message);
    return false;
  }
};

/**
 * Central Notification Dispatcher (Non-Blocking Guarantee)
 * Will NEVER throw an error that interrupts procurement database transactions.
 */
const dispatchNotification = async ({ userId, phone, title, message, event, io }) => {
  try {
    // Non-blocking parallel execution
    await Promise.all([
      sendInAppNotification({ userId, title, message, event, io }),
      sendSimulatedSms({ phone, message })
    ]);
  } catch (err) {
    console.warn('[Notification Service] Resilient failure fallback:', err.message);
  }
};

module.exports = {
  dispatchNotification,
  sendInAppNotification,
  sendSimulatedSms,
  inMemoryNotifications
};
