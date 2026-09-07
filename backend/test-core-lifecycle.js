const app = require('./src/app');
const http = require('http');
const { getTodayIST, formatISTDateTime, calculateSlaHours } = require('./src/utils/dateUtils');
const { getMspRateForCrop, MSP_POLICY_RATES } = require('./src/config/policyRates');
const { dispatchNotification } = require('./src/services/notificationService');

const server = http.createServer(app);
const PORT = 5098;

const runCoreLifecycleTests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running AgriNexus Consolidated Core Lifecycle Test Battery on port ${PORT}...`);

    const makeRequest = (path, method = 'GET', body = null, token = null) => {
      return new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: PORT,
            path,
            method,
            headers
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, body: data });
              }
            });
          }
        );

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    };

    let passedCount = 0;
    let totalCount = 0;

    const assertCheck = (label, condition, detail = '') => {
      totalCount++;
      if (condition) {
        passedCount++;
        console.log(`✔ [${totalCount}] ${label} ${detail ? '(' + detail + ')' : ''}: PASSED`);
      } else {
        console.error(`❌ [${totalCount}] ${label} ${detail ? '(' + detail + ')' : ''}: FAILED`);
        throw new Error(`Assertion failed: ${label}`);
      }
    };

    try {
      // -------------------------------------------------------------
      // 1. POLICY & UTILITY HARDENING CHECKS
      // -------------------------------------------------------------
      const todayIST = getTodayIST();
      assertCheck('IST Operational Date Format', /^\d{4}-\d{2}-\d{2}$/.test(todayIST), todayIST);

      const wheatRate = getMspRateForCrop('Wheat');
      const paddyRate = getMspRateForCrop('Paddy');
      assertCheck('Centralized MSP Policy Rates Authority', wheatRate === 2275 && paddyRate === 2300, `Wheat: ₹${wheatRate}, Paddy: ₹${paddyRate}`);

      const validSla = calculateSlaHours('2026-09-01T10:00:00Z', '2026-09-01T18:30:00Z');
      const missingTimestampSla = calculateSlaHours(null, '2026-09-01T18:30:00Z');
      assertCheck('Payment SLA Calculation with Null Tolerance', validSla === 8.5 && missingTimestampSla === null, `Valid: ${validSla}h, Missing: ${missingTimestampSla}`);

      const unavailableFormatted = formatISTDateTime(null);
      assertCheck('Zero vs Data Unavailable Semantics', unavailableFormatted === 'Data unavailable', unavailableFormatted);

      // -------------------------------------------------------------
      // 2. AUTH SETUP FOR LIFECYCLE (Admin, Staff, Farmer)
      // -------------------------------------------------------------
      const adminLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'admin@agrinexus.gov.in',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      const adminToken = adminLogin.body.data?.token;

      const staffLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'gomtinagar.centre@agrinexus.demo',
        password: 'password123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = staffLogin.body.data?.token;

      const testPhone = '987' + Math.floor(1000000 + Math.random() * 9000000);
      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Lifecycle Farmer',
        phone: testPhone,
        password: 'password123',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        villageName: 'Chinhat'
      });
      const farmerToken = farmerReg.body.data?.token;

      assertCheck('Auth Tokens Initialized (Admin, Staff, Farmer)', !!(adminToken && staffToken && farmerToken));

      // -------------------------------------------------------------
      // 3. CENTRE & SLOT RETRIEVAL & CAPACITY CHECKS
      // -------------------------------------------------------------
      const centresRes = await makeRequest('/api/centres', 'GET', null, farmerToken);
      assertCheck('Centre List Retrieval', centresRes.status === 200 && centresRes.body.data?.length > 0);
      const centreId = centresRes.body.data[0].id || centresRes.body.data[0]._id;

      const slotsRes = await makeRequest(`/api/slots?centreId=${centreId}&date=${todayIST}`, 'GET', null, farmerToken);
      assertCheck('Slots Retrieval for Operational Date', slotsRes.status === 200 && slotsRes.body.data?.length > 0);
      // Pick a slot that is not FULL
      const availableSlot = slotsRes.body.data.find(s => s.status !== 'FULL') || slotsRes.body.data[0];
      const slotId = availableSlot.id || availableSlot._id;

      // Over-capacity rejection (> 200 Quintals limit)
      const overCapacityRes = await makeRequest('/api/bookings', 'POST', {
        centreId,
        slotId,
        cropType: 'Wheat',
        estimatedQuantityQuintals: 350
      }, farmerToken);
      assertCheck('Slot Quintal Max Capacity Protection', overCapacityRes.status === 400);

      // -------------------------------------------------------------
      // 4. BOOKING CREATION & QUEUE INITIALIZATION
      // -------------------------------------------------------------
      const bookingRes = await makeRequest('/api/bookings', 'POST', {
        centreId,
        slotId,
        bookingDate: todayIST,
        cropType: 'Wheat',
        estimatedQuantityQuintals: 44
      }, farmerToken);
      const booking = bookingRes.body.data?.booking;
      const bookingId = booking?._id || booking?.id;
      const tokenNumber = booking?.tokenNumber;
      assertCheck('Booking & Token Creation', bookingRes.status === 201 && !!tokenNumber && !!bookingId, `Token: ${tokenNumber}`);

      // -------------------------------------------------------------
      // 5. QUEUE RETRIEVAL & CALL NEXT CONCURRENCY
      // -------------------------------------------------------------
      const queueRes = await makeRequest(`/api/queue/today?centreId=${centreId}`, 'GET', null, staffToken);
      assertCheck('Staff Today Queue Retrieval', queueRes.status === 200 && queueRes.body.count > 0);
      
      const queueEntry = queueRes.body.data.find(q => {
        const bId = q.bookingId?._id || q.bookingId?.id || q.bookingId;
        return bId === bookingId;
      }) || queueRes.body.data[0];
      const queueEntryId = queueEntry.id || queueEntry._id;

      // Concurrency check on Call Next
      const concurrentCalls = await Promise.all([
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 1' }, staffToken),
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 2' }, staffToken),
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 1' }, staffToken)
      ]);
      const successfulCalls = concurrentCalls.filter((r) => r.status === 200);
      const claimedTokens = successfulCalls.map((r) => r.body.data?.queueEntry?.tokenNumber);
      const uniqueTokens = new Set(claimedTokens);
      const duplicateClaims = claimedTokens.length - uniqueTokens.size;
      assertCheck('Call Next Concurrency Atomicity', duplicateClaims === 0, `Successful: ${successfulCalls.length}, Duplicates: ${duplicateClaims}`);

      // -------------------------------------------------------------
      // 6. QUEUE STATE TRANSITIONS PIPELINE
      // -------------------------------------------------------------
      // Transition to ARRIVED
      const arrivedRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'ARRIVED' }, staffToken);
      assertCheck('Queue Transition: ARRIVED', arrivedRes.status === 200 && arrivedRes.body.data?.queueEntry?.state === 'ARRIVED');

      // Transition to VERIFICATION
      const verStageRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'VERIFICATION' }, staffToken);
      assertCheck('Queue Transition: VERIFICATION', verStageRes.status === 200 && verStageRes.body.data?.queueEntry?.state === 'VERIFICATION');

      // Transition to WEIGHING
      const weighStageRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'WEIGHING' }, staffToken);
      assertCheck('Queue Transition: WEIGHING', weighStageRes.status === 200 && weighStageRes.body.data?.queueEntry?.state === 'WEIGHING');

      // Transition to COMPLETED
      const completeStageRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'COMPLETED' }, staffToken);
      assertCheck('Queue Transition: COMPLETED', completeStageRes.status === 200 && completeStageRes.body.data?.queueEntry?.state === 'COMPLETED');

      // Invalid transition rejection (COMPLETED -> CALLED)
      const invalidTransRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'CALLED' }, staffToken);
      assertCheck('Invalid Backward Transition Rejection', invalidTransRes.status === 400);

      // -------------------------------------------------------------
      // 7. PRODUCE VERIFICATION & WEIGHBRIDGE MSP CALCULATION
      // -------------------------------------------------------------
      // Invalid moisture (> 100%) rejection
      const invalidMoisture = await makeRequest(`/api/procurements/${bookingId}/verify`, 'POST', {
        verifiedQuantityQuintals: 44,
        moisturePercentage: 115,
        qualityGrade: 'Grade A'
      }, staffToken);
      assertCheck('Invalid Moisture (>100%) Rejection', invalidMoisture.status === 400);

      // Valid produce verification
      const verifyRes = await makeRequest(`/api/procurements/${bookingId}/verify`, 'POST', {
        verifiedQuantityQuintals: 44.0,
        moisturePercentage: 11.5,
        qualityGrade: 'Grade A'
      }, staffToken);
      assertCheck('Quality Grade Verification Recorded', verifyRes.status === 200 && verifyRes.body.data?.qualityGrade === 'Grade A');

      // Weighbridge & Net MSP Financial Calculation
      const weighRes = await makeRequest(`/api/procurements/${bookingId}/weigh-complete`, 'POST', {
        netWeightQuintals: 44.0,
        deductions: 0
      }, staffToken);
      const procurement = weighRes.body.data?.procurement;
      const receipt = weighRes.body.data?.receipt;
      const expectedAmount = 44.0 * 2275; // ₹1,00,100
      assertCheck('MSP Financial Calculation (44 Qtl @ ₹2,275 = ₹1,00,100)', procurement?.grossAmount === expectedAmount, `Gross: ₹${procurement?.grossAmount}`);
      assertCheck('Digital Receipt Serial Generated', !!receipt?.receiptSerialNumber, receipt?.receiptSerialNumber);

      // -------------------------------------------------------------
      // 8. 8-STAGE PAYMENT PIPELINE & TAMPER REJECTION
      // -------------------------------------------------------------
      const payStatusRes = await makeRequest(`/api/payments/${bookingId}`, 'GET', null, farmerToken);
      assertCheck('Payment Pipeline Stage Initialized', payStatusRes.status === 200 && payStatusRes.body.data?.currentStage === 'PROCUREMENT_COMPLETED');

      // Advance to PAYMENT_INITIATED -> PAYMENT_PROCESSING -> PAID
      await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAYMENT_INITIATED' }, staffToken);
      await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAYMENT_PROCESSING' }, staffToken);
      const paidRes = await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAID' }, staffToken);
      assertCheck('Payment Pipeline Advanced to PAID', paidRes.status === 200 && paidRes.body.data?.currentStage === 'PAID');

      // Backward transition rejection
      const invalidPayStage = await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAYMENT_INITIATED' }, staffToken);
      assertCheck('Backward Payment Stage Rejection', invalidPayStage.status === 400);

      // -------------------------------------------------------------
      // 9. NOTIFICATIONS & RESILIENCE
      // -------------------------------------------------------------
      let errorThrown = false;
      try {
        await dispatchNotification({
          userId: 'non_existent_user',
          phone: '9999999999',
          title: 'Resilience Test',
          message: 'Testing graceful failure handling'
        });
      } catch (err) {
        errorThrown = true;
      }
      assertCheck('Notification Failure Non-Blocking Resilience', !errorThrown);

      const notifRes = await makeRequest('/api/notifications', 'GET', null, farmerToken);
      assertCheck('Farmer Notifications Retrieved', notifRes.status === 200 && notifRes.body.count > 0);

      // -------------------------------------------------------------
      // 10. RECONCILIATION & ADMIN OVERVIEW
      // -------------------------------------------------------------
      const reconRes = await makeRequest('/api/admin/reconciliation', 'GET', null, adminToken);
      assertCheck('Admin Financial Reconciliation Integrity', reconRes.status === 200 && reconRes.body.data?.isReconciled === true);

      console.log('=======================================================');
      console.log(`🎉 ALL ${passedCount}/${totalCount} CONSOLIDATED CORE LIFECYCLE TESTS PASSED!`);
      console.log('=======================================================');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Core Lifecycle Test Suite Failed:', err);
      server.close(() => process.exit(1));
    }
  });
};

runCoreLifecycleTests();
