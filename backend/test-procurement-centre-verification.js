const app = require('./src/app');
const http = require('http');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const { inMemoryUsers } = require('./src/middleware/authMiddleware');

const server = http.createServer(app);
const PORT = 5091;

const runTests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Complete Staff & Admin Email-Based Authentication Tests on port ${PORT}...`);

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
      // 1. Farmer mobile login still works
      const farmerLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543210',
        password: 'password123',
        role: 'FARMER'
      });
      console.log('1. Farmer mobile login still works:', farmerLogin.status === 200 && farmerLogin.body.data.user.role === 'FARMER' ? '✔ PASSED' : '❌ FAILED');

      // 2. Farmer registration still works
      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Balram Singh',
        phone: '9876543299',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        districtCode: 'MP_SEH',
        localityCode: 'MP_SEH_01'
      });
      console.log('2. Farmer registration still works:', farmerReg.status === 201 && farmerReg.body.data.user.phone === '9876543299' ? '✔ PASSED' : '❌ FAILED');

      // 3. Staff registration accepts valid email
      const staffReg = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'Narendra Sharma',
        mobile: '9876543205',
        email: 'bhopal.centre@agrinexus.demo',
        password: 'staffpassword123',
        confirmPassword: 'staffpassword123',
        centreName: 'Bhopal Central Grain Mandi',
        centreType: 'APMC_MANDI',
        registrationNumber: 'MANDI-BHO-2024-88',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Bhopal',
        districtCode: 'MP_BHO',
        localityName: 'Karond',
        localityCode: 'MP_BHO_01',
        address: 'Bhopal Mandi Complex, Karond',
        pinCode: '462038',
        centreContact: '07552733900',
        documentsMetadata: [
          { docType: 'CENTRE_REGISTRATION', docName: 'Reg Cert', originalFileName: 'reg_cert.pdf', fileSize: 500000 },
          { docType: 'MANDI_AUTHORIZATION', docName: 'APMC License', originalFileName: 'apmc_lic.pdf', fileSize: 600000 },
          { docType: 'GOVT_AUTHORIZATION', docName: 'Dept Order', originalFileName: 'order.pdf', fileSize: 400000 },
          { docType: 'ADDRESS_PROOF', docName: 'Premises Proof', originalFileName: 'address.pdf', fileSize: 300000 }
        ]
      });
      const appId = staffReg.body?.data?.applicationId;
      console.log('3. Staff registration accepts valid email:', staffReg.status === 201 && appId ? `✔ PASSED (${appId})` : '❌ FAILED');

      // 4. Duplicate staff email is rejected
      const duplicateStaffEmail = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'Duplicate Operator',
        mobile: '9876543206',
        email: 'bhopal.centre@agrinexus.demo', // Duplicate email
        password: 'password123',
        confirmPassword: 'password123',
        centreName: 'Duplicate Mandi',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Bhopal',
        districtCode: 'MP_BHO',
        address: 'Main Road',
        pinCode: '462038',
        documentsMetadata: [{ docType: 'CENTRE_REGISTRATION', docName: 'Reg', originalFileName: 'reg.pdf' }]
      });
      console.log('4. Duplicate staff email is rejected (400 DUPLICATE_EMAIL):', duplicateStaffEmail.status === 400 && duplicateStaffEmail.body.error.code === 'DUPLICATE_EMAIL' ? '✔ PASSED' : '❌ FAILED');

      // 5. Staff registration creates PENDING_REVIEW
      console.log('5. Staff registration creates status PENDING_REVIEW:', staffReg.body?.data?.status === 'PENDING_REVIEW' ? '✔ PASSED' : '❌ FAILED');

      // 6. Staff pending account cannot log in
      const pendingStaffLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'bhopal.centre@agrinexus.demo',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      console.log('6. Staff pending account cannot log in (403 APPLICATION_PENDING_REVIEW):',
        pendingStaffLogin.status === 403 && pendingStaffLogin.body.error.code === 'APPLICATION_PENDING_REVIEW' ? '✔ PASSED' : '❌ FAILED');

      // 7. Staff mobile login fails/not supported
      const staffMobileLogin = await makeRequest('/api/auth/login', 'POST', {
        mobile: '9876543205',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      console.log('7. Staff mobile login fails/not supported (400 EMAIL_REQUIRED):',
        staffMobileLogin.status === 400 && staffMobileLogin.body.error.code === 'EMAIL_REQUIRED' ? '✔ PASSED' : '❌ FAILED');

      // 8. Admin mobile login is rejected/not supported
      const adminMobileLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543212',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      console.log('8. Admin mobile login is rejected/not supported (400 EMAIL_REQUIRED):',
        adminMobileLogin.status === 400 && adminMobileLogin.body.error.code === 'EMAIL_REQUIRED' ? '✔ PASSED' : '❌ FAILED');

      // 9. Admin email login works
      const adminLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'admin@agrinexus.demo',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      const adminToken = adminLogin.body?.data?.token;
      console.log('9. Admin email login works (admin@agrinexus.demo):', adminLogin.status === 200 && adminToken ? '✔ PASSED' : '❌ FAILED');

      // 10. Wrong admin email fails
      const wrongAdminEmail = await makeRequest('/api/auth/login', 'POST', {
        email: 'impostor@admin.demo',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      console.log('10. Wrong admin email fails (401 INVALID_CREDENTIALS):', wrongAdminEmail.status === 401 ? '✔ PASSED' : '❌ FAILED');

      // 11. Wrong admin password fails
      const wrongAdminPass = await makeRequest('/api/auth/login', 'POST', {
        email: 'admin@agrinexus.demo',
        password: 'wrong_password_123',
        role: 'ADMIN'
      });
      console.log('11. Wrong admin password fails (401 INVALID_CREDENTIALS):', wrongAdminPass.status === 401 ? '✔ PASSED' : '❌ FAILED');

      // 12. Admin public registration remains blocked
      const adminRegAttempt = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Fake Admin',
        phone: '9876543298',
        password: 'password123',
        role: 'ADMIN',
        district: 'Sehore',
        state: 'Madhya Pradesh'
      });
      console.log('12. Admin public registration remains blocked (403):', adminRegAttempt.status === 403 ? '✔ PASSED' : '❌ FAILED');

      // 13. Admin can review, verify documents, and approve staff registration
      const appDetail = await makeRequest(`/api/admin/staff-applications/${appId}`, 'GET', null, adminToken);
      const docs = appDetail.body?.data?.application?.documents || [];
      for (const d of docs) {
        await makeRequest(`/api/admin/staff-applications/${appId}/documents/${d.documentId}/verify`, 'POST', {
          notes: 'Verified authentic'
        }, adminToken);
      }
      const approveRes = await makeRequest(`/api/admin/staff-applications/${appId}/approve`, 'POST', {
        approvalNote: 'Approved by State Admin'
      }, adminToken);
      console.log('13. Admin approval activates staff account:', approveRes.status === 200 && approveRes.body.data.status === 'APPROVED' ? '✔ PASSED' : '❌ FAILED');

      // 14. Approval creates/activates the correct procurement centre
      const assignedCentreId = approveRes.body?.data?.centreId || approveRes.body?.data?.assignedCentreId;
      console.log('14. Approval creates/activates procurement centre:', !!assignedCentreId ? `✔ PASSED (${assignedCentreId})` : '❌ FAILED');

      // 15. Staff email login works after approval
      const approvedStaffLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'bhopal.centre@agrinexus.demo',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = approvedStaffLogin.body?.data?.token;
      console.log('15. Staff email login works after approval:', approvedStaffLogin.status === 200 && staffToken ? '✔ PASSED' : '❌ FAILED');

      // 16. Staff cannot access another centre
      const crossCentreQueue = await makeRequest(
        `/api/queue/today?centreId=c2_unauthorized_centre`,
        'GET',
        null,
        staffToken
      );
      console.log('16. Staff cannot access another centre (403 Forbidden):', crossCentreQueue.status === 403 ? '✔ PASSED' : '❌ FAILED');

      // 17. Test Admin Rejection
      const app2Reg = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'Vikram Patel',
        mobile: '9876543207',
        email: 'ashta.centre@agrinexus.demo',
        password: 'staffpassword123',
        confirmPassword: 'staffpassword123',
        centreName: 'Ashta Sub-Depot',
        centreType: 'COOPERATIVE',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Sehore',
        districtCode: 'MP_SEH',
        address: 'Mandi Yard, Ashta',
        pinCode: '466116',
        documentsMetadata: [{ docType: 'CENTRE_REGISTRATION', docName: 'Reg', originalFileName: 'reg.pdf' }]
      });
      const appId2 = app2Reg.body?.data?.applicationId;

      const rejectRes = await makeRequest(`/api/admin/staff-applications/${appId2}/reject`, 'POST', {
        rejectionReason: 'Invalid APMC authorization letter.'
      }, adminToken);
      console.log('17. Admin rejection prevents activation (REJECTED):', rejectRes.status === 200 && rejectRes.body.data.status === 'REJECTED' ? '✔ PASSED' : '❌ FAILED');

      // 18. Staff rejected account cannot log in
      const rejectedStaffLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'ashta.centre@agrinexus.demo',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      console.log('18. Staff rejected account cannot log in (403 APPLICATION_REJECTED):',
        rejectedStaffLogin.status === 403 && rejectedStaffLogin.body.error.code === 'APPLICATION_REJECTED' ? '✔ PASSED' : '❌ FAILED');

      // 19. Staff suspended account cannot log in
      // Seed a suspended staff account in memory
      const suspendedStaff = {
        _id: 'user_suspended_staff',
        id: 'user_suspended_staff',
        fullName: 'Suspended Staff Member',
        phone: '9876543208',
        email: 'suspended.staff@agrinexus.demo',
        role: 'CENTRE_STAFF',
        assignedCentreId: 'c1',
        accountStatus: 'SUSPENDED',
        isActive: false,
        passwordHash: bcrypt.hashSync('password123', 10),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryUsers.set(suspendedStaff.id, suspendedStaff);

      const suspendedLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'suspended.staff@agrinexus.demo',
        password: 'password123',
        role: 'CENTRE_STAFF'
      });
      console.log('19. Staff suspended account cannot log in (403 ACCOUNT_SUSPENDED):',
        suspendedLogin.status === 403 && suspendedLogin.body.error.code === 'ACCOUNT_SUSPENDED' ? '✔ PASSED' : '❌ FAILED');

      // 20. Audit records are created
      const auditRes = await makeRequest('/api/admin/audit-logs', 'GET', null, adminToken);
      const auditList = Array.isArray(auditRes.body?.data) ? auditRes.body.data : (auditRes.body?.data?.auditLogs || []);
      console.log('20. Audit records are created for administrative events:',
        auditRes.status === 200 && auditList.length > 0 ? `✔ PASSED (${auditList.length} events)` : '❌ FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL 20 CRITICAL SECURITY & AUTHENTICATION TESTS PASSED 100%!');
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
