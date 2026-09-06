/**
 * AgriNexus - Round 6 Final Cross-Portal Consistency & Demo Journey Verification
 * Covers Section 21 of Round 6 specifications
 */

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

const User = require('./src/models/User');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const Mandi = require('./src/models/Mandi');
const Booking = require('./src/models/Booking');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');
const PaymentStatus = require('./src/models/PaymentStatus');
const seedOperationalData = require('./seed/seedOperationalData');

async function runRound6Audit() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 6 FINAL DEMO & INTEGRITY AUDIT');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);

  // Guarantee clean deterministic baseline before starting audit
  await seedOperationalData();

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

  const getQState = (res) => res.data?.data?.queueEntry?.state || res.data?.data?.state;

  try {
    // -------------------------------------------------------------
    // 1-4: CANONICAL DEMO USERS & RBAC ROLES
    // -------------------------------------------------------------
    const farmerUser = await User.findOne({ phone: '9876543210' });
    assert(
      '1. Canonical demo farmer exists (Ramesh Patel)',
      farmerUser && farmerUser.fullName === 'Ramesh Patel' && farmerUser.role === 'FARMER' && farmerUser.district === 'Lucknow'
    );

    const staffUser = await User.findOne({ email: 'gomtinagar.centre@agrinexus.demo' });
    assert(
      '2. Canonical staff exists (Satish Kumar / Gomti Nagar)',
      staffUser && staffUser.fullName === 'Satish Kumar' && staffUser.role === 'CENTRE_STAFF'
    );

    const adminUser = await User.findOne({ email: 'admin@agrinexus.gov.in' });
    assert(
      '3. Canonical admin exists (Dr. Anand Verma / District Magistrate)',
      adminUser && adminUser.role === 'ADMIN' && adminUser.district === 'Lucknow'
    );

    // Strict role enforcement
    const farmerStaffCollision = await User.findOne({ phone: '9876543210', role: { $ne: 'FARMER' } });
    const staffFarmerCollision = await User.findOne({ email: 'gomtinagar.centre@agrinexus.demo', role: { $ne: 'CENTRE_STAFF' } });
    const adminFarmerCollision = await User.findOne({ email: 'admin@agrinexus.gov.in', role: { $ne: 'ADMIN' } });
    assert(
      '4. All demo users have correct, non-colliding roles (Strict RBAC)',
      !farmerStaffCollision && !staffFarmerCollision && !adminFarmerCollision
    );

    // -------------------------------------------------------------
    // 5-6: GEOGRAPHIC SCOPE: STRICTLY LUCKNOW
    // -------------------------------------------------------------
    const nonLucknowCentres = await ProcurementCentre.find({ district: { $ne: 'Lucknow' } });
    const totalCentres = await ProcurementCentre.countDocuments();
    assert(
      '5. All operational centres are in Lucknow District',
      totalCentres === 8 && nonLucknowCentres.length === 0,
      `Found ${nonLucknowCentres.length} non-Lucknow centres`
    );

    const nonLucknowMandis = await Mandi.find({ district: { $ne: 'Lucknow' } });
    const totalMandis = await Mandi.countDocuments();
    assert(
      '6. All operational mandis are in Lucknow District',
      totalMandis === 3 && nonLucknowMandis.length === 0,
      `Found ${nonLucknowMandis.length} non-Lucknow mandis`
    );

    // -------------------------------------------------------------
    // 7-8: DATA PURITY: NO TEST TOKENS & NO SEHORE/MP RESIDUE
    // -------------------------------------------------------------
    const testTokens = await QueueEntry.find({
      $or: [
        { tokenNumber: { $regex: /TEST|8888|9999/i } },
        { sequenceNumber: { $in: [8888, 9999] } }
      ]
    });
    assert('7. No test tokens or artificial sequences in queue entries', testTokens.length === 0);

    const sehoreCentres = await ProcurementCentre.find({
      $or: [
        { state: { $regex: /Madhya Pradesh/i } },
        { district: { $regex: /Sehore/i } }
      ]
    });
    const sehoreBookings = await Booking.find({
      $or: [
        { bookingReference: { $regex: /SEH/i } },
        { tokenNumber: { $regex: /SEH/i } }
      ]
    });
    assert(
      '8. Zero legacy Sehore / Madhya Pradesh records in operational database',
      sehoreCentres.length === 0 && sehoreBookings.length === 0
    );

    // -------------------------------------------------------------
    // 9-10: QUEUE REALISM & TOKEN INTEGRITY
    // -------------------------------------------------------------
    const activeBookings = await Booking.find({ bookingStatus: { $ne: 'COMPLETED' } });
    const farmerActiveMap = new Map();
    let hasDuplicateActiveJourney = false;
    for (const b of activeBookings) {
      const fId = b.farmerId.toString();
      if (farmerActiveMap.has(fId)) {
        hasDuplicateActiveJourney = true;
        break;
      }
      farmerActiveMap.set(fId, b.bookingReference);
    }
    assert('9. Zero duplicate active farmer journeys (each active farmer has at most 1 active booking)', !hasDuplicateActiveJourney);

    const allQueueEntries = await QueueEntry.find().lean();
    const centreTokenMap = new Map();
    let hasDuplicateToken = false;
    for (const q of allQueueEntries) {
      const key = `${q.centreId}_${q.tokenNumber}`;
      if (centreTokenMap.has(key)) {
        hasDuplicateToken = true;
        break;
      }
      centreTokenMap.set(key, true);
    }
    assert('10. Zero duplicate active tokens per centre', !hasDuplicateToken);

    // -------------------------------------------------------------
    // 11-12: ROLE PURITY IN QUEUES & BOOKINGS
    // -------------------------------------------------------------
    const staffAndAdminUsers = await User.find({ role: { $in: ['CENTRE_STAFF', 'ADMIN'] } }).select('_id').lean();
    const staffAdminIdSet = new Set(staffAndAdminUsers.map(u => u._id.toString()));

    const pollutedQueue = await QueueEntry.find({ farmerId: { $in: Array.from(staffAdminIdSet) } });
    assert('11. All active queue entries strictly reference FARMER users (Zero staff/admin pollution)', pollutedQueue.length === 0);

    const pollutedBookings = await Booking.find({ farmerId: { $in: Array.from(staffAdminIdSet) } });
    assert('12. All bookings strictly reference FARMER users', pollutedBookings.length === 0);

    // -------------------------------------------------------------
    // 13-16: CANONICAL TRANSACTION END-TO-END LIFECYCLE (GOM01-109)
    // -------------------------------------------------------------
    console.log('\n--- Executing Canonical Demonstration Transaction (GOM01-109) ---');

    // Step 1: Staff Authentication
    const staffLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      email: 'gomtinagar.centre@agrinexus.demo',
      password: 'password123'
    });
    assert('Staff Login (Satish Kumar — Gomti Nagar)', staffLoginRes.data.success && !!staffLoginRes.data.data?.token);
    const staffToken = staffLoginRes.data.data.token;

    // Step 2: Farmer Authentication
    const farmerLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      phone: '9876543210',
      password: 'password123',
      role: 'FARMER'
    });
    assert('Farmer Login (Ramesh Patel)', farmerLoginRes.data.success && !!farmerLoginRes.data.data?.token);
    const fToken = farmerLoginRes.data.data.token;

    // Retrieve Ramesh Patel's canonical booking
    const gomtiCentre = await ProcurementCentre.findOne({ centreCode: 'LKO_GOM01' });
    let rameshQueueEntry = await QueueEntry.findOne({
      tokenNumber: 'GOM01-109',
      centreId: gomtiCentre._id
    }).populate('bookingId');
    assert('Ramesh Patel demo token GOM01-109 exists in Gomti Nagar', !!rameshQueueEntry);

    const qeId = rameshQueueEntry._id.toString();
    const bkgId = (rameshQueueEntry.bookingId?._id || rameshQueueEntry.bookingId).toString();

    // Step 5: Advance to WAITING -> CALLED
    if (rameshQueueEntry.state === 'BOOKED') {
      await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'WAITING' }, staffToken);
    }
    const callRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'CALLED' }, staffToken);
    assert('Transition: BOOKED/WAITING -> CALLED', callRes.data.success && getQState(callRes) === 'CALLED', JSON.stringify(callRes.data));

    // Step 6: Advance to ARRIVED
    const arriveRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'ARRIVED' }, staffToken);
    assert('Transition: CALLED -> ARRIVED', arriveRes.data.success && getQState(arriveRes) === 'ARRIVED', JSON.stringify(arriveRes.data));

    // Step 7: Advance to VERIFICATION
    const verifyStateRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'VERIFICATION' }, staffToken);
    assert('Transition: ARRIVED -> VERIFICATION', verifyStateRes.data.success && getQState(verifyStateRes) === 'VERIFICATION', JSON.stringify(verifyStateRes.data));

    // Step 8: Quality Assay (Moisture 12.3%, Impurities 0.4%, Grade A)
    const qualityStateRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'QUALITY_CHECK' }, staffToken);
    assert('Transition: VERIFICATION -> QUALITY_CHECK', qualityStateRes.data.success && getQState(qualityStateRes) === 'QUALITY_CHECK', JSON.stringify(qualityStateRes.data));

    const assayRes = await apiPost(`${BASE_URL}/procurements/${bkgId}/verify`, {
      verifiedQuantityQuintals: 44.0,
      moisturePercentage: 12.3,
      impurityPercentage: 0.4,
      qualityGrade: 'Grade A',
      notes: 'Clean wheat sample within KMS RMS 2026-27 fair average quality standards'
    }, staffToken);
    assert(
      'Quality Assay: Moisture 12.3%, Impurity 0.4%, Grade A recorded',
      assayRes.data.success && assayRes.data.data?.moisturePercentage === 12.3 && assayRes.data.data?.qualityGrade === 'Grade A',
      JSON.stringify(assayRes.data)
    );

    // Step 9: Proceed to WEIGHING
    const weighStateRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'WEIGHING' }, staffToken);
    assert('Transition: QUALITY_CHECK -> WEIGHING', weighStateRes.data.success && getQState(weighStateRes) === 'WEIGHING', JSON.stringify(weighStateRes.data));

    // Step 10: Certified Weighing (Gross: 45.5 Qtl, Tare: 1.5 Qtl, Net: 44.0 Qtl)
    const completeProcRes = await apiPost(`${BASE_URL}/procurements/${bkgId}/weigh-complete`, {
      grossWeightQuintals: 45.5,
      tareWeightQuintals: 1.5,
      netWeightQuintals: 44.0,
      deductions: 0,
      notes: 'Certified electronic weighbridge measurement'
    }, staffToken);

    const procData = completeProcRes.data.data?.procurement || completeProcRes.data.data?.receipt || completeProcRes.data.data;
    const netWeightCalculated = procData?.netWeightQuintals;
    const grossAmount = procData?.grossAmount;
    const netPayable = procData?.netPayableAmount;
    const mspRate = procData?.procurementRatePerQuintal;

    assert(
      '14. Certified Weighing & MSP Calculation (Gross 45.5 - Tare 1.5 = Net 44.0 Qtl @ ₹2,275/Qtl = ₹1,00,100)',
      netWeightCalculated === 44.0 && mspRate === 2275 && grossAmount === 100100 && netPayable === 100100,
      JSON.stringify(completeProcRes.data)
    );

    // Step 11: Procurement Confirmed
    const confirmStateRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PROCUREMENT_CONFIRMED' }, staffToken);
    assert('Transition: WEIGHING -> PROCUREMENT_CONFIRMED', confirmStateRes.data.success && getQState(confirmStateRes) === 'PROCUREMENT_CONFIRMED', JSON.stringify(confirmStateRes.data));

    // Step 12: Payment Processing
    const payProcStateRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PAYMENT_PROCESSING' }, staffToken);
    assert('Transition: PROCUREMENT_CONFIRMED -> PAYMENT_PROCESSING', payProcStateRes.data.success && getQState(payProcStateRes) === 'PAYMENT_PROCESSING', JSON.stringify(payProcStateRes.data));

    // Step 13: Payment Completion
    const payCompStateRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PAYMENT_COMPLETED' }, staffToken);
    assert('Transition: PAYMENT_PROCESSING -> PAYMENT_COMPLETED', payCompStateRes.data.success && getQState(payCompStateRes) === 'PAYMENT_COMPLETED', JSON.stringify(payCompStateRes.data));

    // Update payment stage in payment service
    await apiPost(`${BASE_URL}/payments/${bkgId}/stage`, { newStage: 'PAID' }, staffToken);
    const paymentStatusDoc = await PaymentStatus.findOne({ bookingId: bkgId });
    assert(
      '15. Payment Integrity: Payment status is PAID with valid DBT demo reference',
      paymentStatusDoc && paymentStatusDoc.currentStage === 'PAID' && paymentStatusDoc.totalAmount === 100100,
      JSON.stringify(paymentStatusDoc)
    );

    // Step 14 & 16: Receipt Uniqueness
    const procurementsCount = await Procurement.countDocuments({ bookingId: bkgId });
    const receiptSerial = procData?.receiptSerialNumber;
    assert(
      '16. Receipt Uniqueness: Exactly 1 authoritative receipt generated with valid serial format',
      procurementsCount === 1 && typeof receiptSerial === 'string' && receiptSerial.startsWith('REC-LKO_GOM01'),
      `Count: ${procurementsCount}, Serial: ${receiptSerial}`
    );

    // Cross-Portal Authoritative Verification: Farmer Portal reflection
    const myBookingsRes = await apiGet(`${BASE_URL}/bookings/my`, fToken);
    const farmerBooking = myBookingsRes.data.data?.find(b => b.tokenNumber === 'GOM01-109');
    assert(
      'Cross-Portal: Farmer portal reflects completed booking with token GOM01-109 and operationalStatus PAYMENT_COMPLETED',
      farmerBooking && ['PAYMENT_COMPLETED', 'COMPLETED'].includes(farmerBooking.operationalStatus),
      JSON.stringify(farmerBooking)
    );

    // Cross-Portal Authoritative Verification: Admin District Overview
    const adminLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      email: 'admin@agrinexus.gov.in',
      password: 'adminpassword'
    });
    const adminToken = adminLoginRes.data.data.token;
    const adminOverviewRes = await apiGet(`${BASE_URL}/admin/district-overview`, adminToken);
    assert(
      'Cross-Portal: Admin district overview successfully aggregates 8 Lucknow centres',
      adminOverviewRes.data.success && Array.isArray(adminOverviewRes.data.data?.centres) && adminOverviewRes.data.data.centres.length === 8
    );

    // -------------------------------------------------------------
    // 17: DEMO SEED IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('\n--- Testing Demo Seed Idempotency ---');
    await seedOperationalData();
    const countBookingsAfterSeed = await Booking.countDocuments();
    const countQueueAfterSeed = await QueueEntry.countDocuments();
    assert(
      '17. Demo seed idempotency: Re-running seed resets to exact canonical baseline (56 bookings, 55 queue entries)',
      countBookingsAfterSeed === 56 && countQueueAfterSeed === 55
    );

    console.log('\n================================================================');
    console.log(`  AUDIT RESULT: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Audit Exception:', err);
    process.exit(1);
  }
}

runRound6Audit();
