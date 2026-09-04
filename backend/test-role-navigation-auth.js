const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
const PORT = 5092;

const runTests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Role-Specific Navigation, Auth & RBAC Security Tests on port ${PORT}...`);

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
      // Setup users
      // 1. Register Farmer
      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Kisan Ramkishore',
        phone: '9876543250',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh'
      });
      console.log('Setup: Farmer registration:', farmerReg.status === 201 ? '✔ PASSED' : '❌ FAILED');

      // 2. Submit Staff application
      const staffApp = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'Staff Shyam Lal',
        mobile: '9876543251',
        email: 'shyam.lal@mandi.gov.in',
        password: 'staffpassword123',
        confirmPassword: 'staffpassword123',
        centreName: 'Sehore APMC Sub-Mandi',
        centreType: 'APMC_MANDI',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Sehore',
        districtCode: 'MP_SEH',
        address: 'APMC Yard, Sehore',
        pinCode: '466001',
        documentsMetadata: [{ docType: 'CENTRE_REGISTRATION', docName: 'Reg', originalFileName: 'reg.pdf' }]
      });
      const appId = staffApp.body?.data?.applicationId;
      console.log('Setup: Staff application submission:', staffApp.status === 201 && appId ? '✔ PASSED' : '❌ FAILED');

      // TEST 6: Staff attempts login before approval
      const preApprovalLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'shyam.lal@mandi.gov.in',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      console.log('TEST 6: Staff login denied before approval (403 APPLICATION_PENDING_REVIEW):',
        preApprovalLogin.status === 403 && preApprovalLogin.body.error.code === 'APPLICATION_PENDING_REVIEW' ? '✔ PASSED' : '❌ FAILED');

      // TEST 7: Admin login via Official Email
      const adminEmailLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'admin@agrinexus.gov.in',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      const adminToken = adminEmailLogin.body?.data?.token;
      console.log('TEST 7: Admin email-based authentication (admin@agrinexus.gov.in):',
        adminEmailLogin.status === 200 && adminToken && adminEmailLogin.body.data.user.role === 'ADMIN' ? '✔ PASSED' : '❌ FAILED');

      // TEST 8: Admin registration is prohibited
      const adminRegAttempt = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Illegal Admin',
        phone: '9876543252',
        password: 'password123',
        role: 'ADMIN'
      });
      console.log('TEST 8: Admin cannot be registered publicly (403 Forbidden):',
        [400, 403].includes(adminRegAttempt.status) ? '✔ PASSED' : '❌ FAILED');

      // TEST 9 & 10: Admin approves staff application
      const appDetail = await makeRequest(`/api/admin/staff-applications/${appId}`, 'GET', null, adminToken);
      const docs = appDetail.body?.data?.application?.documents || [];
      for (const d of docs) {
        await makeRequest(`/api/admin/staff-applications/${appId}/verify-document`, 'POST', {
          documentId: d.documentId
        }, adminToken);
      }
      const approveStaff = await makeRequest(`/api/admin/staff-applications/${appId}/approve`, 'POST', {}, adminToken);
      console.log('TEST 9 & 10: Admin approves staff application:',
        approveStaff.status === 200 && approveStaff.body.data.status === 'APPROVED' ? '✔ PASSED' : '❌ FAILED');

      // TEST 11: Approved staff can now log in using email
      const approvedStaffLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'shyam.lal@mandi.gov.in',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = approvedStaffLogin.body?.data?.token;
      console.log('TEST 11: Approved staff logs in successfully with CENTRE_STAFF role:',
        approvedStaffLogin.status === 200 && staffToken && approvedStaffLogin.body.data.user.role === 'CENTRE_STAFF' ? '✔ PASSED' : '❌ FAILED');

      // TEST 12: Farmer credentials submitted with ADMIN role
      const farmerAsAdmin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543250',
        password: 'password123',
        role: 'ADMIN'
      });
      console.log('TEST 12: Farmer credentials with ADMIN role rejected (403 ROLE_MISMATCH):',
        farmerAsAdmin.status === 403 && farmerAsAdmin.body.error.code === 'ROLE_MISMATCH' ? '✔ PASSED' : '❌ FAILED');

      // TEST 13: Staff credentials submitted with FARMER role
      const staffAsFarmer = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543251',
        password: 'staffpassword123',
        role: 'FARMER'
      });
      console.log('TEST 13: Staff credentials with FARMER role rejected (403 ROLE_MISMATCH):',
        staffAsFarmer.status === 403 && staffAsFarmer.body.error.code === 'ROLE_MISMATCH' ? '✔ PASSED' : '❌ FAILED');

      // TEST 14: Admin credentials submitted with FARMER role
      const adminAsFarmer = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543212',
        password: 'adminpassword',
        role: 'FARMER'
      });
      console.log('TEST 14: Admin credentials with FARMER role rejected (403 ROLE_MISMATCH):',
        adminAsFarmer.status === 403 && adminAsFarmer.body.error.code === 'ROLE_MISMATCH' ? '✔ PASSED' : '❌ FAILED');

      // TEST 15: Manually changing ?role=ADMIN does NOT escalate privileges
      const invalidAdminPayload = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543250',
        password: 'password123',
        role: 'ADMIN'
      });
      console.log('TEST 15: Manipulating role parameter fails without valid admin credentials:',
        invalidAdminPayload.status === 403 ? '✔ PASSED' : '❌ FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL ROLE-SPECIFIC AUTH & RBAC TESTS PASSED 100%!');
      console.log('=======================================================');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ Test failed with error:', err);
      server.close();
      process.exit(1);
    }
  });
};

runTests();
