/**
 * Standardized Indian Standard Time (IST / Asia/Kolkata) Date & Time Utilities
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date in IST formatted as YYYY-MM-DD
 * Ensures that operational day calculations belong to the official Indian calendar day
 */
const getTodayIST = (dateObj = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dateObj); // Returns YYYY-MM-DD
  } catch (err) {
    return dateObj.toISOString().split('T')[0];
  }
};

/**
 * Format timestamp into readable Indian Standard Time string
 */
const formatISTDateTime = (dateInput) => {
  if (!dateInput) return 'Data unavailable';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Data unavailable';
    return d.toLocaleString('en-IN', {
      timeZone: IST_TIMEZONE,
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch (err) {
    return 'Data unavailable';
  }
};

/**
 * Calculate Payment SLA duration in hours between two timestamps
 * Returns null if either timestamp is missing, preserving the zero vs unavailable distinction
 */
const calculateSlaHours = (startAt, endAt) => {
  if (!startAt || !endAt) return null;
  try {
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return null;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10; // 1 decimal place
  } catch (err) {
    return null;
  }
};

module.exports = {
  IST_TIMEZONE,
  getTodayIST,
  formatISTDateTime,
  calculateSlaHours
};
