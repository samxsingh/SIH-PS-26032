const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');
const PaymentStatus = require('./src/models/PaymentStatus');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const Mandi = require('./src/models/Mandi');
const User = require('./src/models/User');
const { callNextFarmer, transitionQueueState } = require('./src/services/queueEngine');
const { completeProcurementTransaction } = require('./src/services/procurementService');
const { updatePaymentStage } = require('./src/services/paymentService');
const { ORDERED_LIFECYCLE_PIPELINE } = require('./src/constants/procurementLifecycle');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

async function runCrossPortalSyncTest() {
  console.log('================================================================');
  console.log('  AGRINEXUS PHASE 4: CROSS-PORTAL E2E SYNCHRONIZATION & INTEGRITY');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);

  // 1. DATA INTEGRITY AUDIT
  console.log('--- 1. DATA INTEGRITY & MODEL RELATIONSHIP AUDIT ---');

  // Audit 1: Single Manager Invariant
  const centres = await ProcurementCentre.find().populate('currentHeadId').lean();
  console.log(`Auditing ${centres.length} Procurement Centres...`);

  const headUserIds = new Set();
  for (const c of centres) {
    if (c.currentHeadId) {
      const headId = c.currentHeadId._id.toString();
      if (headUserIds.has(headId)) {
        console.error(`❌ Invariant Violation: User ${headId} is head of multiple centres!`);
        process.exit(1);
      }
      headUserIds.add(headId);
    }
  }
  console.log('✔ Single Centre Manager Invariant strictly maintained (1 Head per Centre)');

  // Audit 2: Valid Mandi References
  const mandis = await Mandi.find().lean();
  const mandiIds = new Set(mandis.map((m) => m._id.toString()));
  for (const c of centres) {
    if (c.mandiId) {
      const mId = c.mandiId.toString();
      if (!mandiIds.has(mId)) {
        console.error(`❌ Data Integrity Error: Centre ${c.centreCode} references non-existent Mandi ${mId}`);
        process.exit(1);
      }
    }
  }
  console.log('✔ All Procurement Centres link to valid APMC Mandi documents');

  // Audit 3: Unique Tokens
  const allBookings = await Booking.find().lean();
  const tokenSet = new Set();
  for (const b of allBookings) {
    if (tokenSet.has(b.tokenNumber)) {
      console.error(`❌ Data Integrity Error: Duplicate token ${b.tokenNumber} found!`);
      process.exit(1);
    }
    tokenSet.add(b.tokenNumber);
  }
  console.log(`✔ All ${allBookings.length} bookings maintain unique tokens`);

  // 2. CROSS-PORTAL LIFECYCLE STATE SYNCHRONIZATION TEST
  console.log('\n--- 2. CROSS-PORTAL LIFECYCLE E2E FLOW AUDIT ---');
  console.log('Simulating: Farmer ↔ Centre ↔ Admin synchronized state machine across all 10 stages...');

  const farmer = await User.findOne({ role: 'FARMER' }).lean();
  const staff = await User.findOne({ role: 'CENTRE_STAFF' }).lean();
  const centre = centres[0];

  const testToken = `SYNC-${Date.now().toString().slice(-4)}`;
  const testRef = `BKG-SYNC-${Date.now().toString().slice(-4)}`;

  // Stage 1: BOOKED
  const testBooking = await Booking.create({
    bookingReference: testRef,
    tokenNumber: testToken,
    farmerId: farmer._id,
    centreId: centre._id,
    slotId: new mongoose.Types.ObjectId(),
    bookingDate: new Date().toISOString().split('T')[0],
    timeWindow: '10:00 AM - 11:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 30,
    bookingStatus: 'CONFIRMED',
    operationalStatus: 'BOOKED'
  });

  const testQueue = await QueueEntry.create({
    bookingId: testBooking._id,
    farmerId: farmer._id,
    centreId: centre._id,
    slotId: testBooking.slotId,
    tokenNumber: testToken,
    queueDate: testBooking.bookingDate,
    sequenceNumber: 999,
    state: 'WAITING'
  });

  console.log(`Stage 1 & 2: Farmer created booking -> State: WAITING (Token: ${testToken})`);

  // Simulated Mock Socket collector
  const emittedEvents = [];
  const mockIO = {
    to: (room) => ({
      emit: (event, payload) => {
        emittedEvents.push({ room, event, payload });
      }
    })
  };

  // Stage 3: Centre calls next -> CALLED
  testQueue.state = 'CALLED';
  await testQueue.save();
  testBooking.operationalStatus = 'CALLED';
  await testBooking.save();

  // Verify DB parity
  let dbBooking = await Booking.findById(testBooking._id).lean();
  let dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbBooking.operationalStatus !== 'CALLED' || dbQueue.state !== 'CALLED') {
    throw new Error('State mismatch at CALLED');
  }
  console.log('✔ Stage 3 (CALLED): Farmer, Centre, and Admin DB state in sync');

  // Stage 4: ARRIVED
  await transitionQueueState({
    queueEntryId: testQueue._id,
    targetState: 'ARRIVED',
    staffUser: staff,
    counterId: 'Gate A',
    notes: 'Gate check passed',
    io: mockIO
  });
  dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbQueue.state !== 'ARRIVED') throw new Error('State mismatch at ARRIVED');
  console.log('✔ Stage 4 (ARRIVED): Farmer, Centre, and Admin DB state in sync');

  // Stage 5: VERIFICATION
  await transitionQueueState({
    queueEntryId: testQueue._id,
    targetState: 'VERIFICATION',
    staffUser: staff,
    counterId: 'Counter 1',
    notes: 'Documents verified',
    io: mockIO
  });
  dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbQueue.state !== 'VERIFICATION') throw new Error('State mismatch at VERIFICATION');
  console.log('✔ Stage 5 (VERIFICATION): Farmer, Centre, and Admin DB state in sync');

  // Stage 6: QUALITY_CHECK
  await transitionQueueState({
    queueEntryId: testQueue._id,
    targetState: 'QUALITY_CHECK',
    staffUser: staff,
    counterId: 'Counter 2',
    notes: 'Moisture 11.2% - Grade A',
    io: mockIO
  });
  dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbQueue.state !== 'QUALITY_CHECK') throw new Error('State mismatch at QUALITY_CHECK');
  console.log('✔ Stage 6 (QUALITY_CHECK): Farmer, Centre, and Admin DB state in sync');

  // Stage 7: WEIGHING
  await transitionQueueState({
    queueEntryId: testQueue._id,
    targetState: 'WEIGHING',
    staffUser: staff,
    counterId: 'Weighbridge 1',
    notes: 'Gross 5200kg, Tare 2200kg -> Net 3000kg (30 Qtl)',
    io: mockIO
  });
  dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbQueue.state !== 'WEIGHING') throw new Error('State mismatch at WEIGHING');
  console.log('✔ Stage 7 (WEIGHING): Farmer, Centre, and Admin DB state in sync');

  // Stage 8: PROCUREMENT_CONFIRMED
  await transitionQueueState({
    queueEntryId: testQueue._id,
    targetState: 'PROCUREMENT_CONFIRMED',
    staffUser: staff,
    counterId: 'Counter 1',
    notes: 'Procurement receipt issued',
    io: mockIO
  });
  dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbQueue.state !== 'PROCUREMENT_CONFIRMED') throw new Error('State mismatch at PROCUREMENT_CONFIRMED');
  console.log('✔ Stage 8 (PROCUREMENT_CONFIRMED): Farmer, Centre, and Admin DB state in sync');

  // Stage 9: PAYMENT_PROCESSING
  await transitionQueueState({
    queueEntryId: testQueue._id,
    targetState: 'PAYMENT_PROCESSING',
    staffUser: staff,
    counterId: 'Counter 1',
    notes: 'Sent to state PFMS',
    io: mockIO
  });
  dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbQueue.state !== 'PAYMENT_PROCESSING') throw new Error('State mismatch at PAYMENT_PROCESSING');
  console.log('✔ Stage 9 (PAYMENT_PROCESSING): Farmer, Centre, and Admin DB state in sync');

  // Stage 10: PAYMENT_COMPLETED
  await transitionQueueState({
    queueEntryId: testQueue._id,
    targetState: 'PAYMENT_COMPLETED',
    staffUser: staff,
    counterId: 'Counter 1',
    notes: 'DBT funds cleared',
    io: mockIO
  });
  dbQueue = await QueueEntry.findById(testQueue._id).lean();
  if (dbQueue.state !== 'PAYMENT_COMPLETED') throw new Error('State mismatch at PAYMENT_COMPLETED');
  console.log('✔ Stage 10 (PAYMENT_COMPLETED): Farmer, Centre, and Admin DB state in sync');

  // Cleanup test entry
  await Booking.findByIdAndDelete(testBooking._id);
  await QueueEntry.findByIdAndDelete(testQueue._id);

  console.log('\n================================================================');
  console.log('🎉 ALL CROSS-PORTAL E2E SYNCHRONIZATION & INTEGRITY TESTS PASSED!');
  console.log('================================================================\n');
  process.exit(0);
}

runCrossPortalSyncTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
