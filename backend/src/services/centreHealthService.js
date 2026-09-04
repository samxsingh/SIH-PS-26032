/**
 * Centre Health & Congestion Evaluation Service
 * Evaluates centre operational health based on deterministic thresholds
 */

const THRESHOLDS = {
  WAIT_TIME_WATCH_MINUTES: 60,
  WAIT_TIME_CRITICAL_MINUTES: 90,
  LOAD_WATCH_PERCENTAGE: 70,
  LOAD_CRITICAL_PERCENTAGE: 90
};

/**
 * Calculate Centre Health Status
 * HEALTHY: wait < 60 min AND load < 70%
 * WATCH: wait 60-90 min OR load 70-90%
 * CRITICAL: wait > 90 min OR load > 90%
 */
const calculateCentreHealth = (estimatedWaitMinutes = 0, queueLoadPercentage = 0) => {
  const wait = Number(estimatedWaitMinutes) || 0;
  const load = Number(queueLoadPercentage) || 0;

  if (wait > THRESHOLDS.WAIT_TIME_CRITICAL_MINUTES || load >= THRESHOLDS.LOAD_CRITICAL_PERCENTAGE) {
    return 'CRITICAL';
  }

  if (wait >= THRESHOLDS.WAIT_TIME_WATCH_MINUTES || load >= THRESHOLDS.LOAD_WATCH_PERCENTAGE) {
    return 'WATCH';
  }

  return 'HEALTHY';
};

/**
 * Determine Centre Operational Status
 * OPEN, BUSY, CONGESTED, CLOSED, NO_ACTIVITY
 */
const determineOperationalStatus = (isActive = true, activeQueueCount = 0, estimatedWaitMinutes = 0, loadPercentage = 0) => {
  if (!isActive) return 'CLOSED';

  if (activeQueueCount === 0) return 'NO_ACTIVITY';

  if (estimatedWaitMinutes > THRESHOLDS.WAIT_TIME_CRITICAL_MINUTES || loadPercentage >= THRESHOLDS.LOAD_CRITICAL_PERCENTAGE) {
    return 'CONGESTED';
  }

  if (estimatedWaitMinutes >= THRESHOLDS.WAIT_TIME_WATCH_MINUTES || loadPercentage >= THRESHOLDS.LOAD_WATCH_PERCENTAGE) {
    return 'BUSY';
  }

  return 'OPEN';
};

module.exports = {
  THRESHOLDS,
  calculateCentreHealth,
  determineOperationalStatus
};
