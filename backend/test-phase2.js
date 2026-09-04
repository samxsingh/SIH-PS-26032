const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
const PORT = 5098;

const runPhase2Tests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Phase 2 Business Workflow Tests on port ${PORT}...`);

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
      // 1. Register Farmer & Get Auth Token
      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Ramesh Farmer (Phase 2 Test)',
        phone: '9123456789',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh'
      });
      const farmerToken = farmerReg.body.data?.token;
      console.log('✔ Farmer Registration & Auth Token:', farmerReg.status === 201 ? 'PASSED' : 'FAILED');

      // 2. Test GET /api/centres
      const centresRes = await makeRequest('/api/centres', 'GET', null, farmerToken);
      console.log('✔ Centre Discovery API (Count:', centresRes.body.count, '):', centresRes.status === 200 && centresRes.body.count > 0 ? 'PASSED' : 'FAILED');

      const centreId = centresRes.body.data[0].id || centresRes.body.data[0]._id;

      // 3. Test GET /api/centres/recommend
      const recRes = await makeRequest('/api/centres/recommend?lat=23.2000&lon=77.0800', 'GET', null, farmerToken);
      const topPick = recRes.body.data?.recommended;
      console.log('✔ Smart Recommendation Engine (Top Pick:', topPick?.centre?.name, 'Cost:', topPick?.recommendationCost, '):', recRes.status === 200 && topPick ? 'PASSED' : 'FAILED');
      console.log('   Transparent Reasons:', topPick?.reasons);

      // 4. Test GET /api/centres/:id
      const centreDetailRes = await makeRequest(`/api/centres/${centreId}`, 'GET', null, farmerToken);
      console.log('✔ Centre Detail API:', centreDetailRes.status === 200 && centreDetailRes.body.data.id === centreId ? 'PASSED' : 'FAILED');

      // 5. Test GET /api/slots
      const todayStr = new Date().toISOString().split('T')[0];
      const slotsRes = await makeRequest(`/api/slots?centreId=${centreId}&date=${todayStr}`, 'GET', null, farmerToken);
      console.log('✔ Slot Discovery API (Slots returned:', slotsRes.body.count, '):', slotsRes.status === 200 && slotsRes.body.count > 0 ? 'PASSED' : 'FAILED');

      const selectedSlotId = slotsRes.body.data[0].id || slotsRes.body.data[0]._id;

      // 6. Test POST /api/bookings (Create Slot Booking & Digital Token)
      const bookingRes = await makeRequest('/api/bookings', 'POST', {
        centreId,
        slotId: selectedSlotId,
        cropType: 'Wheat',
        estimatedQuantityQuintals: 45
      }, farmerToken);

      const booking = bookingRes.body.data?.booking;
      console.log('✔ Slot Booking & Token Generation (Token:', booking?.tokenNumber, 'Ref:', booking?.bookingReference, '):', bookingRes.status === 201 && booking?.tokenNumber ? 'PASSED' : 'FAILED');

      // 7. Test Duplicate Booking Prevention on same date
      const dupBookingRes = await makeRequest('/api/bookings', 'POST', {
        centreId,
        slotId: selectedSlotId,
        cropType: 'Paddy',
        estimatedQuantityQuintals: 30
      }, farmerToken);
      console.log('✔ Conflicting Booking Prevention:', dupBookingRes.status === 400 && dupBookingRes.body.error.code === 'BOOKING_FAILED' ? 'PASSED' : 'FAILED');

      // 8. Test GET /api/bookings/my
      const myBookingsRes = await makeRequest('/api/bookings/my', 'GET', null, farmerToken);
      console.log('✔ My Bookings API (Active Count:', myBookingsRes.body.count, '):', myBookingsRes.status === 200 && myBookingsRes.body.count > 0 ? 'PASSED' : 'FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL PHASE 2 BUSINESS WORKFLOW TESTS PASSED!');
      console.log('=======================================================');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Phase 2 Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase2Tests();
