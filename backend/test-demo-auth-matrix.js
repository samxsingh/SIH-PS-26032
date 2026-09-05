const http = require('http');

const PORT = process.env.PORT || 5001;

function testLogin(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

function testApiAccess(path, token) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode }));
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

async function runDemoAuthMatrix() {
  console.log('========================================');
  console.log('   AGRINEXUS DEMO AUTH MATRIX AUDIT     ');
  console.log('========================================\n');

  let allPassed = true;
  const tokens = {};

  // 1. FARMER DEMO ACCOUNTS
  console.log('--- 1. FARMER DEMO ACCOUNTS ---');
  const farmers = [
    { name: 'Ramesh Patel', phone: '9876543210', password: 'password123' },
    { name: 'Rahul Sharma', phone: '9876543220', password: 'password123' },
    { name: 'Priya Verma', phone: '9876543221', password: 'password123' },
    { name: 'Amit Yadav', phone: '9876543202', password: 'password123' }
  ];

  for (const f of farmers) {
    const res = await testLogin({ phone: f.phone, password: f.password, role: 'FARMER' });
    const ok = res.status === 200 && res.body.success && res.body.data?.token;
    if (ok) {
      tokens[f.name] = res.body.data.token;
      console.log(`✓ ${f.name.padEnd(20)} (${f.phone}) -> PASS [Token: OK, User: ${res.body.data.user.fullName}]`);
    } else {
      allPassed = false;
      console.log(`✗ ${f.name.padEnd(20)} (${f.phone}) -> FAIL [Status: ${res.status}, Error: ${res.body?.error?.message}]`);
    }
  }

  // 2. PROCUREMENT CENTRE DEMO ACCOUNTS
  console.log('\n--- 2. PROCUREMENT CENTRE DEMO ACCOUNTS ---');
  const centres = [
    { name: 'Gomti Nagar Centre', email: 'gomtinagar.centre@agrinexus.demo', password: 'password123' },
    { name: 'Sehore Mandi Centre', email: 'sehore.centre@agrinexus.demo', password: 'password123' },
    { name: 'Aliganj Kisan Centre', email: 'aliganj.centre@agrinexus.demo', password: 'password123' },
    { name: 'Indira Nagar Centre', email: 'indiranagar.centre@agrinexus.demo', password: 'password123' },
    { name: 'Alambagh APMC Centre', email: 'alambagh.centre@agrinexus.demo', password: 'password123' }
  ];

  for (const c of centres) {
    const res = await testLogin({ email: c.email, password: c.password, role: 'CENTRE_STAFF' });
    const ok = res.status === 200 && res.body.success && res.body.data?.token;
    if (ok) {
      tokens[c.name] = res.body.data.token;
      console.log(`✓ ${c.name.padEnd(24)} (${c.email}) -> PASS [Token: OK, Head: ${res.body.data.user.fullName}]`);
    } else {
      allPassed = false;
      console.log(`✗ ${c.name.padEnd(24)} (${c.email}) -> FAIL [Status: ${res.status}, Error: ${res.body?.error?.message}]`);
    }
  }

  // 3. ADMINISTRATOR DEMO ACCOUNT
  console.log('\n--- 3. ADMINISTRATOR DEMO ACCOUNT ---');
  const admin = { name: 'State Administrator', email: 'admin@agrinexus.gov.in', password: 'adminpassword' };
  const adminRes = await testLogin({ email: admin.email, password: admin.password, role: 'ADMIN' });
  const adminOk = adminRes.status === 200 && adminRes.body.success && adminRes.body.data?.token;
  if (adminOk) {
    tokens[admin.name] = adminRes.body.data.token;
    console.log(`✓ ${admin.name.padEnd(20)} (${admin.email}) -> PASS [Token: OK, Role: ADMIN]`);
  } else {
    allPassed = false;
    console.log(`✗ ${admin.name.padEnd(20)} (${admin.email}) -> FAIL [Status: ${adminRes.status}, Error: ${adminRes.body?.error?.message}]`);
  }

  // 4. NEGATIVE AUTHENTICATION CASES
  console.log('\n--- 4. NEGATIVE AUTHENTICATION CASES ---');
  const negCases = [
    { label: 'Incorrect password for Farmer', payload: { phone: '9876543210', password: 'wrongpassword', role: 'FARMER' }, expected: [401] },
    { label: 'Incorrect password for Centre', payload: { email: 'gomtinagar.centre@agrinexus.demo', password: 'wrongpassword', role: 'CENTRE_STAFF' }, expected: [401] },
    { label: 'Incorrect password for Admin', payload: { email: 'admin@agrinexus.gov.in', password: 'wrongpassword', role: 'ADMIN' }, expected: [401] },
    { label: 'Unknown mobile number', payload: { phone: '9999999999', password: 'password123', role: 'FARMER' }, expected: [401] },
    { label: 'Unknown email address', payload: { email: 'unknown@example.com', password: 'password123', role: 'CENTRE_STAFF' }, expected: [401] },
    { label: 'Farmer credentials on Centre portal', payload: { phone: '9876543210', password: 'password123', role: 'CENTRE_STAFF' }, expected: [400, 403] },
    { label: 'Centre credentials on Farmer portal', payload: { email: 'gomtinagar.centre@agrinexus.demo', password: 'password123', role: 'FARMER' }, expected: [403] },
    { label: 'Farmer credentials on Admin portal', payload: { phone: '9876543210', password: 'password123', role: 'ADMIN' }, expected: [400, 403] },
    { label: 'Centre credentials on Admin portal', payload: { email: 'gomtinagar.centre@agrinexus.demo', password: 'password123', role: 'ADMIN' }, expected: [401, 403] }
  ];

  for (const n of negCases) {
    const res = await testLogin(n.payload);
    const pass = n.expected.includes(res.status);
    if (pass) {
      console.log(`✓ ${n.label.padEnd(42)} -> REJECTED [Status: ${res.status}] (Expected ${n.expected.join('/')})`);
    } else {
      allPassed = false;
      console.log(`✗ ${n.label.padEnd(42)} -> FAILED [Got: ${res.status}, Expected: ${n.expected.join('/')}]`);
    }
  }

  // 5. SERVER-SIDE RBAC ENDPOINT PROTECTION
  console.log('\n--- 5. SERVER-SIDE RBAC ENDPOINT PROTECTION ---');
  const farmerToken = tokens['Ramesh Patel'];
  const centreToken = tokens['Gomti Nagar Centre'];
  const adminToken = tokens['State Administrator'];

  // Test farmer token against admin endpoint
  const fAdmin = await testApiAccess('/api/admin/overview', farmerToken);
  const fAdminPass = fAdmin.status === 403;
  console.log(`✓ Farmer token -> /api/admin/overview: ${fAdmin.status === 403 ? 'BLOCKED 403 (PASS)' : 'FAILED ' + fAdmin.status}`);
  if (!fAdminPass) allPassed = false;

  // Test centre token against admin endpoint
  const cAdmin = await testApiAccess('/api/admin/overview', centreToken);
  const cAdminPass = cAdmin.status === 403;
  console.log(`✓ Centre token -> /api/admin/overview: ${cAdmin.status === 403 ? 'BLOCKED 403 (PASS)' : 'FAILED ' + cAdmin.status}`);
  if (!cAdminPass) allPassed = false;

  // Test admin token on admin endpoint
  const aAdmin = await testApiAccess('/api/admin/overview', adminToken);
  const aAdminPass = aAdmin.status === 200 || aAdmin.status === 304;
  console.log(`✓ Admin token  -> /api/admin/overview: ${aAdminPass ? 'ALLOWED 200 (PASS)' : 'FAILED ' + aAdmin.status}`);
  if (!aAdminPass) allPassed = false;

  console.log('\n========================================');
  if (allPassed) {
    console.log('🎉 ALL DEMO ACCOUNTS & RBAC TESTS PASSED 100%');
    console.log('========================================');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('========================================');
    process.exit(1);
  }
}

runDemoAuthMatrix();
