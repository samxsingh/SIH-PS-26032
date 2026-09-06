/**
 * AgriNexus - Lucknow District Data Purification Audit Suite
 * 
 * Strict automated data integrity auditor checking 13 critical assertions:
 * 1. Zero non-Lucknow procurement centres.
 * 2. Zero non-Lucknow mandis in active use.
 * 3. Zero APMC officers in farmer role.
 * 4. Zero administrators in farmer role.
 * 5. Zero centre staff in farmer role.
 * 6. Zero duplicate active queue tokens.
 * 7. Zero repeated simultaneous queue entries for the same farmer.
 * 8. All active queue entries reference valid role: 'FARMER' users.
 * 9. All active bookings reference valid role: 'FARMER' users.
 * 10. All active bookings belong to Lucknow centres.
 * 11. Zero TOK-TEST tokens in active operational data.
 * 12. Zero #8888 / #9999 style tokens in operational data.
 * 13. Zero Sehore / Madhya Pradesh records in operational collections.
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const Mandi = require('./src/models/Mandi');
const Booking = require('./src/models/Booking');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');
const PaymentStatus = require('./src/models/PaymentStatus');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

const runAudit = async () => {
  console.log('================================================================');
  console.log('  AGRINEXUS LUCKNOW DISTRICT DATA PURIFICATION AUDIT');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);

  let passedAssertions = 0;
  let totalAssertions = 0;
  const failureDetails = [];

  function assertRule(name, passed, detail = '') {
    totalAssertions++;
    if (passed) {
      passedAssertions++;
      console.log(`✔ PASS [${totalAssertions}/13]: ${name}`);
    } else {
      console.error(`✖ FAIL [${totalAssertions}/13]: ${name}`);
      if (detail) console.error(`   Details: ${detail}`);
      failureDetails.push({ rule: name, detail });
    }
  }

  try {
    // 1. Zero non-Lucknow procurement centres
    const nonLucknowCentres = await ProcurementCentre.find({
      $or: [
        { district: { $ne: 'Lucknow' } },
        { state: { $ne: 'Uttar Pradesh' } }
      ]
    }).lean();
    assertRule(
      'Zero non-Lucknow procurement centres',
      nonLucknowCentres.length === 0,
      `Found ${nonLucknowCentres.length} non-Lucknow centres: ${nonLucknowCentres.map(c => c.name).join(', ')}`
    );

    // 2. Zero non-Lucknow mandis in active use
    const nonLucknowMandis = await Mandi.find({
      $or: [
        { district: { $ne: 'Lucknow' } },
        { state: { $ne: 'Uttar Pradesh' } }
      ]
    }).lean();
    assertRule(
      'Zero non-Lucknow mandis in active use',
      nonLucknowMandis.length === 0,
      `Found ${nonLucknowMandis.length} non-Lucknow mandis: ${nonLucknowMandis.map(m => m.name).join(', ')}`
    );

    // 3. Zero APMC officers in farmer role
    const apmcOfficersInFarmerRole = await User.find({
      role: 'FARMER',
      $or: [
        { designation: /APMC|Mandi|Officer/i },
        { fullName: /APMC|Officer/i },
        { isCentreHead: true }
      ]
    }).lean();
    assertRule(
      'Zero APMC officers in farmer role',
      apmcOfficersInFarmerRole.length === 0,
      `Found ${apmcOfficersInFarmerRole.length} APMC officers marked as FARMER: ${apmcOfficersInFarmerRole.map(u => u.fullName).join(', ')}`
    );

    // 4. Zero administrators in farmer role
    const adminsInFarmerRole = await User.find({
      role: 'FARMER',
      $or: [
        { email: /admin@/i },
        { fullName: /Administrator|Magistrate/i }
      ]
    }).lean();
    assertRule(
      'Zero administrators in farmer role',
      adminsInFarmerRole.length === 0,
      `Found ${adminsInFarmerRole.length} admins marked as FARMER: ${adminsInFarmerRole.map(u => u.fullName).join(', ')}`
    );

    // 5. Zero centre staff in farmer role
    const staffInFarmerRole = await User.find({
      role: 'FARMER',
      assignedCentreId: { $ne: null }
    }).lean();
    assertRule(
      'Zero centre staff in farmer role',
      staffInFarmerRole.length === 0,
      `Found ${staffInFarmerRole.length} staff marked as FARMER: ${staffInFarmerRole.map(u => u.fullName).join(', ')}`
    );

    // 6. Zero duplicate active queue tokens
    const activeQueueStates = ['BOOKED', 'WAITING', 'CALLED', 'ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING'];
    const activeQueues = await QueueEntry.find({ state: { $in: activeQueueStates } }).lean();
    const tokenCounts = {};
    activeQueues.forEach(q => {
      tokenCounts[q.tokenNumber] = (tokenCounts[q.tokenNumber] || 0) + 1;
    });
    const dupTokens = Object.entries(tokenCounts).filter(([, count]) => count > 1);
    assertRule(
      'Zero duplicate active queue tokens',
      dupTokens.length === 0,
      `Duplicate tokens found: ${dupTokens.map(([tok, c]) => `${tok} (${c}x)`).join(', ')}`
    );

    // 7. Zero repeated simultaneous queue entries for the same farmer
    const farmerQueueCounts = {};
    activeQueues.forEach(q => {
      const fId = q.farmerId?.toString();
      farmerQueueCounts[fId] = (farmerQueueCounts[fId] || 0) + 1;
    });
    const repeatedFarmersInQueue = Object.entries(farmerQueueCounts).filter(([, count]) => count > 1);
    assertRule(
      'Zero repeated simultaneous queue entries for the same farmer',
      repeatedFarmersInQueue.length === 0,
      `Repeated active farmers found: ${repeatedFarmersInQueue.map(([fId, c]) => `farmerId ${fId} (${c}x)`).join(', ')}`
    );

    // 8. All active queue entries reference valid role: 'FARMER' users
    const allFarmerUsers = await User.find({ role: 'FARMER' }).lean();
    const farmerIdSet = new Set(allFarmerUsers.map(u => u._id.toString()));
    const nonFarmerInQueue = activeQueues.filter(q => !farmerIdSet.has(q.farmerId?.toString()));
    assertRule(
      "All active queue entries reference valid role: 'FARMER' users",
      nonFarmerInQueue.length === 0,
      `Non-farmer user IDs found in active queue: ${nonFarmerInQueue.map(q => q.farmerId).join(', ')}`
    );

    // 9. All active bookings reference valid role: 'FARMER' users
    const activeBookings = await Booking.find({ operationalStatus: { $in: activeQueueStates } }).lean();
    const nonFarmerInBookings = activeBookings.filter(b => !farmerIdSet.has(b.farmerId?.toString()));
    assertRule(
      "All active bookings reference valid role: 'FARMER' users",
      nonFarmerInBookings.length === 0,
      `Non-farmer user IDs found in active bookings: ${nonFarmerInBookings.map(b => b.farmerId).join(', ')}`
    );

    // 10. All active bookings belong to Lucknow centres
    const lucknowCentres = await ProcurementCentre.find({ district: 'Lucknow' }).lean();
    const lucknowCentreIdSet = new Set(lucknowCentres.map(c => c._id.toString()));
    const nonLucknowBookings = activeBookings.filter(b => !lucknowCentreIdSet.has(b.centreId?.toString()));
    assertRule(
      'All active bookings belong to Lucknow centres',
      nonLucknowBookings.length === 0,
      `Bookings linked to non-Lucknow centres: ${nonLucknowBookings.length}`
    );

    // 11. Zero TOK-TEST tokens in active operational data
    const tokTestBookings = await Booking.find({ tokenNumber: /^TOK-TEST/i }).lean();
    const tokTestQueues = await QueueEntry.find({ tokenNumber: /^TOK-TEST/i }).lean();
    assertRule(
      'Zero TOK-TEST tokens in active operational data',
      tokTestBookings.length === 0 && tokTestQueues.length === 0,
      `Found ${tokTestBookings.length} TOK-TEST bookings and ${tokTestQueues.length} TOK-TEST queue entries.`
    );

    // 12. Zero #8888 / #9999 style tokens in operational data
    const artificialSeqQueues = await QueueEntry.find({ sequenceNumber: { $in: [8888, 9999] } }).lean();
    const artificialTokens = await QueueEntry.find({ tokenNumber: /8888|9999/ }).lean();
    assertRule(
      'Zero #8888 / #9999 style tokens in operational data',
      artificialSeqQueues.length === 0 && artificialTokens.length === 0,
      `Found ${artificialSeqQueues.length} entries with seq 8888/9999, ${artificialTokens.length} with token 8888/9999.`
    );

    // 13. Zero Sehore / Madhya Pradesh records in operational collections
    const sehoreUsers = await User.find({
      $or: [
        { district: /Sehore/i },
        { state: /Madhya Pradesh/i },
        { email: /sehore/i }
      ]
    }).lean();
    const sehoreCentres = await ProcurementCentre.find({
      $or: [
        { district: /Sehore/i },
        { state: /Madhya Pradesh/i },
        { name: /Sehore/i }
      ]
    }).lean();
    const sehoreMandis = await Mandi.find({
      $or: [
        { district: /Sehore/i },
        { state: /Madhya Pradesh/i },
        { name: /Sehore/i }
      ]
    }).lean();
    const totalSehoreRecords = sehoreUsers.length + sehoreCentres.length + sehoreMandis.length;
    assertRule(
      'Zero Sehore / Madhya Pradesh records in operational collections',
      totalSehoreRecords === 0,
      `Found ${sehoreUsers.length} users, ${sehoreCentres.length} centres, ${sehoreMandis.length} mandis with Sehore/MP.`
    );

    console.log('\n================================================================');
    console.log(`  AUDIT SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED`);
    if (passedAssertions === totalAssertions) {
      console.log('  🌟 LUCKNOW DISTRICT PURIFICATION AUDIT PASSED (100%)');
    } else {
      console.error(`  ⚠️ ${failureDetails.length} ASSERTION(S) FAILED:`);
      failureDetails.forEach(f => console.error(`    - ${f.rule}: ${f.detail}`));
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Audit script runtime failure:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }

  if (passedAssertions !== totalAssertions) {
    process.exit(1);
  }
};

runAudit();
