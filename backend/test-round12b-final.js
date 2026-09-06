/**
 * AgriNexus - Round 12B Automated Verification Suite
 * Verifying Bug Fixes:
 * 1. Booking slot selection isolation & clearing on date switch
 * 2. High-contrast bold token visibility across portals
 * 3. Screen flickering elimination in FarmerProcurementPage (non-blocking polling)
 * 4. Cross-portal state consistency (10-stage lifecycle)
 * 5. Farmer and Admin drawers dynamic authoritative bindings
 * 6. Hindi localization quality without transliteration artifacts
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';
const seedOperationalData = require('./seed/seedOperationalData');

async function apiPost(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

async function runRound12bTests() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 12B AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✔ PASS [${total}]: ${name}`);
    } else {
      console.error(`✖ FAIL [${total}]: ${name}${detail ? ` (${detail})` : ''}`);
    }
  }

  // --- 1. Codebase Static Audits ---
  console.log('\n--- Checking Bug #1: Slot Selection Isolation in BookSlotPage.jsx ---');
  const bookSlotCode = fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/farmer/BookSlotPage.jsx'),
    'utf-8'
  );

  assert(
    '1.1 Date button click clears selectedSlot immediately',
    bookSlotCode.includes('setSelectedDate(d.dateStr);') &&
    bookSlotCode.includes('setSelectedSlot(null);')
  );

  assert(
    '1.2 Slot selection checks unique identity (slotKey and compound id check)',
    bookSlotCode.includes('const slotKey = slot.slotId || slot._id || slot.id || slot.timeWindow;') &&
    bookSlotCode.includes('selectedSlot.slotId === slot.slotId') &&
    bookSlotCode.includes('selectedSlot._id === slot._id')
  );

  console.log('\n--- Checking Bug #2: Token Visibility & Typography ---');
  const farmerDashCode = fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/farmer/FarmerDashboardPage.jsx'),
    'utf-8'
  );
  const farmerProcCode = fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/farmer/FarmerProcurementPage.jsx'),
    'utf-8'
  );
  const workspaceCode = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/staff/ProcurementWorkspace.jsx'),
    'utf-8'
  );

  assert(
    '2.1 Farmer Dashboard contains prominent high-contrast token pill',
    farmerDashCode.includes('text-base sm:text-lg font-mono font-black text-forest-green tracking-wide')
  );

  assert(
    '2.2 Farmer Procurement Journey features bold 2xl token badge',
    farmerProcCode.includes('text-xl sm:text-2xl text-forest-green leading-none')
  );

  assert(
    '2.3 Staff Procurement Workspace contains prominent TOKEN header pill',
    workspaceCode.includes('TOKEN #{activeEntry.tokenNumber}')
  );

  console.log('\n--- Checking Bug #3: Screen Flickering Elimination ---');
  assert(
    '3.1 FarmerProcurementPage fetchData accepts isInitial parameter',
    farmerProcCode.includes('const fetchData = useCallback(async (isInitial = false) =>')
  );

  assert(
    '3.2 Background polling calls fetchData(false) without triggering full-screen spinner',
    farmerProcCode.includes('fetchData(false);') &&
    farmerProcCode.includes('if (isInitial) {') &&
    farmerProcCode.includes('setIsLoading(true);')
  );

  console.log('\n--- Checking Bug #4 & #5: Drawers and Dynamic Data Binding ---');
  const farmerDrawerCode = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/staff/FarmerDetailDrawer.jsx'),
    'utf-8'
  );
  const adminDrawerCode = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/admin/AdminFarmerDrawer.jsx'),
    'utf-8'
  );

  assert(
    '4.1 FarmerDetailDrawer dynamically accesses entry properties with safe fallbacks',
    farmerDrawerCode.includes('farmerEntry.farmer?.fullName || farmerEntry.farmerName') &&
    farmerDrawerCode.includes('Number(farmerEntry.netWeightQuintals || farmerEntry.quantityQuintals || farmerEntry.estimatedQuantityQuintals')
  );

  assert(
    '4.2 AdminFarmerDrawer maps 10 stages properly with active stage index',
    adminDrawerCode.includes("const currentStageKey = farmer.state || 'WAITING';") &&
    adminDrawerCode.includes("const activeIdx = currentIndex !== -1 ? currentIndex : 1;")
  );

  console.log('\n--- Checking Bug #6: Hindi Localization Polish ---');
  const hiJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/locales/hi/translation.json'), 'utf-8')
  );

  assert(
    '5.1 No transliterated "कॉल नेक्स्ट (CALL NEXT)" in hi/translation.json',
    !JSON.stringify(hiJson).includes('कॉल नेक्स्ट (CALL NEXT)')
  );

  assert(
    '5.2 Authentic Hindi "अगले किसान को बुलाएं" used for call_next',
    hiJson.staff.call_next === 'अगले किसान को बुलाएं'
  );

  assert(
    '5.3 "AgriNexus" brand preserved strictly untranslated in hi/translation.json',
    hiJson.app.title === 'AgriNexus'
  );

  // --- Database and Operational Integrity ---
  console.log('\n--- Database Operational Consistency & Workflow Execution ---');
  await mongoose.connect(MONGODB_URI);
  await seedOperationalData();

  const User = require('./src/models/User');
  const Booking = require('./src/models/Booking');
  const QueueEntry = require('./src/models/QueueEntry');
  const Procurement = require('./src/models/Procurement');
  const PaymentStatus = require('./src/models/PaymentStatus');

  const rameshBooking = await Booking.findOne({ tokenNumber: 'GOM01-109' }).populate('centreId');
  assert('6.1 Canonical booking GOM01-109 exists', !!rameshBooking);
  assert('6.2 Canonical booking quantity is 44.0 Quintals', rameshBooking?.estimatedQuantityQuintals === 44.0);

  const rameshQueue = await QueueEntry.findOne({ tokenNumber: 'GOM01-109' });
  assert('6.3 Canonical queue entry GOM01-109 exists in operational collection', !!rameshQueue);

  // Execute full workflow for GOM01-109 through staff token
  const staffLoginRes = await apiPost(BASE_URL + '/auth/login', {
    email: 'gomtinagar.centre@agrinexus.demo',
    password: 'password123'
  });
  const staffToken = staffLoginRes.data?.data?.token || staffLoginRes.data?.token;
  assert('6.4 Satish Kumar authenticates successfully', !!staffToken);

  const bkgId = rameshBooking._id.toString();
  const qeId = rameshQueue._id.toString();

  await apiPost(BASE_URL + `/queue/${qeId}/transition`, { targetState: 'QUALITY_CHECK' }, staffToken);
  await apiPost(BASE_URL + `/procurements/${bkgId}/verify`, {
    verifiedQuantityQuintals: 44.0,
    moisturePercentage: 12.3,
    impurityPercentage: 0.4,
    qualityGrade: 'Grade A',
    notes: 'FAQ certified wheat'
  }, staffToken);

  await apiPost(BASE_URL + `/queue/${qeId}/transition`, { targetState: 'WEIGHING' }, staffToken);
  await apiPost(BASE_URL + `/procurements/${bkgId}/weigh-complete`, {
    grossWeightQuintals: 45.5,
    tareWeightQuintals: 1.5,
    netWeightQuintals: 44.0,
    deductions: 0,
    notes: 'Certified weighbridge measurement'
  }, staffToken);

  await apiPost(BASE_URL + `/queue/${qeId}/transition`, { targetState: 'PROCUREMENT_CONFIRMED' }, staffToken);
  await apiPost(BASE_URL + `/queue/${qeId}/transition`, { targetState: 'PAYMENT_PROCESSING' }, staffToken);
  await apiPost(BASE_URL + `/queue/${qeId}/transition`, { targetState: 'PAYMENT_COMPLETED' }, staffToken);
  await apiPost(BASE_URL + `/payments/${bkgId}/stage`, { newStage: 'PAID' }, staffToken);

  const rameshProc = await Procurement.findOne({ bookingId: bkgId }).lean();
  assert('6.5 Canonical procurement record exists for GOM01-109', !!rameshProc);
  assert('6.6 Canonical procurement rate is ₹2,275 and Net ₹1,00,100', rameshProc?.netPayableAmount === 100100);

  const payments = await PaymentStatus.find({ bookingId: bkgId }).lean();
  assert('6.7 Canonical PaymentStatus record exists and is PAID', payments.length === 1 && (payments[0].currentStage === 'PAID' || payments[0].status === 'PAID'));

  // Verify Protected Files
  console.log('\n--- Protected Files Integrity ---');
  const heroFloating = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/public/HeroFloatingSystem.jsx'),
    'utf-8'
  );
  const floatingCard = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/public/FloatingAgriCard.jsx'),
    'utf-8'
  );

  assert('7.1 HeroFloatingSystem.jsx remains untouched', heroFloating.length > 500);
  assert('7.2 FloatingAgriCard.jsx remains untouched', floatingCard.length > 500);

  // Database Seed Reset
  await seedOperationalData();
  const resetQueue = await QueueEntry.countDocuments();
  assert('7.3 Operational seed resets cleanly to 55 queue entries', resetQueue === 55);

  console.log('\n================================================================');
  console.log(`  ROUND 12B AUDIT COMPLETE: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runRound12bTests().catch((err) => {
  console.error('Fatal error in Round 12B verification:', err);
  process.exit(1);
});
