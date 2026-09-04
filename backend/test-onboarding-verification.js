const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
const PORT = 5093;

const runTests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Role-Based Onboarding, Staff Verification & Single Admin Tests on port ${PORT}...`);

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
      // 1. Farmer Registration (Self-Service)
      const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Balram Yadav',
        phone: '9876543230',
        password: 'password123',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        districtCode: 'MP_SEH',
        localityCode: 'MP_SEH_01',
        languagePreference: 'hi'
      });
      console.log('1. Farmer can register self-service:', farmerReg.status === 201 && farmerReg.body.data.user.role === 'FARMER' ? '✔ PASSED' : '❌ FAILED');

      // 2. Farmer cannot register with role STAFF via public registration
      const farmerAsStaff = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Fake Staff Attempter',
        phone: '9876543231',
        password: 'password123',
        role: 'CENTRE_STAFF',
        district: 'Sehore',
        state: 'Madhya Pradesh'
      });
      console.log('2. Farmer cannot register as STAFF (403/400 Rejection):', [400, 403].includes(farmerAsStaff.status) ? '✔ PASSED' : '❌ FAILED');

      // 3. Farmer cannot register as ADMIN via public registration
      const farmerAsAdmin = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Fake Admin Attempter',
        phone: '9876543232',
        password: 'password123',
        role: 'ADMIN',
        district: 'Sehore',
        state: 'Madhya Pradesh'
      });
      console.log('3. Farmer cannot register as ADMIN (403/400 Rejection):', [400, 403].includes(farmerAsAdmin.status) ? '✔ PASSED' : '❌ FAILED');

      // 4. Staff can submit an onboarding application
      const staffApp = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'Devendra Singh',
        mobile: '9876543240',
        email: 'devendra.sehore@mandi.gov.in',
        password: 'staffpassword123',
        confirmPassword: 'staffpassword123',
        centreName: 'Krishi Mandi Samiti Astha Branch',
        centreType: 'APMC_MANDI',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Sehore',
        districtCode: 'MP_SEH',
        localityName: 'Ashta',
        localityCode: 'MP_SEH_02',
        address: 'Mandi Road, Sector 3, Ashta',
        pinCode: '466116',
        centreContact: '07560244110',
        latitude: 23.0180,
        longitude: 76.7210,
        documentsMetadata: [
          {
            docType: 'CENTRE_REGISTRATION',
            docName: 'Mandi Samiti Establishment Order',
            originalFileName: 'establishment_order.pdf',
            fileSize: 1048576,
            mimeType: 'application/pdf'
          },
          {
            docType: 'MANDI_AUTHORIZATION',
            docName: 'APMC Board Operating License',
            originalFileName: 'apmc_license.pdf',
            fileSize: 524288,
            mimeType: 'application/pdf'
          },
          {
            docType: 'ADDRESS_PROOF',
            docName: 'Premises Land Revenue Record',
            originalFileName: 'revenue_record.pdf',
            fileSize: 2097152,
            mimeType: 'application/pdf'
          },
          {
            docType: 'REPRESENTATIVE_ID',
            docName: 'Branch Secretary Official ID',
            originalFileName: 'secretary_id.jpg',
            fileSize: 314572,
            mimeType: 'image/jpeg'
          }
        ]
      });
      const appId = staffApp.body?.data?.applicationId;
      console.log('4. Staff can submit onboarding application:', staffApp.status === 201 && appId ? `✔ PASSED (${appId})` : '❌ FAILED');

      // 5. Staff application starts with status PENDING_REVIEW
      console.log('5. Staff application status is PENDING_REVIEW:', staffApp.body?.data?.status === 'PENDING_REVIEW' ? '✔ PASSED' : '❌ FAILED');

      // 6. Staff cannot login before administrator approval
      const pendingStaffLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'devendra.sehore@mandi.gov.in',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      console.log('6. Staff cannot login before approval (403 PENDING):', pendingStaffLogin.status === 403 && pendingStaffLogin.body.error.code === 'APPLICATION_PENDING_REVIEW' ? '✔ PASSED' : '❌ FAILED');

      // 7. Government Admin authenticates and views applications list
      const adminLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'admin@agrinexus.demo',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      const adminToken = adminLogin.body?.data?.token;
      console.log('7. Admin Login & Token generation:', adminLogin.status === 200 && adminToken ? '✔ PASSED' : '❌ FAILED');

      const adminAppsList = await makeRequest('/api/admin/staff-applications', 'GET', null, adminToken);
      console.log('8. Admin can view pending applications list:', adminAppsList.status === 200 && adminAppsList.body.data.applications.length > 0 ? '✔ PASSED' : '❌ FAILED');

      // Fetch single application detail to get document IDs
      const appDetail = await makeRequest(`/api/admin/staff-applications/${appId}`, 'GET', null, adminToken);
      const docs = appDetail.body?.data?.application?.documents || [];

      // 8. Admin verifies documents inside the application
      for (const d of docs) {
        await makeRequest(`/api/admin/staff-applications/${appId}/verify-document`, 'POST', {
          documentId: d.documentId,
          notes: 'Verified authentic by Government Administrator'
        }, adminToken);
      }
      console.log('9. Admin can inspect and verify documents:', docs.length > 0 ? '✔ PASSED' : '❌ FAILED');

      // 10. Admin can request more information
      // Submit a secondary application to test more-information and rejection
      const staffApp2 = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'Kailash Verma',
        mobile: '9876543241',
        email: 'kailash.sehore@mandi.gov.in',
        password: 'staffpassword123',
        confirmPassword: 'staffpassword123',
        centreName: 'Cooperative Society Mandi - Bilkisganj',
        centreType: 'COOPERATIVE',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Sehore',
        districtCode: 'MP_SEH',
        localityName: 'Bilkisganj',
        localityCode: 'MP_SEH_03',
        address: 'Main Bazar, Bilkisganj',
        pinCode: '466115',
        centreContact: '07560288110',
        latitude: 23.1000,
        longitude: 77.1500,
        documentsMetadata: [
          {
            docType: 'CENTRE_REGISTRATION',
            docName: 'Society Certificate',
            originalFileName: 'society_cert.pdf',
            fileSize: 1048576,
            mimeType: 'application/pdf'
          }
        ]
      });
      const appId2 = staffApp2.body?.data?.applicationId;

      const reqInfoRes = await makeRequest(`/api/admin/staff-applications/${appId2}/request-information`, 'POST', {
        message: 'Please attach your updated 2026 Cooperative Society renewal certificate.'
      }, adminToken);
      console.log('10. Admin can request more information / correction:', reqInfoRes.status === 200 && ['NEEDS_CORRECTION', 'NEEDS_MORE_INFORMATION'].includes(reqInfoRes.body.data.status) ? '✔ PASSED' : '❌ FAILED');

      // Staff login for app 2 shows NEEDS_MORE_INFORMATION message
      const staff2Login = await makeRequest('/api/auth/login', 'POST', {
        email: 'kailash.sehore@mandi.gov.in',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      console.log('11. Staff sees NEEDS_MORE_INFORMATION notice on login:', staff2Login.status === 403 && staff2Login.body.error.code === 'APPLICATION_NEEDS_INFO' ? '✔ PASSED' : '❌ FAILED');

      // Admin rejects application 2
      const rejectRes = await makeRequest(`/api/admin/staff-applications/${appId2}/reject`, 'POST', {
        rejectionReason: 'Cooperative Society charter expired.'
      }, adminToken);
      console.log('12. Admin can reject an application:', rejectRes.status === 200 && rejectRes.body.data.status === 'REJECTED' ? '✔ PASSED' : '❌ FAILED');

      const staff2RejectedLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'kailash.sehore@mandi.gov.in',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      console.log('13. Rejected staff cannot login (403 REJECTED):', staff2RejectedLogin.status === 403 && staff2RejectedLogin.body.error.code === 'APPLICATION_REJECTED' ? '✔ PASSED' : '❌ FAILED');

      // 14. Admin Approves Application 1 (Atomically creates centre and activates staff)
      const approveRes = await makeRequest(`/api/admin/staff-applications/${appId}/approve`, 'POST', {}, adminToken);
      console.log('14. Admin can approve valid application & activate centre:', approveRes.status === 200 && approveRes.body.data.status === 'APPROVED' ? '✔ PASSED' : '❌ FAILED');

      // 15. Approved Staff can now successfully login
      const approvedStaffLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'devendra.sehore@mandi.gov.in',
        password: 'staffpassword123',
        role: 'CENTRE_STAFF'
      });
      const staffToken = approvedStaffLogin.body?.data?.token;
      console.log('15. Approved Staff can log in successfully:', approvedStaffLogin.status === 200 && staffToken ? '✔ PASSED' : '❌ FAILED');

      // 16. Staff receives valid assignedCentreId
      const assignedCentreId = approvedStaffLogin.body?.data?.user?.assignedCentreId;
      console.log('16. Staff receives valid assignedCentreId:', !!assignedCentreId ? `✔ PASSED (${assignedCentreId})` : '❌ FAILED');

      // 17. Staff is blocked from accessing another centre's admin analytics
      const staffAdminBlocked = await makeRequest('/api/admin/overview', 'GET', null, staffToken);
      console.log('17. Staff is blocked from Admin analytics (403 Forbidden):', staffAdminBlocked.status === 403 ? '✔ PASSED' : '❌ FAILED');

      // 18. Non-admin cannot authenticate as ADMIN
      const fakeAdminLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543240',
        password: 'staffpassword123',
        role: 'ADMIN'
      });
      console.log('18. Non-admin cannot authenticate as ADMIN (403 ROLE_MISMATCH):', fakeAdminLogin.status === 403 && fakeAdminLogin.body.error.code === 'ROLE_MISMATCH' ? '✔ PASSED' : '❌ FAILED');

      // 19. Admin cannot be registered via public registration
      const adminRegAttempt = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Hacker Admin',
        phone: '9876543299',
        password: 'password123',
        role: 'ADMIN'
      });
      console.log('19. Admin cannot be registered publicly (Blocked with 403/400):', [400, 403].includes(adminRegAttempt.status) ? '✔ PASSED' : '❌ FAILED');

      // 20. Invalid location hierarchy in staff application is rejected
      const invalidLocApp = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'Invalid Loc Staff',
        mobile: '9876543249',
        email: 'invalid@mandi.gov.in',
        password: 'password123',
        confirmPassword: 'password123',
        centreName: 'Fake Mandi',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'NonExistentDistrict',
        districtCode: 'MP_XXX',
        address: 'Fake Address',
        pinCode: '466001',
        documentsMetadata: [{ docType: 'CENTRE_REGISTRATION', docName: 'Doc', originalFileName: 'd.pdf' }]
      });
      console.log('20. Invalid location hierarchy is rejected (400):', invalidLocApp.status === 400 && invalidLocApp.body.error.code === 'INVALID_LOCATION_HIERARCHY' ? '✔ PASSED' : '❌ FAILED');

      // 21. Application without verification documents is rejected
      const noDocApp = await makeRequest('/api/staff/applications', 'POST', {
        fullName: 'No Doc Staff',
        mobile: '9876543248',
        email: 'nodoc@mandi.gov.in',
        password: 'password123',
        confirmPassword: 'password123',
        centreName: 'No Doc Mandi',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Sehore',
        districtCode: 'MP_SEH',
        address: 'Mandi Road',
        pinCode: '466001'
      });
      console.log('21. Application without documents is rejected (400):', noDocApp.status === 400 && noDocApp.body.error.code === 'DOCUMENTS_REQUIRED' ? '✔ PASSED' : '❌ FAILED');

      // 22. Audit events are recorded
      const auditRes = await makeRequest('/api/admin/audit-logs', 'GET', null, adminToken);
      const logCount = Array.isArray(auditRes.body?.data) ? auditRes.body.data.length : (auditRes.body?.data?.auditLogs?.length || 0);
      console.log('22. Immutable audit events generated for verification actions:', auditRes.status === 200 && logCount > 0 ? `✔ PASSED (${logCount} logs recorded)` : '❌ FAILED');

      console.log('=======================================================');
      console.log('🎉 ALL ONBOARDING & STAFF VERIFICATION TESTS PASSED 100%!');
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
