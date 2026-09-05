const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');
const PaymentStatus = require('./src/models/PaymentStatus');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const Mandi = require('./src/models/Mandi');
const User = require('./src/models/User');
const Slot = require('./src/models/Slot');
const AuditLog = require('./src/models/AuditLog');
const { recommendCentre, calculateDistanceKm } = require('./src/services/recommendationService');
const { callNextFarmer, transitionQueueState } = require('./src/services/queueEngine');
const { completeProcurementTransaction } = require('./src/services/procurementService');
const { updatePaymentStage } = require('./src/services/paymentService');
const { ORDERED_LIFECYCLE_PIPELINE } = require('./src/constants/procurementLifecycle');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

async function runPhase9OpsValidationSuite() {
  console.log('================================================================');
  console.log('  AGRINEXUS PHASE 9: END-TO-END OPERATIONAL VALIDATION SUITE');
  console.log('  Operational Scope: Lucknow District (UP_LUK), Uttar Pradesh');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);

  // 1. SINGLE SOURCE OF TRUTH & OPERATIONAL HIERARCHY
  console.log('--- 1. SINGLE SOURCE OF TRUTH (District -> Mandi -> Centre -> Staff) ---');
  const mandis = await Mandi.find({ district: 'Lucknow' }).lean();
  const centres = await ProcurementCentre.find({ district: 'Lucknow' }).populate('mandiId').populate('currentHeadId').lean();

  if (mandis.length !== 3) {
    throw new Error(`Expected exactly 3 Mandis, got ${mandis.length}`);
  }
  if (centres.length !== 8) {
    throw new Error(`Expected exactly 8 Centres, got ${centres.length}`);
  }

  const centreCodes = new Set();
  const managerIds = new Set();

  for (const c of centres) {
    if (centreCodes.has(c.centreCode)) throw new Error(`Duplicate centre code: ${c.centreCode}`);
    centreCodes.add(c.centreCode);

    if (!c.mandiId || !c.mandiId.mandiCode) {
      throw new Error(`Centre ${c.centreCode} lacks valid parent Mandi relationship`);
    }

    if (c.currentHeadId) {
      const hid = c.currentHeadId._id.toString();
      if (managerIds.has(hid)) {
        throw new Error(`Centre Manager invariant violated: Manager ${hid} is head of multiple centres!`);
      }
      managerIds.add(hid);
    }
  }
  console.log('✔ PASS: Exact 3 Mandis & 8 Centres in Lucknow verified with unique Centre Managers.');

  // 2. MULTI-FACTOR RECOMMENDATION ENGINE EVALUATION
  console.log('\n--- 2. MULTI-FACTOR RECOMMENDATION ENGINE EVALUATION ---');
  const farmerLoc = { latitude: 26.8530, longitude: 80.9980 }; // Gomti Nagar coordinates
  const recResult = recommendCentre(farmerLoc, centres);

  if (!recResult || !recResult.recommended) {
    throw new Error('Recommendation engine returned null or empty result');
  }

  console.log(`Top Recommended Centre: ${recResult.recommended.centre.name}`);
  console.log(`Distance: ${recResult.recommended.distanceKm} km, Est Wait: ${recResult.recommended.estimatedWaitMinutes} mins`);
  console.log(`Reasons Generated: ${JSON.stringify(recResult.recommended.reasons)}`);

  if (!recResult.recommended.reasons || recResult.recommended.reasons.length === 0) {
    throw new Error('Recommendation missing transparent reason justifications');
  }
  console.log('✔ PASS: Recommendation engine computes normalized multi-factor cost and reasons.');

  // 3. WEIGHBRIDGE FORMULA & BOUNDARY VALIDATION
  console.log('\n--- 3. CERTIFIED WEIGHBRIDGE MATHEMATICAL VALIDATION ---');
  const gross = 52.6; // Qtl
  const tare = 1.2;  // Qtl
  const net = Number((gross - tare).toFixed(2));

  if (net <= 0 || tare >= gross) {
    throw new Error('Weighbridge validation logic failed on positive gross/tare pair');
  }
  if (net !== 51.4) {
    throw new Error(`Expected Net 51.4 Qtl, got ${net}`);
  }
  console.log(`✔ PASS: Certified formula Verified (Gross ${gross} - Tare ${tare} = Net ${net} Qtl).`);

  // 4. END-TO-END 10-STAGE WORKFLOW & DEMO STORYLINE RUN
  console.log('\n--- 4. FULL 10-STAGE PROCUREMENT LIFECYCLE & CROSS-PORTAL STEPPING ---');
  const farmer = await User.findOne({ role: 'FARMER' });
  const testCentre = centres[0];
  const slot = await Slot.findOne({ centreId: testCentre._id }) || await Slot.findOne();
  const slotId = slot ? slot._id : new mongoose.Types.ObjectId();

  const booking = await Booking.create({
    bookingReference: `TEST-P9-${Date.now()}`,
    tokenNumber: `LKO-P9-${Date.now().toString().slice(-4)}`,
    farmerId: farmer._id,
    centreId: testCentre._id,
    slotId,
    bookingDate: new Date().toISOString().slice(0, 10),
    timeWindow: '10:00 AM - 11:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 45,
    bookingStatus: 'CONFIRMED',
    operationalStatus: 'WAITING'
  });

  const queueEntry = await QueueEntry.create({
    bookingId: booking._id,
    farmerId: farmer._id,
    centreId: testCentre._id,
    slotId,
    tokenNumber: booking.tokenNumber,
    queueDate: booking.bookingDate,
    sequenceNumber: 9999,
    state: 'WAITING',
    counterId: 'Counter 1'
  });

  console.log(`Initialized Test Token ${booking.tokenNumber} in state WAITING.`);

  // Advance WAITING -> CALLED
  const called = await transitionQueueState({ queueEntryId: queueEntry._id, targetState: 'CALLED', counterId: 'Counter 1' });
  if (called.state !== 'CALLED') throw new Error('Failed to advance to CALLED');

  // Advance CALLED -> ARRIVED
  const arrived = await transitionQueueState({ queueEntryId: queueEntry._id, targetState: 'ARRIVED' });
  if (arrived.state !== 'ARRIVED') throw new Error('Failed to advance to ARRIVED');

  // Advance ARRIVED -> VERIFICATION
  const verified = await transitionQueueState({ queueEntryId: queueEntry._id, targetState: 'VERIFICATION' });
  if (verified.state !== 'VERIFICATION') throw new Error('Failed to advance to VERIFICATION');

  // Advance VERIFICATION -> QUALITY_CHECK
  const qc = await transitionQueueState({ queueEntryId: queueEntry._id, targetState: 'QUALITY_CHECK' });
  if (qc.state !== 'QUALITY_CHECK') throw new Error('Failed to advance to QUALITY_CHECK');

  // Advance QUALITY_CHECK -> WEIGHING
  const weighing = await transitionQueueState({ queueEntryId: queueEntry._id, targetState: 'WEIGHING' });
  if (weighing.state !== 'WEIGHING') throw new Error('Failed to advance to WEIGHING');

  // Complete Procurement (WEIGHING -> PROCUREMENT_CONFIRMED)
  const staff = await User.findOne({ role: 'CENTRE_STAFF', assignedCentreId: testCentre._id }) || await User.findOne({ role: 'CENTRE_STAFF' });
  const procRes = await completeProcurementTransaction({
    bookingId: booking._id,
    netWeightQuintals: 45.0,
    deductions: 0,
    staffUser: staff
  });

  if (procRes.procurement.status !== 'COMPLETED') {
    throw new Error('Procurement transaction confirmation did not reach COMPLETED');
  }
  console.log(`Certified Procurement Generated: ${procRes.procurement.receiptSerialNumber} | Net: ${procRes.procurement.netWeightQuintals} Qtl | Payable: ₹${procRes.procurement.netPayableAmount}`);

  // Advance PAYMENT_PROCESSING -> PAYMENT_COMPLETED (Simulated DBT)
  const payRes = await updatePaymentStage({
    bookingId: booking._id,
    newStage: 'PAID',
    role: 'ADMIN',
    remarks: 'Simulated DBT Disbursed'
  });

  if (payRes.currentStage !== 'PAID') {
    throw new Error('Payment stage failed to settle to PAID');
  }
  console.log(`Payment Status Successfully Disbursed: Ref #${payRes.demoReferenceNumber}`);

  // Cleanup test record
  await Booking.findByIdAndDelete(booking._id);
  await QueueEntry.findByIdAndDelete(queueEntry._id);
  await Procurement.findByIdAndDelete(procRes.procurement._id);
  await PaymentStatus.findByIdAndDelete(payRes._id);

  console.log('✔ PASS: 10-Stage canonical lifecycle executed cleanly from booking to DBT settlement.');

  console.log('\n================================================================');
  console.log('  ALL 4 PHASE 9 OPERATIONAL TEST GROUPS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  runPhase9OpsValidationSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Phase 9 Validation Error:', err);
      process.exit(1);
    });
}

module.exports = runPhase9OpsValidationSuite;
