const ProcurementCentre = require('../models/ProcurementCentre');
const QueueEntry = require('../models/QueueEntry');
const { calculateCentreHealth, THRESHOLDS } = require('./centreHealthService');
const { getTodayIST } = require('../utils/dateUtils');

/**
 * Generate Deduplicated Operational Alerts
 */
const generateOperationalAlerts = async (centres = []) => {
  const alerts = [];
  const dateStr = getTodayIST();

  for (const centre of centres) {
    const centreId = centre._id ? centre._id.toString() : centre.id;
    const waitTime = centre.estimatedWaitMinutes || 30;
    const loadPct = centre.queueLoadPercentage || 45;
    const health = calculateCentreHealth(waitTime, loadPct);

    if (health === 'CRITICAL') {
      alerts.push({
        id: `alert_crit_${centreId}`,
        severity: 'CRITICAL',
        title: `Severe Congestion at ${centre.name}`,
        centreId,
        centreName: centre.name,
        district: centre.district || 'Sehore',
        reason: `Estimated wait time (${waitTime} mins) exceeds 90-minute threshold (Queue load: ${loadPct}%).`,
        metric: `${waitTime} min wait`,
        timestamp: new Date(),
        actionLabel: 'Investigate Centre'
      });
    } else if (health === 'WATCH') {
      alerts.push({
        id: `alert_watch_${centreId}`,
        severity: 'WATCH',
        title: `Elevated Load at ${centre.name}`,
        centreId,
        centreName: centre.name,
        district: centre.district || 'Sehore',
        reason: `Queue load (${loadPct}%) or wait time (${waitTime} mins) requires monitoring.`,
        metric: `${loadPct}% load`,
        timestamp: new Date(),
        actionLabel: 'Monitor Centre'
      });
    }
  }

  // Deduplicate alerts by id
  const alertMap = new Map();
  alerts.forEach((a) => alertMap.set(a.id, a));
  return Array.from(alertMap.values());
};

module.exports = {
  generateOperationalAlerts
};
