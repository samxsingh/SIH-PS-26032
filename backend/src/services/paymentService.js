const PaymentStatus = require('../models/PaymentStatus');
const { getTodayIST } = require('../utils/dateUtils');

const PAYMENT_STAGES = [
  'SLOT_CONFIRMED',
  'PRODUCE_RECEIVED',
  'QUALITY_VERIFIED',
  'WEIGHED',
  'PROCUREMENT_COMPLETED',
  'PAYMENT_INITIATED',
  'PAYMENT_PROCESSING',
  'PAID'
];

const inMemoryPayments = new Map();

const getStageIndex = (stage) => PAYMENT_STAGES.indexOf(stage);

const generateDemoReferenceNumber = () => {
  const dateStr = getTodayIST().replace(/-/g, '');
  const seqSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PAY-DEMO-${dateStr}-${seqSuffix}`;
};

/**
 * Initialize Payment Status record for a new booking
 */
const initializePaymentStatus = async ({ bookingId, farmerId, initialStage = 'SLOT_CONFIRMED' }) => {
  const demoRef = generateDemoReferenceNumber();
  let paymentDoc = null;

  try {
    paymentDoc = await PaymentStatus.create({
      bookingId,
      farmerId,
      currentStage: initialStage,
      demoReferenceNumber: demoRef,
      stageHistory: [{ stage: initialStage, updatedAt: new Date(), remarks: 'Slot confirmed by farmer' }]
    });
  } catch (err) {
    paymentDoc = {
      _id: 'pay_' + Date.now(),
      bookingId,
      farmerId,
      currentStage: initialStage,
      demoReferenceNumber: demoRef,
      totalAmount: 0,
      stageHistory: [{ stage: initialStage, updatedAt: new Date(), remarks: 'Slot confirmed by farmer' }]
    };
    inMemoryPayments.set(bookingId.toString(), paymentDoc);
  }

  return paymentDoc;
};

/**
 * Update Payment Stage (Controlled Forward Transitions Only)
 */
const updatePaymentStage = async ({ bookingId, procurementId, farmerId, newStage, totalAmount, role = 'STAFF', remarks = '' }) => {
  let paymentDoc = null;
  try {
    paymentDoc = await PaymentStatus.findOne({ bookingId });
  } catch (err) {
    paymentDoc = inMemoryPayments.get(bookingId.toString());
  }

  if (!paymentDoc) {
    // Auto initialize if missing
    paymentDoc = await initializePaymentStatus({ bookingId, farmerId, initialStage: 'SLOT_CONFIRMED' });
  }

  const currentIdx = getStageIndex(paymentDoc.currentStage);
  const newIdx = getStageIndex(newStage);

  // Reject backward transitions unless moving to PAYMENT_FAILED
  if (newStage !== 'PAYMENT_FAILED' && newIdx !== -1 && currentIdx !== -1 && newIdx < currentIdx) {
    throw new Error(`Invalid payment status transition from ${paymentDoc.currentStage} to ${newStage}.`);
  }

  if (paymentDoc.save) {
    paymentDoc.currentStage = newStage;
    if (procurementId) paymentDoc.procurementId = procurementId;
    if (totalAmount !== undefined) paymentDoc.totalAmount = totalAmount;

    paymentDoc.stageHistory.push({
      stage: newStage,
      updatedAt: new Date(),
      updatedByRole: role,
      remarks: remarks || `Status advanced to ${newStage}`
    });

    await paymentDoc.save();
  } else {
    paymentDoc.currentStage = newStage;
    if (procurementId) paymentDoc.procurementId = procurementId;
    if (totalAmount !== undefined) paymentDoc.totalAmount = totalAmount;
    paymentDoc.stageHistory.push({
      stage: newStage,
      updatedAt: new Date(),
      updatedByRole: role,
      remarks: remarks || `Status advanced to ${newStage}`
    });
    inMemoryPayments.set(bookingId.toString(), paymentDoc);
  }

  return paymentDoc;
};

/**
 * Fetch Payment Status for a booking
 */
const getPaymentStatusByBooking = async (bookingId) => {
  let paymentDoc = null;
  try {
    paymentDoc = await PaymentStatus.findOne({ bookingId }).lean();
  } catch (err) {
    paymentDoc = inMemoryPayments.get(bookingId.toString());
  }

  if (!paymentDoc) {
    paymentDoc = inMemoryPayments.get(bookingId.toString());
  }

  if (!paymentDoc) {
    return {
      currentStage: 'SLOT_CONFIRMED',
      demoReferenceNumber: generateDemoReferenceNumber(),
      totalAmount: 0,
      stageHistory: [{ stage: 'SLOT_CONFIRMED', updatedAt: new Date(), remarks: 'Slot confirmed' }],
      isDemoMode: true,
      demoNotice: 'Demo Payment Status — Visual Tracker Only for Hackathon MVP'
    };
  }

  return {
    ...paymentDoc,
    isDemoMode: true,
    demoNotice: 'Demo Payment Status — Visual Tracker Only for Hackathon MVP'
  };
};

module.exports = {
  PAYMENT_STAGES,
  initializePaymentStatus,
  updatePaymentStage,
  getPaymentStatusByBooking,
  inMemoryPayments
};
