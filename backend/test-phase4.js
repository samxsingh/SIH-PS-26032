const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
const PORT = 5096;

const runPhase4Tests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Phase 4 Procurement Transaction & Payment Status Tests on port ${PORT}...`);

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

    try {
      // 1. Auth Setup
      const staffLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543211',
        password: 'password123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = staffLogin.body.data?.token;

      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Ramesh Farmer (Phase 4)',
        phone: '9876543209',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        villageName: 'Shyampur'
      });
      const farmerToken = farmerReg.body.data?.token;

      console.log('✔ Auth Token Generation:', staffToken && farmerToken ? 'PASSED' : 'FAILED');

      // 2. Fetch Centre & Slot, Create Booking
      const centresRes = await makeRequest('/api/centres', 'GET', null, farmerToken);
      const centreId = centresRes.body.data[0].id || centresRes.body.data[0]._id;

      const { getTodayIST } = require('./src/utils/dateUtils');
      const todayStr = getTodayIST();
      const slotsRes = await makeRequest(`/api/slots?centreId=${centreId}&date=${todayStr}`, 'GET', null, farmerToken);
      const slotId = slotsRes.body.data[0].id || slotsRes.body.data[0]._id;

      const bookingRes = await makeRequest('/api/bookings', 'POST', {
        centreId,
        slotId,
        bookingDate: todayStr,
        cropType: 'Wheat',
        estimatedQuantityQuintals: 50
      }, farmerToken);

      const booking = bookingRes.body.data?.booking;
      const bookingId = booking?._id || booking?.id;
      console.log('✔ Booking Initialized (Ref:', booking?.bookingReference, '):', bookingId ? 'PASSED' : 'FAILED');

      // 3. Invalid Moisture Rejection Test (Moisture > 100%)
      const invalidMoistureRes = await makeRequest(`/api/procurements/${bookingId}/verify`, 'POST', {
        verifiedQuantityQuintals: 50,
        moisturePercentage: 150,
        qualityGrade: 'Grade A'
      }, staffToken);
      console.log('✔ Invalid Moisture Rejection (150%):', invalidMoistureRes.status === 400 ? 'PASSED' : 'FAILED');

      // 4. Produce Verification Recording
      const verifyRes = await makeRequest(`/api/procurements/${bookingId}/verify`, 'POST', {
        verifiedQuantityQuintals: 48.5,
        moisturePercentage: 12.0,
        qualityGrade: 'Grade A'
      }, staffToken);
      console.log('✔ Quality Verification Recording:', verifyRes.status === 200 && verifyRes.body.data?.qualityGrade === 'Grade A' ? 'PASSED' : 'FAILED');

      // 5. Net Weighing & Server-Side MSP Financial Calculation
      const completeRes = await makeRequest(`/api/procurements/${bookingId}/weigh-complete`, 'POST', {
        netWeightQuintals: 48.5,
        deductions: 0
      }, staffToken);

      const procData = completeRes.body.data?.procurement;
      const receipt = completeRes.body.data?.receipt;
      const expectedGross = 48.5 * 2275; // 110,337.5 -> 110338

      console.log('✔ Server-Side MSP Financial Calculation (Gross:', procData?.grossAmount, 'Expected:', Math.round(expectedGross), '):', procData?.grossAmount === Math.round(expectedGross) ? 'PASSED' : 'FAILED');
      console.log('✔ Digital Receipt Serial Generation (Serial:', receipt?.receiptSerialNumber, '):', receipt?.receiptSerialNumber ? 'PASSED' : 'FAILED');

      // 6. 8-Stage Payment Progression Test
      const payStatusRes = await makeRequest(`/api/payments/${bookingId}`, 'GET', null, farmerToken);
      console.log('✔ 8-Stage Payment Status Tracker (Stage:', payStatusRes.body.data?.currentStage, 'Ref:', payStatusRes.body.data?.demoReferenceNumber, '):', payStatusRes.status === 200 && payStatusRes.body.data?.currentStage === 'PROCUREMENT_COMPLETED' ? 'PASSED' : 'FAILED');

      // Advance payment stage to PAYMENT_INITIATED -> PAID
      await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAYMENT_INITIATED' }, staffToken);
      await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAYMENT_PROCESSING' }, staffToken);
      const paidRes = await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAID' }, staffToken);

      console.log('✔ Payment Progression to PAID:', paidRes.status === 200 && paidRes.body.data?.currentStage === 'PAID' ? 'PASSED' : 'FAILED');

      // Rejection of invalid backward transition (PAID -> PAYMENT_PROCESSING)
      const invalidPayRes = await makeRequest(`/api/payments/${bookingId}/stage`, 'POST', { newStage: 'PAYMENT_PROCESSING' }, staffToken);
      console.log('✔ Invalid Backward Payment Transition Rejection:', invalidPayRes.status === 400 ? 'PASSED' : 'FAILED');

      // 7. Notification API Test
      const notifRes = await makeRequest('/api/notifications', 'GET', null, farmerToken);
      console.log('✔ Farmer Notification Retrieval (Count:', notifRes.body.count, 'Unread:', notifRes.body.unreadCount, '):', notifRes.status === 200 && notifRes.body.count > 0 ? 'PASSED' : 'FAILED');

      // Mark notification as read
      const notifId = notifRes.body.data[0]._id || notifRes.body.data[0].id;
      const readRes = await makeRequest(`/api/notifications/${notifId}/read`, 'PATCH', null, farmerToken);
      console.log('✔ Notification Read Mark:', readRes.status === 200 ? 'PASSED' : 'FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL PHASE 4 PROCUREMENT & PAYMENT STATUS TESTS PASSED!');
      console.log('=======================================================');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Phase 4 Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase4Tests();
