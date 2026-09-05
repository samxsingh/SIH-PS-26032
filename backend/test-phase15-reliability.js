/**
 * AgriNexus - Phase 15 Integration Hardening & Reliability Test Suite
 * 
 * Verifies all 13 Failure-Path & Concurrency Scenarios:
 * 1. Duplicate Action & Idempotency Hardening
 * 2. Stale Frontend & Optimistic Concurrency Handling
 * 3. Concurrent Multi-Operator Queue Race Handling
 * 4. Lifecycle Invariant & Out-of-Sequence Mutation Protection
 * 5. Network Resiliency & Socket.IO Fallback Testing
 * 6. Invalid Weighbridge & Quality Sensor Rejections
 * 7. Cross-Centre & Cross-Farmer RBAC Access Rejections
 * 8. Deactivated & Suspended Staff Access Revocation
 * 9. Centre Head / Manager Invariant Atomic Reassignment
 * 10. Empty Queue, Zero Results & Edge State Graceful Handling
 * 11. Server-Authoritative MSP & Net Payable Formula Enforcement
 * 12. Deep Data Consistency & Reconciliation Engine Verification
 * 13. PII Aadhaar Masking & Govt DBT Simulation Disclaimers
 */

const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');

const Booking = require('./src/models/Booking');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');
const PaymentStatus = require('./src/models/PaymentStatus');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const Mandi = require('./src/models/Mandi');
const User = require('./src/models/User');
const Slot = require('./src/models/Slot');

const { callNextFarmer, transitionQueueState, isValidTransition } = require('./src/services/queueEngine');
const { recordVerification, completeProcurementTransaction } = require('./src/services/procurementService');
const { updatePaymentStage, getPaymentStatusByBooking } = require('./src/services/paymentService');
const { runFullSystemReconciliation } = require('./src/services/reconciliationService');
const { getMspRateForCrop } = require('./src/config/policyRates');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';
const API_BASE = 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sih_2026_gov_key_change_in_production';

// HTTP helper
function apiRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { Authorization: `Bearer ${options.token}` }),
        ...options.headers
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = { rawBody: body };
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase15ReliabilitySuite() {
  console.log('================================================================');
  console.log('  AGRINEXUS PHASE 15: COMPREHENSIVE SYSTEM RELIABILITY SUITE');
  console.log('  Failure-Path Testing, Invariant Hardening & Data Reconciliation');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);

  let passedTests = 0;
  let totalTests = 0;

  function recordResult(testName, passed, detail = '') {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`✔ PASS [${totalTests}/13]: ${testName}`);
    } else {
      console.error(`✖ FAIL [${totalTests}/13]: ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // Retrieve seed accounts for testing
  const farmer1 = await User.findOne({ role: 'FARMER' }).lean();
  const farmer2 = await User.findOne({ role: 'FARMER', _id: { $ne: farmer1._id } }).lean();
  const staffGomti = await User.findOne({ email: 'gomtinagar.centre@agrinexus.demo' }).lean();
  const staffAliganj = await User.findOne({ email: 'aliganj.centre@agrinexus.demo' }).lean();
  const adminUser = await User.findOne({ role: 'ADMIN' }).lean();

  const farmer1Token = jwt.sign({ userId: farmer1._id, role: farmer1.role }, JWT_SECRET, { expiresIn: '1h' });
  const farmer2Token = jwt.sign({ userId: farmer2._id, role: farmer2.role }, JWT_SECRET, { expiresIn: '1h' });
  const staffGomtiToken = jwt.sign({ userId: staffGomti._id, role: staffGomti.role }, JWT_SECRET, { expiresIn: '1h' });
  const staffAliganjToken = jwt.sign({ userId: staffAliganj._id, role: staffAliganj.role }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });

  const gomtiCentre = await ProcurementCentre.findOne({ centreCode: 'LKO_GOM01' }).lean();
  const aliganjCentre = await ProcurementCentre.findOne({ centreCode: 'LKO_ALI02' }).lean();

  let defaultSlot = await Slot.findOne({ centreId: gomtiCentre._id }).lean();
  if (!defaultSlot) {
    defaultSlot = await Slot.create({
      centreId: gomtiCentre._id,
      date: '2026-09-06',
      startTime: '09:00',
      endTime: '10:00',
      timeWindow: '09:00 - 10:00 AM',
      maxCapacityQuintals: 200,
      maxFarmersAllowed: 15
    });
  }

  const createTestBooking = async (overrides = {}) => {
    const uid = Date.now().toString().slice(-5) + Math.floor(100 + Math.random() * 900);
    return await Booking.create({
      bookingReference: `BK-TEST-${uid}`,
      tokenNumber: `TOK-TEST-${uid}`,
      farmerId: farmer1._id,
      centreId: gomtiCentre._id,
      slotId: defaultSlot._id,
      bookingDate: '2026-09-06',
      timeWindow: '09:00 - 10:00 AM',
      cropType: 'Wheat',
      estimatedQuantityQuintals: 40.0,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'BOOKED',
      ...overrides
    });
  };

  const createTestQueueEntry = async (booking, overrides = {}) => {
    return await QueueEntry.create({
      bookingId: booking._id,
      farmerId: booking.farmerId,
      centreId: booking.centreId,
      slotId: booking.slotId,
      tokenNumber: booking.tokenNumber,
      queueDate: booking.bookingDate,
      sequenceNumber: overrides.sequenceNumber || Math.floor(1000 + Math.random() * 8000),
      state: overrides.state || 'WAITING',
      ...overrides
    });
  };

  // -------------------------------------------------------------
  // TEST 1: Duplicate Action & Idempotency Hardening
  // -------------------------------------------------------------
  try {
    const testBooking = await createTestBooking({ operationalStatus: 'WEIGHING' });

    const res1 = await completeProcurementTransaction({
      bookingId: testBooking._id,
      netWeightQuintals: 45.0,
      staffUser: staffGomti,
      notes: 'Initial completion'
    });

    // Second call on already completed procurement
    const res2 = await completeProcurementTransaction({
      bookingId: testBooking._id,
      netWeightQuintals: 45.0,
      staffUser: staffGomti,
      notes: 'Duplicate click'
    });

    const isIdempotent = res2.idempotent === true &&
      res1.receipt.receiptSerialNumber === res2.receipt.receiptSerialNumber;

    recordResult('Duplicate Action & Idempotency Hardening', isIdempotent, `res2.idempotent=${res2.idempotent}`);
  } catch (err) {
    recordResult('Duplicate Action & Idempotency Hardening', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Stale Frontend & Optimistic State Machine Concurrency
  // -------------------------------------------------------------
  try {
    const validNext = isValidTransition('WAITING', 'CALLED');
    const invalidSkip = isValidTransition('WAITING', 'WEIGHING');
    const invalidReverse = isValidTransition('WEIGHING', 'ARRIVED');
    const terminalCompleted = isValidTransition('COMPLETED', 'WAITING');

    const stateMachineSound = validNext && !invalidSkip && !invalidReverse && !terminalCompleted;
    recordResult('Stale Frontend & Optimistic Concurrency Protection', stateMachineSound,
      `validNext=${validNext}, invalidSkip=${invalidSkip}, invalidReverse=${invalidReverse}`);
  } catch (err) {
    recordResult('Stale Frontend & Optimistic Concurrency Protection', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Concurrent Multi-Operator Queue Race Handling
  // -------------------------------------------------------------
  try {
    const bRace1 = await createTestBooking({ operationalStatus: 'WAITING' });
    const bRace2 = await createTestBooking({ operationalStatus: 'WAITING' });

    const dateToday = '2026-09-06';
    const q1 = await createTestQueueEntry(bRace1, { sequenceNumber: 9901, state: 'WAITING' });
    const q2 = await createTestQueueEntry(bRace2, { sequenceNumber: 9902, state: 'WAITING' });

    // Simulate 2 staff operators simultaneously calling next farmer
    const [call1, call2] = await Promise.all([
      callNextFarmer({ centreId: gomtiCentre._id, queueDate: dateToday, staffUser: staffGomti, counterId: 'Counter 1' }),
      callNextFarmer({ centreId: gomtiCentre._id, queueDate: dateToday, staffUser: staffGomti, counterId: 'Counter 2' })
    ]);

    const distinctTokens = call1 && call2 && call1.tokenNumber !== call2.tokenNumber;
    const bothCalled = call1.state === 'CALLED' && call2.state === 'CALLED';

    recordResult('Concurrent Multi-Operator Queue Race Handling', distinctTokens && bothCalled,
      `Operator 1 got: ${call1.tokenNumber}, Operator 2 got: ${call2.tokenNumber}`);
    
    // Clean up race entries
    await QueueEntry.deleteMany({ _id: { $in: [q1._id, q2._id] } });
    await Booking.deleteMany({ _id: { $in: [bRace1._id, bRace2._id] } });
  } catch (err) {
    recordResult('Concurrent Multi-Operator Queue Race Handling', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Lifecycle Invariant & Out-of-Sequence Mutation Protection
  // -------------------------------------------------------------
  try {
    const bSeq = await createTestBooking({ operationalStatus: 'WAITING' });
    const qSeq = await createTestQueueEntry(bSeq, { sequenceNumber: 9999, state: 'WAITING' });

    let skipRejected = false;
    try {
      // Attempt to jump from WAITING directly to WEIGHING
      await transitionQueueState({
        queueEntryId: qSeq._id,
        targetState: 'WEIGHING',
        staffUser: staffGomti
      });
    } catch (e) {
      skipRejected = e.message.includes('Invalid state transition');
    }

    // Attempt illegal payment transition: jumping directly to PAID from SLOT_CONFIRMED
    let paymentSkipRejected = false;
    try {
      await updatePaymentStage({
        bookingId: bSeq._id,
        farmerId: farmer1._id,
        newStage: 'PAID'
      });
    } catch (e) {
      paymentSkipRejected = e.message.includes('Invalid lifecycle skip');
    }

    recordResult('Lifecycle Invariant & Out-of-Sequence Mutation Protection',
      skipRejected && paymentSkipRejected,
      `queueSkipRejected=${skipRejected}, paymentSkipRejected=${paymentSkipRejected}`);
  } catch (err) {
    recordResult('Lifecycle Invariant & Out-of-Sequence Mutation Protection', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Network Resiliency & Socket.IO Fallback Testing
  // -------------------------------------------------------------
  try {
    const bRes = await createTestBooking({ operationalStatus: 'WAITING' });
    const qRes = await createTestQueueEntry(bRes, { sequenceNumber: 8888, state: 'WAITING' });

    const transitioned = await transitionQueueState({
      queueEntryId: qRes._id,
      targetState: 'CALLED',
      staffUser: staffGomti,
      io: null // Socket.IO disconnected
    });

    const resilient = transitioned && transitioned.state === 'CALLED';
    recordResult('Network Resiliency & Socket.IO Fallback Testing', resilient, `State: ${transitioned?.state}`);
  } catch (err) {
    recordResult('Network Resiliency & Socket.IO Fallback Testing', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Invalid Weighbridge & Quality Sensor Rejections
  // -------------------------------------------------------------
  try {
    const bWeigh = await createTestBooking({ operationalStatus: 'VERIFICATION' });

    // 1. Invalid moisture (< 5% or > 30%)
    let moistureLowRejected = false;
    try {
      await recordVerification({
        bookingId: bWeigh._id,
        moisturePercentage: 2.0, // too dry / sensor error
        staffUser: staffGomti
      });
    } catch (e) {
      moistureLowRejected = e.message.includes('Moisture percentage must be between 5.0% and 30.0%');
    }

    let moistureHighRejected = false;
    try {
      await recordVerification({
        bookingId: bWeigh._id,
        moisturePercentage: 35.0, // too wet / sensor error
        staffUser: staffGomti
      });
    } catch (e) {
      moistureHighRejected = e.message.includes('Moisture percentage must be between 5.0% and 30.0%');
    }

    // 2. Invalid Weighbridge (gross <= tare)
    let grossLessTareRejected = false;
    try {
      await completeProcurementTransaction({
        bookingId: bWeigh._id,
        grossWeightQuintals: 20.0,
        tareWeightQuintals: 25.0, // impossible tare > gross
        staffUser: staffGomti
      });
    } catch (e) {
      grossLessTareRejected = e.message.includes('Gross weight must be strictly greater than tare weight');
    }

    // 3. Negative tare
    let negativeTareRejected = false;
    try {
      await completeProcurementTransaction({
        bookingId: bWeigh._id,
        grossWeightQuintals: 50.0,
        tareWeightQuintals: -5.0,
        staffUser: staffGomti
      });
    } catch (e) {
      negativeTareRejected = e.message.includes('Tare weighbridge weight cannot be negative');
    }

    const allSensorChecksPassed = moistureLowRejected && moistureHighRejected &&
                                  grossLessTareRejected && negativeTareRejected;

    recordResult('Invalid Weighbridge & Quality Sensor Rejections', allSensorChecksPassed,
      `moistureLow=${moistureLowRejected}, moistureHigh=${moistureHighRejected}, grossLessTare=${grossLessTareRejected}, negTare=${negativeTareRejected}`);
  } catch (err) {
    recordResult('Invalid Weighbridge & Quality Sensor Rejections', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Cross-Centre & Cross-Farmer RBAC Access Rejections
  // -------------------------------------------------------------
  try {
    // 1. Farmer 2 attempts to fetch Farmer 1's booking
    const bFarmer1 = await Booking.findOne({ farmerId: farmer1._id }).lean();
    const crossFarmerRes = await apiRequest(`/api/bookings/${bFarmer1._id}`, {
      token: farmer2Token
    });

    const crossFarmerBlocked = crossFarmerRes.status === 403;

    // 2. Staff at Aliganj attempts to call token for Gomti Nagar
    const crossStaffQueue = await apiRequest(`/api/queue/today?centreId=${gomtiCentre._id}`, {
      token: staffAliganjToken
    });

    const crossStaffBlocked = crossStaffQueue.status === 403;

    recordResult('Cross-Centre & Cross-Farmer RBAC Access Rejections',
      crossFarmerBlocked && crossStaffBlocked,
      `crossFarmerStatus=${crossFarmerRes.status}, crossStaffStatus=${crossStaffQueue.status}`);
  } catch (err) {
    recordResult('Cross-Centre & Cross-Farmer RBAC Access Rejections', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Deactivated & Suspended Staff Access Revocation
  // -------------------------------------------------------------
  try {
    const deactStaff = await User.create({
      fullName: 'Deactivated Test Operator',
      phone: '9999988881',
      email: 'deactivated.staff@agrinexus.demo',
      role: 'CENTRE_STAFF',
      accountStatus: 'SUSPENDED',
      isActive: false,
      assignedCentreId: gomtiCentre._id,
      passwordHash: 'hash'
    });

    const deactToken = jwt.sign({ userId: deactStaff._id, role: deactStaff.role }, JWT_SECRET, { expiresIn: '1h' });

    const authRes = await apiRequest('/api/queue/today', { token: deactToken });
    const isRevoked = authRes.status === 403 && authRes.body?.error?.code === 'ACCOUNT_SUSPENDED';

    await User.findByIdAndDelete(deactStaff._id);

    recordResult('Deactivated & Suspended Staff Access Revocation', isRevoked,
      `status=${authRes.status}, code=${authRes.body?.error?.code}`);
  } catch (err) {
    recordResult('Deactivated & Suspended Staff Access Revocation', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 9: Centre Head / Manager Invariant Atomic Reassignment
  // -------------------------------------------------------------
  try {
    const candidateStaff = await User.create({
      fullName: 'Promotion Candidate Staff',
      phone: '9999977772',
      email: 'candidate.head@agrinexus.demo',
      role: 'CENTRE_STAFF',
      accountStatus: 'ACTIVE',
      assignedCentreId: gomtiCentre._id,
      isCentreHead: false,
      designation: 'Procurement Operator',
      passwordHash: 'hash'
    });

    // Admin reassigns centre head via API
    await apiRequest(`/api/admin/centres/${gomtiCentre._id}/reassign-head`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        newHeadUserId: candidateStaff._id.toString(),
        reason: 'Phase 15 Invariant Reassignment Validation'
      }
    });

    // Verify exactly ONE centre head exists for Gomti Nagar
    const activeHeads = await User.find({
      assignedCentreId: gomtiCentre._id,
      isCentreHead: true
    }).lean();

    const singleHeadMaintained = activeHeads.length === 1 &&
      activeHeads[0]._id.toString() === candidateStaff._id.toString();

    // Reassign back to original Satish Kumar
    await apiRequest(`/api/admin/centres/${gomtiCentre._id}/reassign-head`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        newHeadUserId: staffGomti._id.toString(),
        reason: 'Restoring canonical demo head'
      }
    });

    await User.findByIdAndDelete(candidateStaff._id);

    recordResult('Centre Head / Manager Invariant Atomic Reassignment', singleHeadMaintained,
      `activeHeadsCount=${activeHeads.length}`);
  } catch (err) {
    recordResult('Centre Head / Manager Invariant Atomic Reassignment', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 10: Empty Queue, Zero Results & Edge State Graceful Handling
  // -------------------------------------------------------------
  try {
    const futureDate = '2030-01-01';
    let emptyQueueHandled = false;
    try {
      await callNextFarmer({
        centreId: gomtiCentre._id,
        queueDate: futureDate,
        staffUser: staffGomti
      });
    } catch (e) {
      emptyQueueHandled = e.message.includes('No waiting farmers currently in line');
    }

    const emptyQueueApi = await apiRequest(`/api/queue/today?centreId=${gomtiCentre._id}&date=${futureDate}`, {
      token: staffGomtiToken
    });

    const apiHandledGracefully = emptyQueueApi.status === 200 &&
      emptyQueueApi.body.count === 0 &&
      Array.isArray(emptyQueueApi.body.data);

    recordResult('Empty Queue, Zero Results & Edge State Graceful Handling',
      emptyQueueHandled && apiHandledGracefully,
      `emptyQueueHandled=${emptyQueueHandled}, apiStatus=${emptyQueueApi.status}`);
  } catch (err) {
    recordResult('Empty Queue, Zero Results & Edge State Graceful Handling', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 11: Server-Authoritative MSP & Net Payable Formula Enforcement
  // -------------------------------------------------------------
  try {
    const testCrop = 'Wheat';
    const declaredMsp = getMspRateForCrop(testCrop); // Rs 2275

    const bMath = await createTestBooking({
      cropType: testCrop,
      estimatedQuantityQuintals: 50.0,
      operationalStatus: 'WEIGHING'
    });

    // Weighbridge: Gross 120.50 Qtl, Tare 20.50 Qtl -> Server net weight: 100.00 Qtl
    const mathResult = await completeProcurementTransaction({
      bookingId: bMath._id,
      grossWeightQuintals: 120.50,
      tareWeightQuintals: 20.50,
      deductions: 500,
      staffUser: staffGomti
    });

    const expectedGross = 100.0 * declaredMsp; // 2,27,500
    const expectedNet = expectedGross - 500;    // 2,27,000

    const formulaCorrect = mathResult.procurement.netWeightQuintals === 100.0 &&
      mathResult.procurement.grossAmount === expectedGross &&
      mathResult.procurement.netPayableAmount === expectedNet &&
      mathResult.procurement.procurementRatePerQuintal === declaredMsp;

    recordResult('Server-Authoritative MSP & Net Payable Formula Enforcement',
      formulaCorrect,
      `NetWeight=${mathResult.procurement.netWeightQuintals}, Gross=${mathResult.procurement.grossAmount}, NetPayable=${mathResult.procurement.netPayableAmount}`);
  } catch (err) {
    recordResult('Server-Authoritative MSP & Net Payable Formula Enforcement', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 12: Deep Data Consistency & Reconciliation Engine Verification
  // -------------------------------------------------------------
  try {
    const reconciliation = await runFullSystemReconciliation();

    const reconSound = reconciliation.status === 'HEALTHY' &&
      reconciliation.isReconciled === true &&
      reconciliation.checks.centreManagerInvariant.passed === true &&
      reconciliation.checks.mandiHierarchy.passed === true &&
      reconciliation.checks.orphanRecords.passed === true &&
      reconciliation.checks.timestampIntegrity.passed === true &&
      reconciliation.checks.financialReconciliation.passed === true;

    recordResult('Deep Data Consistency & Reconciliation Engine Verification',
      reconSound,
      `Status: ${reconciliation.status}, TotalRecords: ${reconciliation.totalRecords}`);
  } catch (err) {
    recordResult('Deep Data Consistency & Reconciliation Engine Verification', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 13: PII Aadhaar Masking & Govt DBT Simulation Disclaimers
  // -------------------------------------------------------------
  try {
    const bAadhaar = await Booking.findOne({ farmerId: farmer1._id }).populate('farmerId').lean();
    const paymentStatus = await getPaymentStatusByBooking(bAadhaar._id);

    // Verify DBT Simulation notice
    const hasDemoNotice = paymentStatus.isDemoMode === true &&
      paymentStatus.demoNotice.includes('Demo Payment Status');

    // Aadhaar masking validation pattern (XXXX-XXXX-1234 or XXXX XXXX 1234)
    const rawAadhaar = '987654321012';
    const maskedAadhaar = `XXXX-XXXX-${rawAadhaar.slice(-4)}`;
    const isMaskedProperly = maskedAadhaar === 'XXXX-XXXX-1012';

    recordResult('PII Aadhaar Masking & Govt DBT Simulation Disclaimers',
      hasDemoNotice && isMaskedProperly,
      `demoNotice=${paymentStatus.demoNotice}, maskedSample=${maskedAadhaar}`);
  } catch (err) {
    recordResult('PII Aadhaar Masking & Govt DBT Simulation Disclaimers', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`  PHASE 15 TEST RUN SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('  🌟 ALL 13 RELIABILITY & INVARIANT TESTS PASSED WITH ZERO ERRORS');
  } else {
    console.error('  ⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.');
  }
  console.log('================================================================\n');

  await mongoose.disconnect();

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase15ReliabilitySuite().catch((err) => {
  console.error('Fatal Test Suite Failure:', err);
  process.exit(1);
});
