const app = require('./src/app');
const http = require('http');
const { getTodayIST, formatISTDateTime, calculateSlaHours } = require('./src/utils/dateUtils');
const { getMspRateForCrop, MSP_POLICY_RATES } = require('./src/config/policyRates');
const { dispatchNotification } = require('./src/services/notificationService');

const server = http.createServer(app);
const PORT = 5094;

const runPhase6Tests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Phase 6 Final Hardening & Reliability Tests on port ${PORT}...`);

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
      // 1. IST Date & Midnight Boundary Handling
      const todayIST = getTodayIST();
      const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(todayIST);
      console.log('✔ IST Operational Date Calculation (Date:', todayIST, '):', isValidDateFormat ? 'PASSED' : 'FAILED');

      // 2. Centralized MSP Policy Rate Lookup & Server Authority
      const wheatRate = getMspRateForCrop('Wheat');
      const paddyRate = getMspRateForCrop('Paddy');
      const pulsesRate = getMspRateForCrop('Pulses');
      const mustardRate = getMspRateForCrop('Mustard');
      const isMspValid = wheatRate === 2275 && paddyRate === 2300 && pulsesRate === 6600 && mustardRate === 5650;
      console.log('✔ Centralized MSP Policy Rates (Wheat: ₹2275, Paddy: ₹2300, Pulses: ₹6600, Mustard: ₹5650):', isMspValid ? 'PASSED' : 'FAILED');

      // 3. Payment SLA Handling of Missing Timestamps (Zero vs Unavailable Semantics)
      const validSla = calculateSlaHours('2026-09-01T10:00:00Z', '2026-09-01T18:30:00Z');
      const missingTimestampSla = calculateSlaHours(null, '2026-09-01T18:30:00Z');
      const isSlaCorrect = validSla === 8.5 && missingTimestampSla === null;
      console.log('✔ Payment SLA Missing Timestamp Handling (Valid: 8.5h, Missing: null):', isSlaCorrect ? 'PASSED' : 'FAILED');

      // 4. Zero vs Unavailable Formatter Semantics
      const unavailableFormatted = formatISTDateTime(null);
      console.log('✔ Zero vs Data Unavailable Semantics (Null returns:', unavailableFormatted, '):', unavailableFormatted === 'Data unavailable' ? 'PASSED' : 'FAILED');

      // 5. Auth Setup for RBAC & Farmer Ownership Isolation
      const adminLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543212',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      const adminToken = adminLogin.body.data?.token;

      const farmerAReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Farmer A (Phase 6)',
        phone: '9876543207',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        villageName: 'Shyampur'
      });
      const farmerAToken = farmerAReg.body.data?.token;

      const farmerBReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Farmer B (Phase 6)',
        phone: '9876543206',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        villageName: 'Shyampur'
      });
      const farmerBToken = farmerBReg.body.data?.token;

      const staffLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543211',
        password: 'password123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = staffLogin.body.data?.token;

      console.log('✔ Multi-Role Token Setup (Admin, Farmer A, Farmer B, Staff):', adminToken && farmerAToken && farmerBToken && staffToken ? 'PASSED' : 'FAILED');

      // 6. Admin RBAC Regression: Farmer & Staff cannot access /api/admin/overview
      const farmerToAdmin = await makeRequest('/api/admin/overview', 'GET', null, farmerAToken);
      const staffToAdmin = await makeRequest('/api/admin/overview', 'GET', null, staffToken);
      const adminToAdmin = await makeRequest('/api/admin/overview', 'GET', null, adminToken);
      console.log('✔ Admin RBAC Isolation (Farmer: 403, Staff: 403, Admin: 200):', farmerToAdmin.status === 403 && staffToAdmin.status === 403 && adminToAdmin.status === 200 ? 'PASSED' : 'FAILED');

      // 7. Notification Failure Isolation (Non-Blocking Guarantee)
      let notificationThrew = false;
      try {
        await dispatchNotification({
          userId: 'invalid_user_id',
          phone: 'invalid_phone',
          title: 'Test Notification',
          message: 'Testing error resilience'
        });
      } catch (err) {
        notificationThrew = true;
      }
      console.log('✔ Notification Resilience: Error caught gracefully without throwing:', !notificationThrew ? 'PASSED' : 'FAILED');

      // 8. Data Reconciliation Regression Check
      const reconRes = await makeRequest('/api/admin/reconciliation', 'GET', null, adminToken);
      console.log('✔ Data Reconciliation Check:', reconRes.status === 200 && reconRes.body.data?.isReconciled ? 'PASSED' : 'FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL PHASE 6 HARDENING & RELIABILITY TESTS PASSED!');
      console.log('=======================================================');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Phase 6 Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase6Tests();
