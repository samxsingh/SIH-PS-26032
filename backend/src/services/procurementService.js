const Procurement = require('../models/Procurement');
const Booking = require('../models/Booking');
const QueueEntry = require('../models/QueueEntry');
const ProcurementCentre = require('../models/ProcurementCentre');
const { logQueueAction } = require('./auditService');
const { dispatchNotification } = require('./notificationService');
const { updatePaymentStage, initializePaymentStatus } = require('./paymentService');
const { inMemoryBookings } = require('./bookingService');

const { getMspRateForCrop, MSP_POLICY_RATES } = require('../config/policyRates');
const { getTodayIST } = require('../utils/dateUtils');

const inMemoryProcurements = new Map();

/**
 * Record Produce Verification
 */
const recordVerification = async ({ bookingId, verifiedQuantityQuintals, moisturePercentage, qualityGrade, staffUser, notes, io }) => {
  let booking = null;
  try {
    booking = await Booking.findById(bookingId).populate('farmerId', 'fullName phone');
  } catch (err) {
    booking = inMemoryBookings.get(bookingId.toString());
  }

  if (!booking && inMemoryBookings.has(bookingId.toString())) {
    booking = inMemoryBookings.get(bookingId.toString());
  }

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found.`);
  }

  if (staffUser && staffUser.role === 'CENTRE_STAFF') {
    const staffCentre = staffUser.assignedCentreId ? staffUser.assignedCentreId.toString() : null;
    const bookingCentre = (booking.centreId?._id || booking.centreId).toString();
    if (staffCentre && staffCentre !== bookingCentre) {
      throw new Error('Access denied. You are only authorized to operate on bookings for your assigned procurement centre.');
    }
  }

  const verQty = Number(verifiedQuantityQuintals) || booking.estimatedQuantityQuintals;
  const moisture = Number(moisturePercentage) || 12.0;

  if (moisture < 0 || moisture > 100) {
    throw new Error('Moisture percentage must be between 0% and 100%.');
  }

  if (verQty <= 0) {
    throw new Error('Verified quantity must be greater than 0 quintals.');
  }

  const mspRate = getMspRateForCrop(booking.cropType);

  let procurement = null;
  try {
    procurement = await Procurement.findOne({ bookingId });
    if (!procurement) {
      procurement = new Procurement({
        bookingId,
        farmerId: booking.farmerId?._id || booking.farmerId,
        centreId: booking.centreId,
        tokenNumber: booking.tokenNumber,
        cropType: booking.cropType,
        declaredQuantityQuintals: booking.estimatedQuantityQuintals,
        procurementRatePerQuintal: mspRate,
        status: 'VERIFICATION'
      });
    }

    procurement.verifiedQuantityQuintals = verQty;
    procurement.moisturePercentage = moisture;
    procurement.qualityGrade = qualityGrade || 'Grade A';
    procurement.processedByStaffId = staffUser.id || staffUser._id;
    procurement.status = 'VERIFICATION';
    if (notes) procurement.notes = notes;

    await procurement.save();
  } catch (dbErr) {
    procurement = {
      _id: 'proc_' + Date.now(),
      bookingId,
      farmerId: booking.farmerId?._id || booking.farmerId,
      centreId: booking.centreId,
      tokenNumber: booking.tokenNumber,
      cropType: booking.cropType,
      declaredQuantityQuintals: booking.estimatedQuantityQuintals,
      verifiedQuantityQuintals: verQty,
      moisturePercentage: moisture,
      qualityGrade: qualityGrade || 'Grade A',
      procurementRatePerQuintal: mspRate,
      status: 'VERIFICATION',
      notes
    };
    inMemoryProcurements.set(bookingId.toString(), procurement);
  }

  // Update Payment Status Stage to QUALITY_VERIFIED
  await updatePaymentStage({
    bookingId,
    procurementId: procurement._id ? procurement._id.toString() : procurement.id,
    farmerId: booking.farmerId?._id || booking.farmerId,
    newStage: 'QUALITY_VERIFIED',
    role: staffUser.role,
    remarks: `Quality verified (${qualityGrade || 'Grade A'}, Moisture: ${moisture}%)`
  });

  // Non-blocking notification
  dispatchNotification({
    userId: booking.farmerId?._id ? booking.farmerId._id.toString() : booking.farmerId,
    phone: booking.farmerId?.phone,
    title: 'Produce Quality Verified',
    message: `Your ${booking.cropType} quality inspection passed (${qualityGrade || 'Grade A'}, ${moisture}% moisture).`,
    event: 'VERIFICATION_STARTED',
    io
  });

  return procurement;
};

/**
 * Record Net Weighing & Complete Procurement Transaction
 */
const completeProcurementTransaction = async ({ bookingId, netWeightQuintals, deductions = 0, staffUser, notes, io }) => {
  let booking = null;
  try {
    booking = await Booking.findById(bookingId).populate('farmerId', 'fullName phone').populate('centreId', 'name centreCode address');
  } catch (err) {
    booking = inMemoryBookings.get(bookingId.toString());
  }

  if (!booking && inMemoryBookings.has(bookingId.toString())) {
    booking = inMemoryBookings.get(bookingId.toString());
  }

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found.`);
  }

  if (staffUser && staffUser.role === 'CENTRE_STAFF') {
    const staffCentre = staffUser.assignedCentreId ? staffUser.assignedCentreId.toString() : null;
    const bookingCentre = (booking.centreId?._id || booking.centreId).toString();
    if (staffCentre && staffCentre !== bookingCentre) {
      throw new Error('Access denied. You are only authorized to operate on bookings for your assigned procurement centre.');
    }
  }

  const netWeight = Number(netWeightQuintals);
  if (!netWeight || netWeight <= 0) {
    throw new Error('Net weight must be a positive number greater than 0 quintals.');
  }

  let procurement = null;
  try {
    procurement = await Procurement.findOne({ bookingId });
  } catch (err) {
    procurement = inMemoryProcurements.get(bookingId.toString());
  }

  if (!procurement) {
    procurement = inMemoryProcurements.get(bookingId.toString());
  }

  const mspRate = getMspRateForCrop(booking.cropType);
  const grossAmount = Math.round(netWeight * mspRate);
  const netPayableAmount = Math.max(0, grossAmount - Number(deductions));

  const cleanCentreCode = booking.centreId?.centreCode || 'SEH01';
  const cleanDate = getTodayIST().replace(/-/g, '');
  const seqSuffix = Math.floor(100 + Math.random() * 900);
  const receiptSerialNumber = `REC-${cleanCentreCode}-${cleanDate}-${seqSuffix}`;

  if (procurement && procurement.save) {
    procurement.netWeightQuintals = netWeight;
    procurement.grossAmount = grossAmount;
    procurement.deductions = Number(deductions) || 0;
    procurement.netPayableAmount = netPayableAmount;
    procurement.status = 'COMPLETED';
    procurement.receiptSerialNumber = receiptSerialNumber;
    procurement.completedAt = new Date();
    await procurement.save();
  } else {
    procurement = {
      _id: 'proc_' + Date.now(),
      bookingId,
      farmerId: booking.farmerId?._id || booking.farmerId,
      centreId: booking.centreId?._id || booking.centreId,
      tokenNumber: booking.tokenNumber,
      cropType: booking.cropType,
      declaredQuantityQuintals: booking.estimatedQuantityQuintals,
      verifiedQuantityQuintals: procurement?.verifiedQuantityQuintals || netWeight,
      netWeightQuintals: netWeight,
      moisturePercentage: procurement?.moisturePercentage || 12.0,
      qualityGrade: procurement?.qualityGrade || 'Grade A',
      procurementRatePerQuintal: mspRate,
      grossAmount,
      deductions: Number(deductions) || 0,
      netPayableAmount,
      status: 'COMPLETED',
      receiptSerialNumber,
      completedAt: new Date()
    };
    inMemoryProcurements.set(bookingId.toString(), procurement);
  }

  // Update Payment Status Stage to PROCUREMENT_COMPLETED
  await updatePaymentStage({
    bookingId,
    procurementId: procurement._id ? procurement._id.toString() : procurement.id,
    farmerId: booking.farmerId?._id || booking.farmerId,
    newStage: 'PROCUREMENT_COMPLETED',
    totalAmount: netPayableAmount,
    role: staffUser.role,
    remarks: `Procurement completed: ${netWeight} Qtl @ ₹${mspRate}/Qtl. Total payable: ₹${netPayableAmount.toLocaleString('en-IN')}`
  });

  // Audit Log
  await logQueueAction({
    userId: staffUser.id || staffUser._id,
    userRole: staffUser.role,
    centreId: booking.centreId?._id || booking.centreId,
    action: 'PROCUREMENT_COMPLETED',
    previousState: 'WEIGHING',
    newState: 'COMPLETED',
    details: { tokenNumber: booking.tokenNumber, netWeight, netPayableAmount, receiptSerialNumber }
  });

  // Non-blocking notification
  dispatchNotification({
    userId: booking.farmerId?._id ? booking.farmerId._id.toString() : booking.farmerId,
    phone: booking.farmerId?.phone,
    title: 'Procurement Completed & Receipt Issued',
    message: `Procurement completed! Receipt #${receiptSerialNumber}. Recorded ${netWeight} Qtl ${booking.cropType}. Net payable amount: ₹${netPayableAmount.toLocaleString('en-IN')}.`,
    event: 'PROCUREMENT_COMPLETED',
    io
  });

  return {
    procurement,
    receipt: {
      receiptSerialNumber,
      tokenNumber: booking.tokenNumber,
      farmerName: booking.farmerId?.fullName || 'Farmer',
      farmerPhone: booking.farmerId?.phone || '',
      centreName: booking.centreId?.name || 'Krishi Seva Procurement Centre',
      centreAddress: booking.centreId?.address || '',
      cropType: booking.cropType,
      verifiedQuantityQuintals: procurement.verifiedQuantityQuintals || netWeight,
      netWeightQuintals: netWeight,
      moisturePercentage: procurement.moisturePercentage || 12.0,
      qualityGrade: procurement.qualityGrade || 'Grade A',
      procurementRatePerQuintal: mspRate,
      grossAmount,
      deductions: Number(deductions) || 0,
      netPayableAmount,
      completedAt: procurement.completedAt || new Date()
    }
  };
};

module.exports = {
  recordVerification,
  completeProcurementTransaction,
  getMspRateForCrop,
  inMemoryProcurements
};
