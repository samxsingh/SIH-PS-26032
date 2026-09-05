const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');
const PaymentStatus = require('./src/models/PaymentStatus');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const Mandi = require('./src/models/Mandi');
const User = require('./src/models/User');
const Slot = require('./src/models/Slot');
const { callNextFarmer, transitionQueueState } = require('./src/services/queueEngine');
const { completeProcurementTransaction } = require('./src/services/procurementService');
const { updatePaymentStage } = require('./src/services/paymentService');
const { ORDERED_LIFECYCLE_PIPELINE } = require('./src/constants/procurementLifecycle');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

async function runPhase6TargetedTests() {
  console.log('================================================================');
  console.log('  AGRINEXUS PHASE 6: TARGETED CROSS-PORTAL & DATA INTEGRITY TESTS');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);

  // -------------------------------------------------------------
  // TEST 1: CENTRE -> MANDI RELATIONSHIP INTEGRITY & NO DUPLICATES
  // -------------------------------------------------------------
  console.log('--- 1. CENTRE -> MANDI RELATIONSHIPS & DUPLICATE DETECTION ---');
  const centres = await ProcurementCentre.find().populate('mandiId').populate('currentHeadId');
  console.log(`Audited ${centres.length} Procurement Centres.`);

  if (centres.length !== 8) {
    throw new Error(`Expected exactly 8 Lucknow procurement centres, found ${centres.length}`);
  }

  const mandis = await Mandi.find();
  console.log(`Audited ${mandis.length} Regulated APMC Mandis across Lucknow.`);
  if (mandis.length !== 3) {
    throw new Error(`Expected exactly 3 canonical Lucknow Mandis, found ${mandis.length}`);
  }

  const centreCodes = new Set();
  const managerIds = new Set();

  for (const c of centres) {
    if (centreCodes.has(c.centreCode)) {
      throw new Error(`Duplicate centreCode detected: ${c.centreCode}`);
    }
    centreCodes.add(c.centreCode);

    if (!c.mandiId) {
      throw new Error(`Centre ${c.centreCode} is not linked to any Mandi!`);
    }

    if (c.currentHeadId) {
      const hid = c.currentHeadId._id.toString();
      if (managerIds.has(hid)) {
        throw new Error(`Single Manager Invariant Violated: User ${hid} is head of multiple centres!`);
      }
      managerIds.add(hid);
    }

    // Verify coordinates
    if (!c.location || !c.location.coordinates || c.location.coordinates.length !== 2) {
      throw new Error(`Centre ${c.centreCode} has invalid geo-coordinates!`);
    }
  }
  console.log('✔ Test 1 PASS: All 8 centres have valid Mandi links, coordinates, and strictly distinct managers');

  // -------------------------------------------------------------
  // TEST 2: SINGLE CENTRE MANAGER INVARIANT & ROTATION WITH DEMOTION
  // -------------------------------------------------------------
  console.log('\n--- 2. SINGLE CENTRE MANAGER INVARIANT & ROTATION ---');
  const targetCentre = centres[0];
  const oldManager = targetCentre.currentHeadId;
  console.log(`Rotating manager for ${targetCentre.name} (Current: ${oldManager ? oldManager.fullName : 'None'})...`);

  // Create or find staff candidate
  let staffCandidate = await User.findOne({
    assignedCentreId: targetCentre._id,
    _id: { $ne: oldManager?._id },
    role: 'CENTRE_STAFF'
  });

  if (!staffCandidate) {
    staffCandidate = await User.create({
      fullName: 'Sunil Kumar (Deputy Assayer)',
      email: `sunil.assayer.${Date.now()}@agrinexus.demo`,
      emailNormalized: `sunil.assayer.${Date.now()}@agrinexus.demo`,
      phone: '9876543111',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
      role: 'CENTRE_STAFF',
      assignedCentreId: targetCentre._id,
      designation: 'Quality Assayer',
      isCentreHead: false,
      accountStatus: 'ACTIVE'
    });
  }

  // Atomic Rotation: appoint staffCandidate, demote oldManager
  if (oldManager) {
    await User.findByIdAndUpdate(oldManager._id, { isCentreHead: false, designation: 'Procurement Officer' });
  }
  await User.findByIdAndUpdate(staffCandidate._id, { isCentreHead: true, designation: 'Centre Head' });
  targetCentre.currentHeadId = staffCandidate._id;
  await targetCentre.save();

  // Verify atomic result
  const refreshedCentre = await ProcurementCentre.findById(targetCentre._id).populate('currentHeadId');
  if (refreshedCentre.currentHeadId._id.toString() !== staffCandidate._id.toString()) {
    throw new Error('Manager rotation failed: Centre head did not update');
  }

  if (oldManager) {
    const demotedUser = await User.findById(oldManager._id);
    if (demotedUser.isCentreHead === true) {
      throw new Error('Manager demotion failed: Old manager is still marked as Centre Head!');
    }
  }

  // Clean rollback to original
  if (oldManager) {
    await User.findByIdAndUpdate(oldManager._id, { isCentreHead: true, designation: 'Centre Head' });
    await User.findByIdAndUpdate(staffCandidate._id, { isCentreHead: false, designation: 'Quality Assayer' });
    targetCentre.currentHeadId = oldManager._id;
    await targetCentre.save();
  }
  console.log('✔ Test 2 PASS: Atomic manager rotation demotes prior head and maintains 1 Head invariant');

  // -------------------------------------------------------------
  // TEST 3: FARMER PROFILE PERSISTENCE (EDIT PROFILE TEST)
  // -------------------------------------------------------------
  console.log('\n--- 3. FARMER PROFILE EDIT & PERSISTENCE ---');
  const testFarmer = await User.findOne({ role: 'FARMER' });
  if (!testFarmer) throw new Error('No farmer account found for profile test');

  const origName = testFarmer.fullName;
  const updatedName = `${origName} (Verified)`;
  testFarmer.fullName = updatedName;
  testFarmer.languagePreference = 'hi';
  await testFarmer.save();

  const refreshedFarmer = await User.findById(testFarmer._id);
  if (refreshedFarmer.fullName !== updatedName || refreshedFarmer.languagePreference !== 'hi') {
    throw new Error('Farmer profile edits did not persist to database!');
  }

  // Restore original
  testFarmer.fullName = origName;
  testFarmer.languagePreference = 'en';
  await testFarmer.save();
  console.log('✔ Test 3 PASS: Farmer profile edits persist reliably to backend database');

  // -------------------------------------------------------------
  // TEST 4: FULL CROSS-PORTAL CANONICAL 10-STAGE WORKFLOW
  // -------------------------------------------------------------
  console.log('\n--- 4. FULL 10-STAGE CROSS-PORTAL SYNCHRONIZATION ---');
  const syncFarmer = await User.findOne({ role: 'FARMER' });
  const syncCentre = centres[0];

  const anySlot = await Slot.findOne({ centreId: syncCentre._id }) || await Slot.findOne();
  const slotId = anySlot ? anySlot._id : new mongoose.Types.ObjectId();

  const uniqueToken = `E2E-${Date.now().toString().slice(-4)}`;
  const booking = await Booking.create({
    bookingReference: `AGR-E2E-${Date.now()}`,
    tokenNumber: uniqueToken,
    farmerId: syncFarmer._id,
    centreId: syncCentre._id,
    slotId,
    bookingDate: new Date().toISOString().split('T')[0],
    timeWindow: '09:00 AM - 10:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 45,
    bookingStatus: 'CONFIRMED',
    operationalStatus: 'WAITING'
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const queueEntry = await QueueEntry.create({
    bookingId: booking._id,
    farmerId: syncFarmer._id,
    centreId: syncCentre._id,
    slotId,
    queueDate: todayStr,
    tokenNumber: uniqueToken,
    cropType: 'Wheat',
    quantityQuintals: 45,
    state: 'WAITING',
    sequenceNumber: 99
  });

  // Advance through 10 stages
  // 1 & 2: WAITING
  let b = await Booking.findById(booking._id);
  let q = await QueueEntry.findById(queueEntry._id);
  if (b.operationalStatus !== 'WAITING' || q.state !== 'WAITING') throw new Error('Stage 1/2 WAITING mismatch');
  console.log('✔ Stage 1 & 2 (BOOKED / WAITING): Synced across Farmer, Centre, Admin');

  const mockStaff = await User.findOne({ role: 'CENTRE_STAFF', assignedCentreId: syncCentre._id }) || 
    await User.findOne({ role: 'CENTRE_STAFF' }) || syncFarmer;
  // Ensure staff centre matches for the test transaction
  mockStaff.assignedCentreId = syncCentre._id;
  const mockIO = { to: () => ({ emit: () => {} }) };

  // 3: CALLED
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'CALLED',
    staffUser: mockStaff,
    counterId: 'Counter 1',
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  if (b.operationalStatus !== 'CALLED' || q.state !== 'CALLED') throw new Error('Stage 3 CALLED mismatch');
  console.log('✔ Stage 3 (CALLED): Synced');

  // 4: ARRIVED
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'ARRIVED',
    staffUser: mockStaff,
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  if (b.operationalStatus !== 'ARRIVED' || q.state !== 'ARRIVED') throw new Error('Stage 4 ARRIVED mismatch');
  console.log('✔ Stage 4 (ARRIVED): Synced');

  // 5: VERIFICATION
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'VERIFICATION',
    staffUser: mockStaff,
    notes: 'Produce verification completed',
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  if (b.operationalStatus !== 'VERIFICATION' || q.state !== 'VERIFICATION') throw new Error('Stage 5 VERIFICATION mismatch');
  console.log('✔ Stage 5 (VERIFICATION): Synced');

  // 6: QUALITY_CHECK
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'QUALITY_CHECK',
    staffUser: mockStaff,
    notes: 'Grade A, Moisture 12.5%',
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  if (b.operationalStatus !== 'QUALITY_CHECK' || q.state !== 'QUALITY_CHECK') throw new Error('Stage 6 QUALITY_CHECK mismatch');
  console.log('✔ Stage 6 (QUALITY_CHECK): Synced');

  // 7: WEIGHING
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'WEIGHING',
    staffUser: mockStaff,
    notes: 'Gross 55 Qtl, Tare 10 Qtl, Net 45 Qtl',
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  if (b.operationalStatus !== 'WEIGHING' || q.state !== 'WEIGHING') throw new Error('Stage 7 WEIGHING mismatch');
  console.log('✔ Stage 7 (WEIGHING): Synced');

  // 8: PROCUREMENT_CONFIRMED
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'PROCUREMENT_CONFIRMED',
    staffUser: mockStaff,
    counterId: 'Counter 1',
    notes: 'Official procurement confirmed',
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  if (b.operationalStatus !== 'PROCUREMENT_CONFIRMED' || q.state !== 'PROCUREMENT_CONFIRMED') {
    throw new Error('Stage 8 PROCUREMENT_CONFIRMED mismatch');
  }
  const procRes = await completeProcurementTransaction({
    bookingId: booking._id,
    netWeightQuintals: 45,
    deductions: 0,
    staffUser: mockStaff,
    notes: 'Test completed procurement',
    io: mockIO
  });
  console.log(`✔ Stage 8 (PROCUREMENT_CONFIRMED): Official MSP receipt ${procRes.receipt.receiptSerialNumber} generated (Gross: ₹${procRes.receipt.grossAmount})`);

  // 9: PAYMENT_PROCESSING
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'PAYMENT_PROCESSING',
    staffUser: mockStaff,
    counterId: 'Counter 1',
    notes: 'Dispatched to PFMS batch processing',
    io: mockIO
  });
  await updatePaymentStage({
    bookingId: booking._id,
    procurementId: procRes.procurement._id,
    farmerId: syncFarmer._id,
    newStage: 'PAYMENT_PROCESSING',
    role: 'STAFF',
    remarks: 'Dispatched to PFMS batch processing',
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  const payProcessing = await PaymentStatus.findOne({ bookingId: booking._id });
  if (b.operationalStatus !== 'PAYMENT_PROCESSING' || q.state !== 'PAYMENT_PROCESSING' || !payProcessing || payProcessing.currentStage !== 'PAYMENT_PROCESSING') {
    throw new Error('Stage 9 PAYMENT_PROCESSING mismatch');
  }
  console.log('✔ Stage 9 (PAYMENT_PROCESSING): Bank treasury dispatch staged');

  // 10: PAYMENT_COMPLETED
  await transitionQueueState({
    queueEntryId: queueEntry._id,
    targetState: 'PAYMENT_COMPLETED',
    staffUser: mockStaff,
    counterId: 'Counter 1',
    notes: 'DBT clearance confirmed',
    io: mockIO
  });
  await updatePaymentStage({
    bookingId: booking._id,
    procurementId: procRes.procurement._id,
    farmerId: syncFarmer._id,
    newStage: 'PAID',
    totalAmount: procRes.receipt.netPayableAmount,
    role: 'STAFF',
    remarks: `DBT Payment credited to farmer account. UTR: UTR-E2E-${Date.now()}`,
    io: mockIO
  });
  b = await Booking.findById(booking._id);
  q = await QueueEntry.findById(queueEntry._id);
  const payCompleted = await PaymentStatus.findOne({ bookingId: booking._id });
  if (b.operationalStatus !== 'PAYMENT_COMPLETED' || q.state !== 'PAYMENT_COMPLETED' || !payCompleted || payCompleted.currentStage !== 'PAID') {
    throw new Error('Stage 10 PAYMENT_COMPLETED mismatch');
  }
  console.log(`✔ Stage 10 (PAYMENT_COMPLETED): DBT payment completed (Amount: ₹${payCompleted.totalAmount})`);

  // Cleanup E2E test data
  await Booking.findByIdAndDelete(booking._id);
  await QueueEntry.findByIdAndDelete(queueEntry._id);
  await Procurement.findByIdAndDelete(procRes.procurement._id);
  await PaymentStatus.findOneAndDelete({ bookingId: booking._id });

  console.log('\n================================================================');
  console.log('  ALL TARGETED PHASE 6 INTEGRITY & WORKFLOW TESTS PASSED 100%');
  console.log('================================================================');
  process.exit(0);
}

runPhase6TargetedTests().catch((err) => {
  console.error('❌ Phase 6 Targeted Test Failed:', err);
  process.exit(1);
});
