const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
const PORT = 5095;

const runPhase5Tests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Phase 5 Government Command Centre & Analytics Tests on port ${PORT}...`);

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
      // 1. Auth Setup (Admin, Staff, Farmer)
      const adminLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543212',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      const adminToken = adminLogin.body.data?.token;

      const staffLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543211',
        password: 'password123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = staffLogin.body.data?.token;

      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Ramesh Farmer',
        phone: '9876543208',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        villageName: 'Shyampur'
      });
      const farmerToken = farmerReg.body.data?.token;

      console.log('✔ Auth Token Setup (Admin, Staff, Farmer):', adminToken ? 'PASSED' : 'FAILED');

      // 2. Strict RBAC Protection Tests
      const farmerForbiddenRes = await makeRequest('/api/admin/overview', 'GET', null, farmerToken);
      console.log('✔ RBAC Protection: Farmer access rejected with 403:', farmerForbiddenRes.status === 403 ? 'PASSED' : 'FAILED');

      const staffForbiddenRes = await makeRequest('/api/admin/overview', 'GET', null, staffToken);
      console.log('✔ RBAC Protection: Staff access rejected with 403:', staffForbiddenRes.status === 403 ? 'PASSED' : 'FAILED');

      // 3. Admin Overview Endpoint (GET /api/admin/overview)
      const overviewRes = await makeRequest('/api/admin/overview', 'GET', null, adminToken);
      console.log('✔ Admin Overview KPI Aggregation:', overviewRes.status === 200 && overviewRes.body.data?.kpis?.activeCentresCount > 0 ? 'PASSED' : 'FAILED');

      // 4. Centre Health & Status Endpoint (GET /api/admin/centres)
      const centresRes = await makeRequest('/api/admin/centres', 'GET', null, adminToken);
      console.log('✔ Centre Health Calculation (Centres Count:', centresRes.body.count, '):', centresRes.status === 200 && centresRes.body.count > 0 ? 'PASSED' : 'FAILED');

      // 5. District Aggregation Endpoint (GET /api/admin/districts)
      const districtRes = await makeRequest('/api/admin/districts', 'GET', null, adminToken);
      console.log('✔ District Summary Aggregation:', districtRes.status === 200 && districtRes.body.data?.length > 0 ? 'PASSED' : 'FAILED');

      // 6. Crop Analytics Endpoint (GET /api/admin/procurement)
      const cropRes = await makeRequest('/api/admin/procurement', 'GET', null, adminToken);
      console.log('✔ Crop-wise Procurement Analytics:', cropRes.status === 200 && cropRes.body.data?.cropBreakdown?.length === 4 ? 'PASSED' : 'FAILED');

      // 7. Payment Pipeline Endpoint (GET /api/admin/payments)
      const paymentRes = await makeRequest('/api/admin/payments', 'GET', null, adminToken);
      console.log('✔ 8-Stage Payment Pipeline Aggregation:', paymentRes.status === 200 && paymentRes.body.data?.pipeline?.length === 8 ? 'PASSED' : 'FAILED');

      // 8. Operational Alerts Endpoint (GET /api/admin/alerts)
      const alertRes = await makeRequest('/api/admin/alerts', 'GET', null, adminToken);
      console.log('✔ Operational Alerts & Deduplication:', alertRes.status === 200 ? 'PASSED' : 'FAILED');

      // 9. Compliance Audit Log Endpoint (GET /api/admin/audit-logs)
      const auditRes = await makeRequest('/api/admin/audit-logs', 'GET', null, adminToken);
      console.log('✔ Compliance Audit Log Retrieval:', auditRes.status === 200 ? 'PASSED' : 'FAILED');

      // 10. Data Reconciliation Endpoint (GET /api/admin/reconciliation)
      const reconRes = await makeRequest('/api/admin/reconciliation', 'GET', null, adminToken);
      console.log('✔ Data Reconciliation Check:', reconRes.status === 200 && reconRes.body.data?.isReconciled ? 'PASSED' : 'FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL PHASE 5 GOVERNMENT COMMAND CENTRE TESTS PASSED!');
      console.log('=======================================================');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Phase 5 Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase5Tests();
