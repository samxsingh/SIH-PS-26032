// AgriNexus - Round 4 Procurement Workflow & State Machine Verification
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

const apiPost = async (url, data, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return { status: res.status, data: json };
};

const apiGet = async (url, token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'GET',
    headers
  });
  const json = await res.json();
  return { status: res.status, data: json };
};

const QueueEntry = require('./src/models/QueueEntry');
const Booking = require('./src/models/Booking');
const Procurement = require('./src/models/Procurement');
const PaymentStatus = require('./src/models/PaymentStatus');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const User = require('./src/models/User');

const runTest = async () => {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 4 WORKFLOW & STATE MACHINE VERIFICATION');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);

  let passed = 0;
  let total = 0;

  function assert(name, condition, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✔ PASS [${total}]: ${name}`);
    } else {
      console.error(`✖ FAIL [${total}]: ${name} ${detail ? `(${detail})` : ''}`);
    }
  }

  try {
    // 1. Staff Login
    const loginRes = await apiPost(`${BASE_URL}/auth/login`, {
      phone: '9876543211', // Gomti Nagar Staff Head
      password: 'password123'
    });

    assert('Staff Login (Gomti Nagar)', loginRes.data.success && loginRes.data.data?.token);
    const token = loginRes.data.data.token;
    const staffUser = loginRes.data.data.user;
    const centreId = staffUser.assignedCentreId || staffUser.assignedCentre?._id || staffUser.assignedCentre;

    // 2. Fetch today queue
    const queueRes = await apiGet(`${BASE_URL}/queue/today?centreId=${centreId}`, token);
    assert('Fetch Today Queue succeeds', queueRes.data.success && Array.isArray(queueRes.data.data));

    const queueList = queueRes.data.data;
    assert('Queue items have both _id and id', queueList.length > 0 && queueList.every(q => q._id && q.id));
    assert('Queue items have cropType and quantityQuintals', queueList.every(q => q.cropType && q.quantityQuintals !== undefined));

    // 3. Create an isolated temporary test booking & queue entry to step through all 10 stages
    const testFarmer = await User.findOne({ phone: '9876500051' }); // Ramlal Kashyap
    assert('Test Farmer found', !!testFarmer);

    // Clean any existing isolated test token
    await QueueEntry.deleteMany({ tokenNumber: 'TEST-RND4-TOKEN' });
    await Booking.deleteMany({ tokenNumber: 'TEST-RND4-TOKEN' });
    await Procurement.deleteMany({ tokenNumber: 'TEST-RND4-TOKEN' });

    const Slot = require('./src/models/Slot');
    const testSlot = await Slot.findOne({ centreId });
    const slotId = testSlot ? testSlot._id : new mongoose.Types.ObjectId();

    const testBooking = await Booking.create({
      bookingReference: 'AGR-TEST-RND4-001',
      tokenNumber: 'TEST-RND4-TOKEN',
      farmerId: testFarmer._id,
      centreId: centreId,
      slotId,
      bookingDate: new Date().toISOString().slice(0, 10),
      timeWindow: '09:00 AM - 10:00 AM',
      cropType: 'Wheat',
      estimatedQuantityQuintals: 45,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'BOOKED'
    });

    const testQueueEntry = await QueueEntry.create({
      bookingId: testBooking._id,
      farmerId: testFarmer._id,
      centreId: centreId,
      slotId,
      tokenNumber: 'TEST-RND4-TOKEN',
      queueDate: new Date().toISOString().slice(0, 10),
      sequenceNumber: 777,
      state: 'BOOKED',
      counterId: 'Counter 01'
    });

    const entryId = testQueueEntry._id.toString();

    // 4. Test Idempotency: BOOKED -> BOOKED should succeed without error
    const idemRes = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'BOOKED'
    }, token);
    assert('Idempotent transition to current state BOOKED succeeds', idemRes.data.success && idemRes.data.data.queueEntry.state === 'BOOKED');

    // 5. Test Invalid Transition: BOOKED -> QUALITY_CHECK should return 400
    const invRes = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'QUALITY_CHECK'
    }, token);
    assert('Invalid transition BOOKED -> QUALITY_CHECK rejected', invRes.status === 400 && invRes.data?.error?.code === 'INVALID_STATE_TRANSITION');

    // 6. Transition BOOKED -> WAITING
    const t1 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'WAITING'
    }, token);
    assert('Step 1: BOOKED -> WAITING', t1.data.success && t1.data.data.queueEntry.state === 'WAITING');

    // 7. Transition WAITING -> CALLED
    const t2 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'CALLED',
      counterId: 'Bay 01'
    }, token);
    assert('Step 2: WAITING -> CALLED', t2.data.success && t2.data.data.queueEntry.state === 'CALLED');

    // 8. Transition CALLED -> ARRIVED
    const t3 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'ARRIVED'
    }, token);
    assert('Step 3: CALLED -> ARRIVED', t3.data.success && t3.data.data.queueEntry.state === 'ARRIVED');

    // 9. Transition ARRIVED -> VERIFICATION
    const t4 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'VERIFICATION'
    }, token);
    assert('Step 4: ARRIVED -> VERIFICATION', t4.data.success && t4.data.data.queueEntry.state === 'VERIFICATION');

    // 10. Transition VERIFICATION -> QUALITY_CHECK
    const t5 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'QUALITY_CHECK',
      verifiedQuantityQuintals: 45
    }, token);
    assert('Step 5: VERIFICATION -> QUALITY_CHECK', t5.data.success && t5.data.data.queueEntry.state === 'QUALITY_CHECK');

    // 11. Transition QUALITY_CHECK -> WEIGHING with Quality Payload
    const t6 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'WEIGHING',
      moisturePercentage: 12.3,
      qualityGrade: 'Grade A',
      impurityPercentage: 1.2
    }, token);
    assert('Step 6: QUALITY_CHECK -> WEIGHING with Quality Assay Payload', t6.data.success && t6.data.data.queueEntry.state === 'WEIGHING');

    // Verify DB Procurement record has moisture and grade
    const proc1 = await Procurement.findOne({ bookingId: testBooking._id });
    assert('Procurement record has moisture 12.3% and Grade A', proc1 && proc1.moisturePercentage === 12.3 && proc1.qualityGrade === 'Grade A');

    // 12. Transition WEIGHING -> PROCUREMENT_CONFIRMED with Weight Payload
    const t7 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'PROCUREMENT_CONFIRMED',
      grossWeightQuintals: 46.5,
      tareWeightQuintals: 2.5,
      netWeightQuintals: 44.0,
      deductions: 0
    }, token);
    assert('Step 7: WEIGHING -> PROCUREMENT_CONFIRMED with Certified Weights', t7.data.success && t7.data.data.queueEntry.state === 'PROCUREMENT_CONFIRMED');

    // Verify DB Procurement has calculated grossAmount = 44 * 2275 = 100100
    const proc2 = await Procurement.findOne({ bookingId: testBooking._id });
    assert('Procurement netWeight is 44.0 and grossAmount is 100,100', proc2 && proc2.netWeightQuintals === 44 && proc2.grossAmount === 100100);

    // 13. Transition PROCUREMENT_CONFIRMED -> PAYMENT_PROCESSING
    const t8 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'PAYMENT_PROCESSING'
    }, token);
    assert('Step 8: PROCUREMENT_CONFIRMED -> PAYMENT_PROCESSING', t8.data.success && t8.data.data.queueEntry.state === 'PAYMENT_PROCESSING');

    // Verify PaymentStatus in DB
    const pay1 = await PaymentStatus.findOne({ bookingId: testBooking._id });
    assert('PaymentStatus created with PAYMENT_PROCESSING', pay1 && pay1.currentStage === 'PAYMENT_PROCESSING');

    // 14. Transition PAYMENT_PROCESSING -> PAYMENT_COMPLETED
    const t9 = await apiPost(`${BASE_URL}/queue/${entryId}/transition`, {
      targetState: 'PAYMENT_COMPLETED'
    }, token);
    assert('Step 9: PAYMENT_PROCESSING -> PAYMENT_COMPLETED', t9.data.success && t9.data.data.queueEntry.state === 'PAYMENT_COMPLETED');

    const pay2 = await PaymentStatus.findOne({ bookingId: testBooking._id });
    assert('PaymentStatus updated to PAID', pay2 && pay2.currentStage === 'PAID');

    // 15. Verify Booking operationalStatus was synced throughout
    const updatedBooking = await Booking.findById(testBooking._id);
    assert('Booking operationalStatus is PAYMENT_COMPLETED and bookingStatus is COMPLETED', updatedBooking.operationalStatus === 'PAYMENT_COMPLETED' && updatedBooking.bookingStatus === 'COMPLETED');

    // 16. Clean up temporary test entry
    await QueueEntry.deleteMany({ tokenNumber: 'TEST-RND4-TOKEN' });
    await Booking.deleteMany({ tokenNumber: 'TEST-RND4-TOKEN' });
    await Procurement.deleteMany({ tokenNumber: 'TEST-RND4-TOKEN' });
    await PaymentStatus.deleteMany({ bookingId: testBooking._id });

    console.log('\n================================================================');
    console.log(`  WORKFLOW AUDIT SUMMARY: ${passed}/${total} ASSERTIONS PASSED`);
    if (passed === total) {
      console.log('  🌟 ROUND 4 WORKFLOW & STATE MACHINE FULLY VERIFIED (100%)');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
