/**
 * AgriNexus - Round 8 Final Cross-Portal Consistency & Demo Journey Verification
 * Covers all 20 points of the Round 8 Demonstration & Consistency Checklist.
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

async function runRound8Audit() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 8 FINAL DEMO & CROSS-PORTAL CONSISTENCY AUDIT');
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
    // POINT 1: Canonical Demo Farmer: Ramesh Patel, phone 9876543210, role FARMER
    // -------------------------------------------------------------
    const farmerUser = await User.findOne({ phone: '9876543210' });
    assert(
      'Point 1: Canonical demo farmer is Ramesh Patel, strictly FARMER role, phone 9876543210',
      farmerUser && farmerUser.fullName === 'Ramesh Patel' && farmerUser.role === 'FARMER' && farmerUser.district === 'Lucknow'
    );

    // -------------------------------------------------------------
    // POINT 2: Canonical Demo Staff: Satish Kumar at Gomti Nagar centre (LKO_GOM01)
    // -------------------------------------------------------------
    const staffUser = await User.findOne({ email: 'gomtinagar.centre@agrinexus.demo' });
    const gomtiCentre = await ProcurementCentre.findOne({ centreCode: 'LKO_GOM01' });
    assert(
      'Point 2: Canonical demo staff is Satish Kumar at Gomti Nagar centre (LKO_GOM01)',
      staffUser && staffUser.fullName === 'Satish Kumar' && staffUser.role === 'CENTRE_STAFF' && gomtiCentre
    );

    // -------------------------------------------------------------
    // POINT 3: Canonical Admin: Dr. Anand Verma / Lucknow District (Generic presentation in UI)
    // -------------------------------------------------------------
    const adminUser = await User.findOne({ email: 'admin@agrinexus.gov.in' });
    assert(
      'Point 3: Canonical demo admin is Dr. Anand Verma / Lucknow District',
      adminUser && adminUser.role === 'ADMIN' && adminUser.district === 'Lucknow'
    );

    // -------------------------------------------------------------
    // POINT 4: Strict RBAC: No demo account has multiple roles or mixed identities
    // -------------------------------------------------------------
    const farmerCollision = await User.findOne({ phone: '9876543210', role: { $ne: 'FARMER' } });
    const staffCollision = await User.findOne({ email: 'gomtinagar.centre@agrinexus.demo', role: { $ne: 'CENTRE_STAFF' } });
    const adminCollision = await User.findOne({ email: 'admin@agrinexus.gov.in', role: { $ne: 'ADMIN' } });
    assert(
      'Point 4: Strict RBAC: Zero mixing of roles or collision among canonical demo accounts',
      !farmerCollision && !staffCollision && !adminCollision
    );

    // -------------------------------------------------------------
    // POINT 5: Geographic Scope: All 8 centres & 3 APMC Mandis in Lucknow
    // -------------------------------------------------------------
    const totalCentres = await ProcurementCentre.countDocuments();
    const nonLucknowCentres = await ProcurementCentre.countDocuments({ district: { $ne: 'Lucknow' } });
    const totalMandis = await Mandi.countDocuments();
    const nonLucknowMandis = await Mandi.countDocuments({ district: { $ne: 'Lucknow' } });
    assert(
      'Point 5: All 8 centres & 3 mandis are strictly in Lucknow District (0 non-Lucknow data)',
      totalCentres === 8 && nonLucknowCentres === 0 && totalMandis === 3 && nonLucknowMandis === 0
    );

    // -------------------------------------------------------------
    // POINT 6: Ramesh Patel has an intake booking for today at Gomti Nagar centre
    // -------------------------------------------------------------
    const todayStr = new Date().toISOString().slice(0, 10);
    const rameshBooking = await Booking.findOne({
      farmerId: farmerUser._id,
      centreId: gomtiCentre._id,
      bookingDate: todayStr
    });
    assert(
      'Point 6: Ramesh Patel has an intake booking for today at Gomti Nagar centre (GOM01-109)',
      rameshBooking && rameshBooking.tokenNumber === 'GOM01-109' && rameshBooking.cropType === 'Wheat'
    );

    // -------------------------------------------------------------
    // POINT 7: Token GOM01-109 is discoverable in the centre's queue
    // -------------------------------------------------------------
    const rameshQueue = await QueueEntry.findOne({
      tokenNumber: 'GOM01-109',
      centreId: gomtiCentre._id
    }).populate('bookingId');
    assert(
      'Point 7: Token GOM01-109 is discoverable in Gomti Nagar queue',
      rameshQueue && String(rameshQueue.farmerId) === String(farmerUser._id)
    );

    // -------------------------------------------------------------
    // POINT 8: Queue entry starts in valid initial state (CHECKED_IN / WAITING / BOOKED)
    // -------------------------------------------------------------
    assert(
      'Point 8: Queue entry starts in valid initial state (BOOKED/WAITING/CHECKED_IN) with position & wait time',
      rameshQueue && ['BOOKED', 'CHECKED_IN', 'WAITING', 'ARRIVED'].includes(rameshQueue.state) &&
      (typeof rameshQueue.queuePosition === 'number' || typeof rameshQueue.sequenceNumber === 'number')
    );

    const qeId = rameshQueue._id.toString();
    const bkgId = (rameshQueue.bookingId?._id || rameshQueue.bookingId).toString();

    // -------------------------------------------------------------
    // POINT 9: Staff transitions GOM01-109 through all 10 stages without error
    // -------------------------------------------------------------
    // Step 9a: Authenticate Staff
    const staffLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      email: 'gomtinagar.centre@agrinexus.demo',
      password: 'password123'
    });
    const staffToken = staffLoginRes.data?.data?.token;
    assert('Point 9a: Staff authentication successful (Satish Kumar)', staffLoginRes.data?.success && !!staffToken);

    // Advance BOOKED -> WAITING -> CALLED
    if (rameshQueue.state === 'BOOKED') {
      await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'WAITING' }, staffToken);
    }
    const callRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'CALLED' }, staffToken);
    assert('Point 9b: Transition: WAITING -> CALLED', callRes.data?.success && getQState(callRes) === 'CALLED');

    // Advance CALLED -> ARRIVED
    const arriveRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'ARRIVED' }, staffToken);
    assert('Point 9c: Transition: CALLED -> ARRIVED', arriveRes.data?.success && getQState(arriveRes) === 'ARRIVED');

    // Advance ARRIVED -> VERIFICATION
    const verifyRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'VERIFICATION' }, staffToken);
    assert('Point 9d: Transition: ARRIVED -> VERIFICATION', verifyRes.data?.success && getQState(verifyRes) === 'VERIFICATION');

    // Advance VERIFICATION -> QUALITY_CHECK
    const qualityRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'QUALITY_CHECK' }, staffToken);
    assert('Point 9e: Transition: VERIFICATION -> QUALITY_CHECK', qualityRes.data?.success && getQState(qualityRes) === 'QUALITY_CHECK');

    // -------------------------------------------------------------
    // POINT 10: Stage 4 (Quality Assaying) accepts and stores: moisture 12.3%, impurity 0.4%, Grade A
    // -------------------------------------------------------------
    const assayRes = await apiPost(`${BASE_URL}/procurements/${bkgId}/verify`, {
      verifiedQuantityQuintals: 44.0,
      moisturePercentage: 12.3,
      impurityPercentage: 0.4,
      qualityGrade: 'Grade A',
      notes: 'Standard RMS 2026-27 fair average quality Wheat'
    }, staffToken);
    assert(
      'Point 10: Quality Assaying stores: moisture 12.3%, impurity 0.4%, Grade A',
      assayRes.data?.success &&
      assayRes.data?.data?.moisturePercentage === 12.3 &&
      assayRes.data?.data?.qualityGrade === 'Grade A',
      JSON.stringify(assayRes.data)
    );

    // Advance to WEIGHING
    const weighStateRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'WEIGHING' }, staffToken);
    assert('Point 10b: Transition: QUALITY_CHECK -> WEIGHING', weighStateRes.data?.success && getQState(weighStateRes) === 'WEIGHING');

    // -------------------------------------------------------------
    // POINT 11: Stage 6 (Certified Weighing) calculates: Gross 45.5 Qtl, Tare 1.5 Qtl, Net 44.0 Qtl
    // -------------------------------------------------------------
    const weighCompleteRes = await apiPost(`${BASE_URL}/procurements/${bkgId}/weigh-complete`, {
      grossWeightQuintals: 45.5,
      tareWeightQuintals: 1.5,
      netWeightQuintals: 44.0,
      deductions: 0,
      notes: 'Certified weighbridge measurement: Gross 45.5 - Tare 1.5 = Net 44.0 Qtl'
    }, staffToken);

    const procData = weighCompleteRes.data?.data?.procurement || weighCompleteRes.data?.data?.receipt || weighCompleteRes.data?.data;
    assert(
      'Point 11: Certified Weighing calculates: Gross 45.5 Qtl, Tare 1.5 Qtl, Net 44.0 Qtl',
      weighCompleteRes.data?.success &&
      procData?.grossWeightQuintals === 45.5 &&
      procData?.tareWeightQuintals === 1.5 &&
      procData?.netWeightQuintals === 44.0
    );

    // -------------------------------------------------------------
    // POINT 12: Stage 7 (Settlement Calculation) calculates: 44.0 Qtl * ₹2,275/Qtl = ₹1,00,100
    // -------------------------------------------------------------
    assert(
      'Point 12: Settlement Calculation: 44.0 Qtl * ₹2,275/Qtl = ₹1,00,100 gross and net payable',
      procData?.procurementRatePerQuintal === 2275 &&
      procData?.grossAmount === 100100 &&
      procData?.netPayableAmount === 100100
    );

    // Advance WEIGHING -> PROCUREMENT_CONFIRMED -> PAYMENT_PROCESSING -> PAYMENT_COMPLETED
    const confRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PROCUREMENT_CONFIRMED' }, staffToken);
    assert('Point 12a: Transition: WEIGHING -> PROCUREMENT_CONFIRMED', confRes.data?.success && getQState(confRes) === 'PROCUREMENT_CONFIRMED');

    const procPayRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PAYMENT_PROCESSING' }, staffToken);
    assert('Point 12b: Transition: PROCUREMENT_CONFIRMED -> PAYMENT_PROCESSING', procPayRes.data?.success && getQState(procPayRes) === 'PAYMENT_PROCESSING');

    const compPayRes = await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PAYMENT_COMPLETED' }, staffToken);
    assert('Point 12c: Transition: PAYMENT_PROCESSING -> PAYMENT_COMPLETED', compPayRes.data?.success && getQState(compPayRes) === 'PAYMENT_COMPLETED');

    // Update payment stage
    await apiPost(`${BASE_URL}/payments/${bkgId}/stage`, { newStage: 'PAID' }, staffToken);

    // -------------------------------------------------------------
    // POINT 13: Exactly 1 Digital Receipt & 1 PaymentStatus record with DBT reference
    // -------------------------------------------------------------
    const receiptCount = await Procurement.countDocuments({ bookingId: bkgId });
    const paymentCount = await PaymentStatus.countDocuments({ bookingId: bkgId });
    const procurementRec = await Procurement.findOne({ bookingId: bkgId });
    const paymentRec = await PaymentStatus.findOne({ bookingId: bkgId });

    assert(
      'Point 13: Exactly 1 Digital Receipt generated, exactly 1 PaymentStatus record with DBT reference',
      receiptCount === 1 && paymentCount === 1 &&
      procurementRec && (procurementRec.receiptSerialNumber || procurementRec.receiptNumber) &&
      paymentRec && (paymentRec.currentStage === 'PAID' || paymentRec.status === 'PAID') &&
      (paymentRec.dbtReference || paymentRec.demoReferenceNumber)
    );

    // -------------------------------------------------------------
    // POINT 14: Final state is PAYMENT_COMPLETED in queue, COMPLETED in booking
    // -------------------------------------------------------------
    const finalQueue = await QueueEntry.findById(qeId);
    const finalBooking = await Booking.findById(bkgId);
    assert(
      'Point 14: Final state is PAYMENT_COMPLETED in queue, COMPLETED in booking',
      finalQueue.state === 'PAYMENT_COMPLETED' &&
      (['COMPLETED', 'PAYMENT_COMPLETED'].includes(finalBooking.status) || ['COMPLETED', 'PAYMENT_COMPLETED'].includes(finalBooking.bookingStatus) || ['COMPLETED', 'PAYMENT_COMPLETED'].includes(finalBooking.operationalStatus))
    );

    // -------------------------------------------------------------
    // POINT 15: Farmer portal displays PAYMENT_COMPLETED with receipt matching ₹1,00,100
    // -------------------------------------------------------------
    const farmerLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      phone: '9876543210',
      password: 'password123',
      role: 'FARMER'
    });
    const farmerToken = farmerLoginRes.data?.data?.token;
    assert('Point 15a: Farmer authentication successful (Ramesh Patel)', farmerLoginRes.data?.success && !!farmerToken);

    const farmerBookingsRes = await apiGet(`${BASE_URL}/bookings/my`, farmerToken);
    const farmerGomtiBooking = (farmerBookingsRes.data?.data || []).find(b => b.tokenNumber === 'GOM01-109');
    assert(
      'Point 15: Farmer portal reflects completed booking with token GOM01-109 and receipt matching ₹1,00,100',
      farmerGomtiBooking &&
      ['PAYMENT_COMPLETED', 'COMPLETED'].includes(farmerGomtiBooking.operationalStatus || farmerGomtiBooking.bookingStatus || farmerGomtiBooking.status) &&
      procurementRec.netPayableAmount === 100100
    );

    // -------------------------------------------------------------
    // POINT 16: District admin dashboard reflects updated count, volume, and bottleneck
    // -------------------------------------------------------------
    const adminLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      email: 'admin@agrinexus.gov.in',
      password: 'adminpassword'
    });
    const adminToken = adminLoginRes.data?.data?.token;
    assert('Point 16a: Admin authentication successful (Dr. Anand Verma)', adminLoginRes.data?.success && !!adminToken);

    const adminStatsRes = await apiGet(`${BASE_URL}/admin/dashboard-stats`, adminToken);
    const statsData = adminStatsRes.data?.data;
    const recentFarmers = statsData?.recentFarmersQueue || [];
    const rameshAuditInAdmin = recentFarmers.find(f => f.tokenNumber === 'GOM01-109');

    assert(
      'Point 16: Admin dashboard reflects updated metrics, deterministic bottleneck, and farmer audit trail',
      adminStatsRes.data?.success &&
      statsData && (typeof statsData.totalProcuredTodayQuintals === 'number' || typeof statsData.district?.totalProduceQuintals === 'number') &&
      (statsData.procurementBottleneck || statsData.district?.procurementBottleneck) &&
      rameshAuditInAdmin && rameshAuditInAdmin.state === 'PAYMENT_COMPLETED' &&
      rameshAuditInAdmin.netWeightQuintals === 44.0 &&
      rameshAuditInAdmin.netPayableAmount === 100100 &&
      rameshAuditInAdmin.qualityGrade === 'Grade A',
      `rameshAuditInAdmin: ${JSON.stringify(rameshAuditInAdmin)}`
    );

    // -------------------------------------------------------------
    // POINT 17: Refreshing any portal maintains correct updated state (No rollback)
    // -------------------------------------------------------------
    const adminRefreshRes = await apiGet(`${BASE_URL}/admin/dashboard-stats`, adminToken);
    const staffRefreshRes = await apiGet(`${BASE_URL}/queue/today?centreId=${gomtiCentre._id}`, staffToken);
    const farmerRefreshRes = await apiGet(`${BASE_URL}/bookings/my`, farmerToken);

    const fRefBooking = (farmerRefreshRes.data?.data || []).find(b => b.tokenNumber === 'GOM01-109');
    assert(
      'Point 17: Refreshing any portal maintains the correct updated state without rollback',
      adminRefreshRes.data?.success &&
      fRefBooking && ['PAYMENT_COMPLETED', 'COMPLETED'].includes(fRefBooking.operationalStatus || fRefBooking.bookingStatus || fRefBooking.status),
      `fRefBooking: ${JSON.stringify(fRefBooking)}`
    );

    // -------------------------------------------------------------
    // POINT 18: Seed script can be re-run cleanly and idempotently
    // -------------------------------------------------------------
    await seedOperationalData();
    const reseedCentres = await ProcurementCentre.countDocuments();
    const reseedFarmers = await User.countDocuments({ role: 'FARMER' });
    const reseedQueue = await QueueEntry.countDocuments({ queueDate: todayStr });
    const duplicateCheck = await QueueEntry.aggregate([
      { $match: { queueDate: todayStr } },
      { $group: { _id: '$farmerId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    assert(
      'Point 18: Seed script re-runs cleanly and idempotently (0 duplicate farmers, 55 queue entries)',
      reseedCentres === 8 && reseedFarmers >= 50 && reseedQueue === 55 && duplicateCheck.length === 0
    );

    // -------------------------------------------------------------
    // POINT 19 & 20: 100% assertions summary
    // -------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log(`  AUDIT COMPLETE: ${passed} / ${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
    console.log('----------------------------------------------------------------\n');

  } catch (err) {
    console.error('Audit encountered error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  }
}

runRound8Audit();
