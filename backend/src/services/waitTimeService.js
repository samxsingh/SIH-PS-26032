/**
 * Wait-Time Estimation Service (Deterministic MVP Implementation)
 * Calculates estimated wait time based on active queue count, current load, and average processing time per farmer.
 */
const AVERAGE_PROCESSING_MINUTES_PER_FARMER = 8; // 8 minutes average per farmer

const calculateEstimatedWaitTime = (centre) => {
  if (!centre) return 30;

  const activeQueue = centre.activeQueueCount || Math.round((centre.currentLoadPercentage / 100) * 20);
  const estimatedWait = Math.max(10, activeQueue * AVERAGE_PROCESSING_MINUTES_PER_FARMER);

  return estimatedWait;
};

module.exports = {
  calculateEstimatedWaitTime,
  AVERAGE_PROCESSING_MINUTES_PER_FARMER
};
