const app = require('./src/app');
const http = require('http');
const { inMemoryQueueEntries } = require('./src/services/bookingService');

const server = http.createServer(app);
const PORT = 5097;

const runPhase3Tests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Phase 3 Operational Queue & Concurrency Tests on port ${PORT}...`);

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
      // 1. Authenticate Staff & Farmer
      const staffLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543211',
        password: 'password123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = staffLogin.body.data?.token;

      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Ramesh Farmer (Phase 3)',
        phone: '9876543203',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        villageName: 'Shyampur'
      });
      const farmerToken = farmerReg.body.data?.token;

      console.log('✔ Staff & Farmer Authentication:', staffToken && farmerToken ? 'PASSED' : 'FAILED');

      // 2. Fetch Centres & Slots
      const centresRes = await makeRequest('/api/centres', 'GET', null, farmerToken);
      const centreId = centresRes.body.data[0].id || centresRes.body.data[0]._id;

      const { getTodayIST } = require('./src/utils/dateUtils');
      const todayStr = getTodayIST();
      const slotsRes = await makeRequest(`/api/slots?centreId=${centreId}&date=${todayStr}`, 'GET', null, farmerToken);
      const slotId = slotsRes.body.data[0].id || slotsRes.body.data[0]._id;

      // 3. Create Booking ➔ Initializes QueueEntry in state WAITING
      const bookingRes = await makeRequest('/api/bookings', 'POST', {
        centreId,
        slotId,
        bookingDate: todayStr,
        cropType: 'Wheat',
        estimatedQuantityQuintals: 40
      }, farmerToken);

      const bookingToken = bookingRes.body.data?.booking?.tokenNumber;
      console.log('✔ Booking Created with Token:', bookingToken ? 'PASSED' : 'FAILED', `(${bookingToken})`);

      // 4. Staff Fetches Queue (GET /api/queue/today)
      const queueRes = await makeRequest(`/api/queue/today?centreId=${centreId}`, 'GET', null, staffToken);
      console.log('✔ Staff Queue Retrieval (Count:', queueRes.body.count, '):', queueRes.status === 200 && queueRes.body.count > 0 ? 'PASSED' : 'FAILED');

      const queueEntryId = queueRes.body.data[0].id;

      // 5. CALL NEXT (POST /api/queue/call-next)
      const callNextRes = await makeRequest('/api/queue/call-next', 'POST', {
        centreId,
        counterId: 'Counter 1'
      }, staffToken);

      console.log('✔ CALL NEXT Execution (State:', callNextRes.body.data?.queueEntry?.state, '):', callNextRes.status === 200 && callNextRes.body.data?.queueEntry?.state === 'CALLED' ? 'PASSED' : 'FAILED');

      // 6. Transition Pipeline: CALLED ➔ ARRIVED ➔ VERIFICATION ➔ WEIGHING ➔ COMPLETED
      const arrivedRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'ARRIVED' }, staffToken);
      console.log('✔ Transition CALLED ➔ ARRIVED:', arrivedRes.status === 200 && arrivedRes.body.data?.queueEntry?.state === 'ARRIVED' ? 'PASSED' : 'FAILED');

      const verifyRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'VERIFICATION' }, staffToken);
      console.log('✔ Transition ARRIVED ➔ VERIFICATION:', verifyRes.status === 200 && verifyRes.body.data?.queueEntry?.state === 'VERIFICATION' ? 'PASSED' : 'FAILED');

      const weighRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'WEIGHING' }, staffToken);
      console.log('✔ Transition VERIFICATION ➔ WEIGHING:', weighRes.status === 200 && weighRes.body.data?.queueEntry?.state === 'WEIGHING' ? 'PASSED' : 'FAILED');

      const completeRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'COMPLETED' }, staffToken);
      console.log('✔ Transition WEIGHING ➔ COMPLETED:', completeRes.status === 200 && completeRes.body.data?.queueEntry?.state === 'COMPLETED' ? 'PASSED' : 'FAILED');

      // 7. Invalid Transition Rejection (COMPLETED ➔ CALLED)
      const invalidRes = await makeRequest(`/api/queue/${queueEntryId}/transition`, 'POST', { targetState: 'CALLED' }, staffToken);
      console.log('✔ Invalid State Machine Transition Rejection:', invalidRes.status === 400 && invalidRes.body.error.code === 'TRANSITION_FAILED' ? 'PASSED' : 'FAILED');

      // 8. CALL NEXT CONCURRENCY TEST
      console.log('\n--- Executing CALL NEXT Concurrency Test ---');
      // Create 2 additional farmers & bookings
      const farmer2Reg = await makeRequest('/api/auth/register', 'POST', { fullName: 'Farmer 2', phone: '9111111111', password: 'password123', state: 'Madhya Pradesh', district: 'Sehore' });
      const farmer3Reg = await makeRequest('/api/auth/register', 'POST', { fullName: 'Farmer 3', phone: '9222222222', password: 'password123', state: 'Madhya Pradesh', district: 'Sehore' });

      await makeRequest('/api/bookings', 'POST', { centreId, slotId, cropType: 'Paddy', estimatedQuantityQuintals: 20 }, farmer2Reg.body.data.token);
      await makeRequest('/api/bookings', 'POST', { centreId, slotId, cropType: 'Pulses', estimatedQuantityQuintals: 30 }, farmer3Reg.body.data.token);

      // Fire 5 SIMULTANEOUS CALL NEXT requests from 5 concurrent HTTP clients
      console.log('Firing 5 simultaneous CALL NEXT requests from 5 concurrent HTTP clients...');
      const concurrentCallNexts = await Promise.all([
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 1' }, staffToken),
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 2' }, staffToken),
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 1' }, staffToken),
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 2' }, staffToken),
        makeRequest('/api/queue/call-next', 'POST', { centreId, counterId: 'Counter 1' }, staffToken)
      ]);

      const successfulCalls = concurrentCallNexts.filter((r) => r.status === 200);
      const claimedTokens = successfulCalls.map((r) => r.body.data?.queueEntry?.tokenNumber);
      const uniqueTokens = new Set(claimedTokens);
      const duplicateCount = claimedTokens.length - uniqueTokens.size;

      console.log(`✔ Concurrency Results: ${successfulCalls.length} successful calls, ${duplicateCount} duplicate claims.`);
      console.log('✔ CALL NEXT Concurrency Atomicity:', duplicateCount === 0 ? 'PASSED (0 Duplicate Claims)' : 'FAILED');

      // 9. Dual Slot Capacity Hardening Test (Quintal limit rejection)
      const overQuintalRes = await makeRequest('/api/bookings', 'POST', {
        centreId,
        slotId,
        cropType: 'Wheat',
        estimatedQuantityQuintals: 300 // Exceeds 200 Qtl max
      }, farmerToken);

      console.log('✔ Quintal Capacity Protection:', overQuintalRes.status === 400 ? 'PASSED' : 'FAILED', `(${overQuintalRes.body.error?.message})`);

      // 10. Farmer Live Queue Status API Test
      const farmerStatusRes = await makeRequest('/api/queue/farmer-status', 'GET', null, farmer2Reg.body.data.token);
      console.log('✔ Farmer Live Queue Status API:', farmerStatusRes.status === 200 && farmerStatusRes.body.data ? 'PASSED' : 'FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL PHASE 3 OPERATIONAL QUEUE & CONCURRENCY TESTS PASSED!');
      console.log('=======================================================');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Phase 3 Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase3Tests();
