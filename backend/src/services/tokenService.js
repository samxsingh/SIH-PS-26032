const Booking = require('../models/Booking');

/**
 * Server-Side Digital Token Generator
 * Generates tokens in format: TOK-{CENTRE_CODE}-{YYYYMMDD}-{SEQUENCE}
 */
const generateTokenNumber = async (centreCode, dateStr) => {
  const cleanCentreCode = (centreCode || 'LKO_GOM01').toUpperCase().trim();
  const prefix = cleanCentreCode.startsWith('LKO_') ? cleanCentreCode.replace('LKO_', '') : cleanCentreCode;
  const cleanDate = dateStr.replace(/-/g, ''); // YYYYMMDD

  // Query existing bookings for this date to derive next sequence
  let count = 0;
  try {
    count = await Booking.countDocuments({
      bookingDate: dateStr
    });
  } catch (err) {
    count = 0;
  }

  const sequence = String(count + 1).padStart(3, '0');
  const tokenNumber = `${prefix}-${100 + (count + 1)}`;
  const bookingReference = `AGR-${prefix}-${cleanDate}-${sequence}`;

  return {
    tokenNumber,
    bookingReference,
    sequenceNumber: count + 1
  };
};

module.exports = {
  generateTokenNumber
};
