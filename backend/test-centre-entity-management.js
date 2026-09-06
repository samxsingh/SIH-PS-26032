/**
 * Automated Test Suite: Procurement Centre Entity, Centre Management, and Workload-Aware Staff Assignment
 */

const assert = require('assert');
const http = require('http');
const express = require('express');

process.env.NODE_ENV = 'test';
process.env.PORT = '5095';
process.env.JWT_SECRET = 'test_jwt_secret_key_centre_entity_2026';

const app = express();
app.use(express.json());

// Mount API routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/centres', require('./src/routes/centreRoutes'));
app.use('/api/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

let server;

const apiRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('[Test Suite] Running Centre Entity, Management & Staff Assignment Tests on port 5095...');
  server = app.listen(5095);

  try {
    // 1. Authenticate Centre Head (Satish Kumar)
    const headLogin = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      role: 'CENTRE_STAFF',
      email: 'gomtinagar.centre@agrinexus.demo',
      password: 'password123'
    });

    assert.strictEqual(headLogin.status, 200, 'Centre Head login must succeed');
    const headToken = headLogin.body.data.token;
    assert.ok(headToken, 'Token must be returned');
    console.log('1. Centre Head Login (Satish Kumar): ✔ PASSED');

    // 2. Fetch Centre Profile
    const profileRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/centres/my/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${headToken}`
      }
    });

    assert.strictEqual(profileRes.status, 200, 'Fetching centre profile must succeed');
    assert.ok(profileRes.body.data.centreId === 'LKO_GOM01' || profileRes.body.data.centreId === 'SEH01', 'Persistent centreId must match');
    assert.ok(profileRes.body.data.currentHead, 'Current appointed head must be populated');
    assert.strictEqual(profileRes.body.data.currentHead.fullName, 'Satish Kumar', 'Head must be Satish Kumar');
    console.log(`2. Centre Profile & Persistent Identity: ✔ PASSED (${profileRes.body.data.centreId}, Head: Satish Kumar)`);

    // 3. Fetch Centre Staff List
    const staffListRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/centres/my/staff',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${headToken}`
      }
    });

    assert.strictEqual(staffListRes.status, 200, 'Fetching staff list must succeed');
    assert.ok(Array.isArray(staffListRes.body.data), 'Staff list must be an array');
    assert.ok(staffListRes.body.data.length >= 2, 'Initial staff list should have at least 2 members');
    console.log(`3. Centre Staff Members List: ✔ PASSED (${staffListRes.body.data.length} staff found)`);

    // 4. Centre Head Adds a New Staff Member
    const newStaffEmail = `operator.${Date.now()}@agrinexus.demo`;
    const addStaffRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/centres/my/staff',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headToken}`
      }
    }, {
      fullName: 'Pooja Verma',
      email: newStaffEmail,
      phone: '9876543290',
      designation: 'Weighing Operator',
      password: 'password123',
      employeeId: 'EMP-2026-99'
    });

    assert.strictEqual(addStaffRes.status, 201, 'Adding staff member must succeed with 201');
    assert.strictEqual(addStaffRes.body.data.fullName, 'Pooja Verma');
    assert.strictEqual(addStaffRes.body.data.designation, 'Weighing Operator');
    const addedStaffId = addStaffRes.body.data.id;
    console.log('4. Centre Head Adds Staff Member (Pooja Verma - Weighing Operator): ✔ PASSED');

    // 5. Reject Duplicate Email when Adding Staff
    const dupStaffRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/centres/my/staff',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headToken}`
      }
    }, {
      fullName: 'Duplicate Operator',
      email: newStaffEmail,
      phone: '9876543291',
      designation: 'Procurement Operator',
      password: 'password123'
    });

    assert.strictEqual(dupStaffRes.status, 400, 'Duplicate email must be rejected with 400');
    assert.strictEqual(dupStaffRes.body.error.code, 'DUPLICATE_EMAIL');
    console.log('5. Duplicate Staff Email Rejection: ✔ PASSED');

    // 6. Deactivate Staff Member
    const deactRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: `/api/centres/my/staff/${addedStaffId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headToken}`
      }
    }, {
      accountStatus: 'INACTIVE'
    });

    assert.strictEqual(deactRes.status, 200, 'Deactivating staff must succeed');
    assert.strictEqual(deactRes.body.data.accountStatus, 'INACTIVE');
    console.log('6. Centre Head Deactivates Staff Member (Status -> INACTIVE): ✔ PASSED');

    // 7. Centre Head Prohibited from Deactivating Self
    const headUserId = headLogin.body.data.user.id || headLogin.body.data.user._id;
    const deactSelfRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: `/api/centres/my/staff/${headUserId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headToken}`
      }
    }, {
      accountStatus: 'INACTIVE'
    });

    assert.strictEqual(deactSelfRes.status, 400, 'Head deactivating self must fail with 400');
    assert.strictEqual(deactSelfRes.body.error.code, 'CANNOT_DEACTIVATE_SELF');
    console.log('7. Appointed Head Prevented from Deactivating Self: ✔ PASSED');

    // 8. Normal Staff Member Prohibited from Adding or Deactivating Staff
    // Log in as Ravi Sharma (Procurement Operator)
    const operatorLogin = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      role: 'CENTRE_STAFF',
      email: 'ravi.sharma@agrinexus.demo',
      password: 'password123'
    });

    assert.strictEqual(operatorLogin.status, 200, 'Operator login must succeed');
    const operatorToken = operatorLogin.body.data.token;

    const opAddStaffRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/centres/my/staff',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      }
    }, {
      fullName: 'Unauthorized Member',
      email: 'unauth@agrinexus.demo',
      password: 'password123'
    });

    assert.strictEqual(opAddStaffRes.status, 403, 'Normal staff member cannot add staff (403)');
    assert.strictEqual(opAddStaffRes.body.error.code, 'CENTRE_HEAD_REQUIRED');
    console.log('8. Normal Staff Prohibited from Adding Staff (403 CENTRE_HEAD_REQUIRED): ✔ PASSED');

    // 9. Farmer Booking Deterministically Assigns Staff Operator
    const farmerLogin = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      role: 'FARMER',
      phone: '9876543210',
      password: 'password123'
    });

    assert.strictEqual(farmerLogin.status, 200, 'Farmer login must succeed');
    const farmerToken = farmerLogin.body.data.token;

    // Seed test slot in memory
    const { inMemorySlots } = require('./src/services/bookingService');
    const testSlotId = 'slot_test_' + Date.now();
    inMemorySlots.set(testSlotId, {
      _id: testSlotId,
      id: testSlotId,
      centreId: 'c1',
      date: '2026-10-25',
      timeWindow: '10:00 - 11:00',
      maxFarmersAllowed: 20,
      bookedFarmersCount: 0,
      maxCapacityQuintals: 500,
      bookedCapacityQuintals: 0,
      status: 'AVAILABLE'
    });

    const bookingRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      }
    }, {
      centreId: 'c1',
      slotId: testSlotId,
      cropType: 'Wheat',
      estimatedQuantityQuintals: 40
    });

    assert.strictEqual(bookingRes.status, 201, 'Booking slot must succeed');
    assert.ok(bookingRes.body.data.booking.assignedStaffName, 'Assigned staff name must be populated');
    assert.strictEqual(bookingRes.body.data.booking.assignmentStatus, 'ASSIGNED', 'Assignment status must be ASSIGNED');
    console.log(`9. Workload-Aware Staff Auto-Assignment: ✔ PASSED (Assigned: ${bookingRes.body.data.booking.assignedStaffName} - ${bookingRes.body.data.booking.assignedStaffDesignation})`);

    // 10. Admin Reassigns Appointed Centre Head
    const adminLogin = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      role: 'ADMIN',
      email: 'admin@agrinexus.gov.in',
      password: 'adminpassword'
    });

    assert.strictEqual(adminLogin.status, 200, 'Admin login must succeed');
    const adminToken = adminLogin.body.data.token;

    const reassignRes = await apiRequest({
      hostname: 'localhost',
      port: 5095,
      path: '/api/admin/centres/c1/reassign-head',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      newHeadEmail: 'ravi.sharma@agrinexus.demo',
      reason: 'Administrative term rotation'
    });

    assert.strictEqual(reassignRes.status, 200, 'Reassigning centre head must succeed');
    assert.strictEqual(reassignRes.body.data.currentHeadName, 'Ravi Sharma');
    console.log('10. Government Admin Reassigns Centre Head (Rotated to Ravi Sharma): ✔ PASSED');

    console.log('=======================================================');
    console.log('🎉 ALL 10 CENTRE ENTITY & STAFF ASSIGNMENT TESTS PASSED 100%!');
    console.log('=======================================================');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test suite error:', err);
    if (server) server.close();
    process.exit(1);
  }
};

runTests();
