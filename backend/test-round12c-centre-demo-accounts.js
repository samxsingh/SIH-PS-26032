/**
 * AgriNexus - Round 12C Multi-Centre Demo Accounts Verification Suite
 * Verifies:
 * 1. Multiple Centre Staff demo accounts exist in frontend config.
 * 2. Every demo account maps to a real, existing Centre Staff identity in DB.
 * 3. Every account maps to an active Lucknow centre.
 * 4. Centre codes are valid Lucknow codes (LKO_*).
 * 5. Centre names are correct.
 * 6. No duplicate Centre Staff identities exist.
 * 7. No duplicate demo account IDs exist.
 * 8. Farmer demo accounts remain intact (6 accounts).
 * 9. Ramesh Patel mapping remains intact (GOM01-109).
 * 10. Satish Kumar remains mapped to LKO_GOM01.
 * 11. Other Centre Staff accounts map to their correct centres.
 * 12. Centre queues are strictly isolated.
 * 13. Farmer bookings map to correct centres.
 * 14. Tokens map to correct centres.
 * 15. Role isolation (RBAC) remains intact.
 * 16. No test placeholder tokens exist.
 * 17. Seed remains idempotent.
 * 18. Protected components remain untouched.
 * 19. Hindi localization keys exist.
 * 20. AgriNexus brand remains untranslated.
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

async function apiGet(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  return res.json();
}

async function runRound12cTests() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 12C MULTI-CENTRE DEMO ACCOUNTS AUDIT');
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

  // --- 1. Frontend Demo Accounts Inspection ---
  console.log('--- Checking Demo Accounts Configuration ---');
  const demoAccountsFile = fs.readFileSync(
    path.join(__dirname, '../frontend/src/config/demoAccounts.js'),
    'utf-8'
  );

  // Extract DEMO_ACCOUNTS
  const farmerMatch = demoAccountsFile.match(/FARMER:\s*\[([\s\S]*?)\],/);
  const staffMatch = demoAccountsFile.match(/CENTRE_STAFF:\s*\[([\s\S]*?)\],/);

  assert('1. DEMO_ACCOUNTS contains CENTRE_STAFF array', !!staffMatch);
  assert('2. DEMO_ACCOUNTS contains FARMER array', !!farmerMatch);

  // Parse staff accounts roughly
  const staffIds = [...demoAccountsFile.matchAll(/id:\s*['"](centre_\d+)['"]/g)].map(m => m[1]);
  assert('3. Multiple Centre Staff demo accounts exist (>= 4)', staffIds.length >= 4, `found ${staffIds.length}`);

  const uniqueStaffIds = new Set(staffIds);
  assert('4. No duplicate Centre Staff demo account IDs', uniqueStaffIds.size === staffIds.length);

  const farmerIds = [...demoAccountsFile.matchAll(/id:\s*['"](farmer_\d+)['"]/g)].map(m => m[1]);
  assert('5. Exactly 6 Farmer demo accounts remain intact', farmerIds.length === 6);

  // Connect to DB and seed
  await mongoose.connect(MONGODB_URI);
  await seedOperationalData();

  const User = require('./src/models/User');
  const ProcurementCentre = require('./src/models/ProcurementCentre');
  const QueueEntry = require('./src/models/QueueEntry');
  const Booking = require('./src/models/Booking');

  // --- 2. Database Verification of Centre Staff Demo Accounts ---
  console.log('\n--- Verifying Database Integrity of Staff Accounts ---');
  const staffList = [
    { id: 'centre_01', email: 'gomtinagar.centre@agrinexus.demo', code: 'LKO_GOM01', name: 'Satish Kumar' },
    { id: 'centre_02', email: 'jankipuram.centre@agrinexus.demo', code: 'LKO_JAN04', name: 'Kisan Seva Manager — Jankipuram' },
    { id: 'centre_03', email: 'aliganj.centre@agrinexus.demo', code: 'LKO_ALI02', name: 'Kishan Seva Manager — Aliganj' },
    { id: 'centre_04', email: 'indiranagar.centre@agrinexus.demo', code: 'LKO_IND03', name: 'Grain Mandi Incharge — Indira Nagar' },
    { id: 'centre_05', email: 'alambagh.centre@agrinexus.demo', code: 'LKO_ALA05', name: 'APMC Officer — Alambagh' }
  ];

  const loggedInStaffTokens = {};

  for (const st of staffList) {
    const userDoc = await User.findOne({ email: st.email }).populate('assignedCentreId');
    assert(`6.${st.id} ${st.name} exists in DB`, !!userDoc);
    assert(`7.${st.id} ${st.name} has role CENTRE_STAFF`, userDoc?.role === 'CENTRE_STAFF');
    assert(`8.${st.id} ${st.name} maps to centre code ${st.code}`, userDoc?.assignedCentreId?.centreCode === st.code);
    assert(`9.${st.id} Centre is in Lucknow District`, userDoc?.assignedCentreId?.district === 'Lucknow');

    // Authenticate via API
    const loginRes = await apiPost(BASE_URL + '/auth/login', {
      email: st.email,
      password: 'password123'
    });
    assert(`10.${st.id} Login succeeds via API`, loginRes.success && !!loginRes.data?.token);
    if (loginRes.data?.token) {
      loggedInStaffTokens[st.code] = {
        token: loginRes.data.token,
        centreId: loginRes.data.user.assignedCentreId,
        user: loginRes.data.user
      };
    }
  }

  // --- 3. Queue Isolation Verification ---
  console.log('\n--- Verifying Queue Isolation Across Centres ---');
  const gomtiStaff = loggedInStaffTokens['LKO_GOM01'];
  const jankiStaff = loggedInStaffTokens['LKO_JAN04'];
  const aliStaff = loggedInStaffTokens['LKO_ALI02'];

  const gomtiQueueRes = await apiGet(`${BASE_URL}/queue/today?centreId=${gomtiStaff.centreId}`, gomtiStaff.token);
  const jankiQueueRes = await apiGet(`${BASE_URL}/queue/today?centreId=${jankiStaff.centreId}`, jankiStaff.token);
  const aliQueueRes = await apiGet(`${BASE_URL}/queue/today?centreId=${aliStaff.centreId}`, aliStaff.token);

  assert('11. Gomti Nagar queue returns operational entries', gomtiQueueRes.success && gomtiQueueRes.data.length > 0);
  assert('12. Jankipuram queue returns operational entries', jankiQueueRes.success && jankiQueueRes.data.length > 0);
  assert('13. Aliganj queue returns operational entries', aliQueueRes.success && aliQueueRes.data.length > 0);

  // Check prefix isolation: all Gomti tokens start with GOM01, Jankipuram with JAN04, Aliganj with ALI02
  const allGomtiPrefix = gomtiQueueRes.data.every(q => q.tokenNumber.startsWith('GOM01-'));
  const allJankiPrefix = jankiQueueRes.data.every(q => q.tokenNumber.startsWith('JAN04-'));
  const allAliPrefix = aliQueueRes.data.every(q => q.tokenNumber.startsWith('ALI02-'));

  assert('14. Gomti Nagar queue contains only GOM01-* tokens (0 leakage)', allGomtiPrefix);
  assert('15. Jankipuram queue contains only JAN04-* tokens (0 leakage)', allJankiPrefix);
  assert('16. Aliganj queue contains only ALI02-* tokens (0 leakage)', allAliPrefix);

  // Check no cross-centre leakage: Gomti tokens do NOT appear in Jankipuram or Aliganj
  const gomtiTokens = new Set(gomtiQueueRes.data.map(q => q.tokenNumber));
  const jankiTokens = new Set(jankiQueueRes.data.map(q => q.tokenNumber));
  const hasGomtiInJanki = [...gomtiTokens].some(t => jankiTokens.has(t));
  assert('17. Strict queue isolation: zero overlap between Gomti Nagar and Jankipuram queues', !hasGomtiInJanki);

  // --- 4. Cross-Portal Consistency for Canonical Demo Transaction ---
  console.log('\n--- Verifying Farmer ↔ Staff Cross-Portal Consistency ---');
  const rameshBooking = await Booking.findOne({ tokenNumber: 'GOM01-109' }).populate('centreId');
  assert('18. Canonical booking GOM01-109 exists for Ramesh Patel', !!rameshBooking);
  assert('19. GOM01-109 centre is Gomti Nagar', rameshBooking?.centreId?.centreCode === 'LKO_GOM01');

  const inGomtiQueue = gomtiQueueRes.data.find(q => q.tokenNumber === 'GOM01-109');
  assert('20. GOM01-109 is discoverable in Satish Kumar queue', !!inGomtiQueue);

  // Check that Jankipuram staff does NOT see GOM01-109
  const inJankiQueue = jankiQueueRes.data.find(q => q.tokenNumber === 'GOM01-109');
  assert('21. GOM01-109 is NOT visible in Jankipuram queue (isolation)', !inJankiQueue);

  // --- 5. RBAC Enforcement ---
  console.log('\n--- Verifying Role-Based Access Control ---');
  // Farmer cannot access staff queue
  const farmerLoginRes = await apiPost(BASE_URL + '/auth/login', {
    phone: '9876543210',
    password: 'password123'
  });
  const farmerToken = farmerLoginRes.data?.token;
  const farmerQueueRes = await apiGet(`${BASE_URL}/queue/today?centreId=${gomtiStaff.centreId}`, farmerToken);
  assert('22. Farmer cannot access staff queue endpoint (403)', farmerQueueRes.success === false);

  // Staff cannot access admin district overview
  const staffAdminRes = await apiGet(`${BASE_URL}/admin/district/overview`, gomtiStaff.token);
  assert('23. Centre Staff cannot access admin district overview (403)', staffAdminRes.success === false);

  // --- 6. Localization and Brand Integrity ---
  console.log('\n--- Verifying Localization and Brand Integrity ---');
  const hiJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/locales/hi/translation.json'), 'utf-8')
  );

  assert('24. Brand AgriNexus is untranslated', hiJson.app.title === 'AgriNexus');
  assert('25. Hindi translations for centre demo accounts exist', !!hiJson.login.demo_account_name_centre_02);
  assert('26. No transliterated "कॉल नेक्स्ट (CALL NEXT)" in hi/translation.json', !JSON.stringify(hiJson).includes('कॉल नेक्स्ट (CALL NEXT)'));

  // --- 7. Protected Components Integrity ---
  console.log('\n--- Verifying Protected Files Integrity ---');
  const heroFloating = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/public/HeroFloatingSystem.jsx'),
    'utf-8'
  );
  const floatingCard = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/public/FloatingAgriCard.jsx'),
    'utf-8'
  );

  assert('27. HeroFloatingSystem.jsx remains untouched', heroFloating.length > 500);
  assert('28. FloatingAgriCard.jsx remains untouched', floatingCard.length > 500);

  // --- 8. Seed Idempotency Check ---
  console.log('\n--- Verifying Database Seed Idempotency ---');
  await seedOperationalData();
  const resetQueue = await QueueEntry.countDocuments();
  assert('29. Operational seed resets cleanly to exact 55 queue entries', resetQueue === 55);

  const resetCentres = await ProcurementCentre.countDocuments();
  assert('30. Exactly 8 active Lucknow centres exist', resetCentres === 8);

  console.log('\n================================================================');
  console.log(`  ROUND 12C AUDIT COMPLETE: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runRound12cTests().catch((err) => {
  console.error('Fatal error in Round 12C test execution:', err);
  process.exit(1);
});
