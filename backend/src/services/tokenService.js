const Booking = require('../models/Booking');

/**
 * Server-Side Digital Token Generator
 * Generates tokens in format: TOK-{CENTRE_CODE}-{YYYYMMDD}-{SEQUENCE}
 */
const generateTokenNumber = async (centreCode, dateStr) => {
  const cleanCentreCode = (centreCode || 'SEH01').toUpperCase().trim();
  const cleanDate = dateStr.replace(/-/g, ''); // YYYYMMDD

  // Query existing bookings for this centre and date to derive next sequence
  let count = 0;
  try {
    count = await Booking.countDocuments({
      bookingDate: dateStr
    });
  } catch (err) {
    count = Math.floor(Math.random() * 20);
  }

  const sequence = String(count + 1).padStart(3, '0');
  const tokenNumber = `TOK-${cleanCentreCode}-${cleanDate}-${sequence}`;

  // Unique Booking Reference
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingReference = `BKG-${cleanDate}-${randomSuffix}`;

  return {
    tokenNumber,
    bookingReference,
    sequenceNumber: count + 1
  };
};

module.exports = {
  generateTokenNumber
};
