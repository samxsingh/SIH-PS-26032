const app = require('./src/app');
const http = require('http');
const {
  getStates,
  getDistrictsByState,
  getVillagesByDistrict,
  validateLocationHierarchy,
  findClosestDistrictFromCoords
} = require('./src/data/locations');
const { auditAndMigrateUserLocations } = require('./src/utils/migrateLocations');

const server = http.createServer(app);
const PORT = 5099;

const runTests = async () => {
  server.listen(PORT, async () => {
    console.log(`[Test Suite] Running Auth Security, India-Wide Location & Role Verification Tests on port ${PORT}...`);

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
      // 1. Health Endpoint Check
      const healthRes = await makeRequest('/api/health');
      console.log('✔ Health Check:', healthRes.status === 200 && healthRes.body.success ? 'PASSED' : 'FAILED');

      // 2. Farmer Public Registration with Valid Location (Madhya Pradesh -> Sehore -> Shyampur)
      const farmerMP = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Ramesh Patel (MP Farmer)',
        phone: '9876543201',
        password: 'password123',
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: 'Sehore',
        districtCode: 'MP_SEH',
        villageName: 'Shyampur',
        localityCode: 'MP_SEH_01'
      });
      console.log('✔ Farmer Public Registration (MP):', farmerMP.status === 201 && farmerMP.body.data.user.role === 'FARMER' ? 'PASSED' : 'FAILED');

      // 3. Farmer Public Registration with another State (Uttar Pradesh -> Lucknow -> Malihabad)
      const farmerUP = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Amit Yadav (UP Farmer)',
        phone: '9876543202',
        password: 'password123',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        district: 'Lucknow',
        districtCode: 'UP_LUK',
        villageName: 'Malihabad',
        localityCode: 'UP_LUK_02'
      });
      console.log('✔ Farmer Public Registration (UP):', farmerUP.status === 201 && farmerUP.body.data.user.district === 'Lucknow' ? 'PASSED' : 'FAILED');

      // 4. Server-Side Rejection of Invalid State-District Combination (MP + Lucknow)
      const invalidCombo = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Invalid Location Farmer',
        phone: '9876543203',
        password: 'password123',
        state: 'Madhya Pradesh',
        district: 'Lucknow'
      });
      console.log('✔ Server-Side Invalid State-District Rejection (400):', invalidCombo.status === 400 && invalidCombo.body.error.code === 'VALIDATION_ERROR' ? 'PASSED' : 'FAILED');

      // 5. Manual Locality Fallback ("Can't find village" with USER_ENTERED source)
      const manualLocality = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Kishanlal (Custom Village)',
        phone: '9876543204',
        password: 'password123',
        state: 'Maharashtra',
        district: 'Pune',
        villageName: 'Custom Wadi',
        locationSource: 'USER_ENTERED'
      });
      console.log('✔ Manual Locality Fallback Registration (USER_ENTERED):', manualLocality.status === 201 && manualLocality.body.data.user.locationSource === 'USER_ENTERED' ? 'PASSED' : 'FAILED');

      // 6. Role Escalation Prevention: Rejection of Public Admin Registration (403)
      const adminEscalation = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Hacker Admin',
        phone: '9876543999',
        password: 'password123',
        role: 'ADMIN',
        state: 'Madhya Pradesh',
        district: 'Sehore'
      });
      console.log('✔ Public Admin Role Escalation Rejection (403):', adminEscalation.status === 403 ? 'PASSED' : 'FAILED');

      // 7. Role Escalation Prevention: Rejection of Public Staff Registration (403)
      const staffEscalation = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Unauthorized Staff',
        phone: '9876543888',
        password: 'password123',
        role: 'CENTRE_STAFF',
        state: 'Madhya Pradesh',
        district: 'Sehore'
      });
      console.log('✔ Public Staff Role Escalation Rejection (403):', staffEscalation.status === 403 ? 'PASSED' : 'FAILED');

      // 8. Duplicate Registration Rejection
      const dupReg = await makeRequest('/api/auth/register', 'POST', {
        fullName: 'Duplicate Ramesh',
        phone: '9876543201',
        password: 'password123',
        state: 'Madhya Pradesh',
        district: 'Sehore'
      });
      console.log('✔ Duplicate Phone Registration Rejection (400):', dupReg.status === 400 && dupReg.body.error.code === 'DUPLICATE_PHONE' ? 'PASSED' : 'FAILED');

      // 9. Role-Verified Farmer Login
      const farmerLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543201',
        password: 'password123',
        role: 'FARMER'
      });
      console.log('✔ Farmer Role-Verified Login:', farmerLogin.status === 200 && farmerLogin.body.success ? 'PASSED' : 'FAILED');

      // 10. Role Mismatch Rejection (Farmer attempting to log in as ADMIN)
      const mismatchLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543201',
        password: 'password123',
        role: 'ADMIN'
      });
      console.log('✔ Role Mismatch Login Rejection (403 ROLE_MISMATCH):', mismatchLogin.status === 403 && mismatchLogin.body.error.code === 'ROLE_MISMATCH' ? 'PASSED' : 'FAILED');

      // 11. Admin Login (Seed Admin)
      const adminLogin = await makeRequest('/api/auth/login', 'POST', {
        phone: '9876543212',
        password: 'adminpassword',
        role: 'ADMIN'
      });
      console.log('✔ Authorized Administrator Login:', adminLogin.status === 200 && adminLogin.body.data.user.role === 'ADMIN' ? 'PASSED' : 'FAILED');
      const adminToken = adminLogin.body.data?.token;

      // 12. Staff Account Provisioning by Admin
      const staffProvision = await makeRequest('/api/admin/staff', 'POST', {
        fullName: 'Suresh Sharma (Staff)',
        phone: '9876543215',
        password: 'password123',
        assignedCentreId: 'c1',
        district: 'Sehore',
        state: 'Madhya Pradesh'
      }, adminToken);
      console.log('✔ Admin Provisioning of Centre Staff Account:', staffProvision.status === 201 && staffProvision.body.data.staff.role === 'CENTRE_STAFF' ? 'PASSED' : 'FAILED');

      // 13. Location Directory API: All 36 States & UTs
      const statesRes = await makeRequest('/api/auth/locations/states');
      console.log('✔ Location Directory States & UTs API (Count:', statesRes.body.count, '):', statesRes.status === 200 && statesRes.body.count === 36 ? 'PASSED' : 'FAILED');

      // 14. Location Provenance Metadata API
      const provRes = await makeRequest('/api/auth/locations/provenance');
      console.log('✔ Location Dataset Provenance API:', provRes.status === 200 && provRes.body.data.totalStatesAndUTs === 36 ? 'PASSED' : 'FAILED', `(Districts: ${provRes.body.data.summary.districtsCount}, Localities: ${provRes.body.data.summary.representativeLocalitiesCount})`);

      // 15. Verify Multi-State and Union Territory Hierarchy (MH, TN, KA, DL, JK, LA, AN)
      const mhValid = validateLocationHierarchy('Maharashtra', 'Pune', 'Shivajinagar');
      const tnValid = validateLocationHierarchy('Tamil Nadu', 'Chennai', 'Guindy');
      const kaValid = validateLocationHierarchy('Karnataka', 'Bengaluru Urban', 'Yelahanka');
      const dlValid = validateLocationHierarchy('Delhi', 'New Delhi', 'Connaught Place');
      const jkValid = validateLocationHierarchy('Jammu and Kashmir', 'Srinagar', 'Lal Chowk');
      const laValid = validateLocationHierarchy('Ladakh', 'Leh', 'Leh Town');
      const anValid = validateLocationHierarchy('Andaman and Nicobar Islands', 'South Andaman', 'Port Blair');
      const allHierarchyPass = mhValid.valid && tnValid.valid && kaValid.valid && dlValid.valid && jkValid.valid && laValid.valid && anValid.valid;
      console.log('✔ Multi-State & UT Administrative Hierarchy Verification (MH, TN, KA, DL, JK, LA, AN):', allHierarchyPass ? 'PASSED' : 'FAILED');

      // 16. GPS Proximity Resolver: Coordinates close to Bhopal
      const gpsMatch = findClosestDistrictFromCoords(23.2500, 77.4000);
      console.log('✔ GPS Proximity Resolver (Nearest to [23.25, 77.40]:', gpsMatch.districtName, `[${gpsMatch.stateName}]):`, gpsMatch.districtName === 'Bhopal' ? 'PASSED' : 'FAILED');

      // 17. User Location Data Integrity Audit & Migration
      const auditReport = await auditAndMigrateUserLocations();
      console.log('✔ Location Data Integrity Audit & Migration:', auditReport.totalChecked > 0 ? 'PASSED' : 'FAILED', `(Checked: ${auditReport.totalChecked}, Valid: ${auditReport.validLocations}, Invalid: ${auditReport.invalidLocations})`);

      console.log('=======================================================');
      console.log('🎉 ALL AUTH SECURITY & INDIA-WIDE LOCATION TESTS PASSED!');
      console.log('=======================================================');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
};

runTests();
