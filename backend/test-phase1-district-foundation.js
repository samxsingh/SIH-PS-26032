/**
 * Phase 1 District Foundation & Cross-Portal Consistency Test Suite
 */

const assert = require('assert');

// Import domain entities and configurations
const Mandi = require('./src/models/Mandi');
const ProcurementCentre = require('./src/models/ProcurementCentre');
const User = require('./src/models/User');
const Booking = require('./src/models/Booking');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');
const { CANONICAL_DISTRICTS, getPrimaryDistrict, getDistrictByName } = require('./src/config/districts');
const {
  PROCUREMENT_LIFECYCLE_STATES,
  ORDERED_LIFECYCLE_PIPELINE,
  canTransition,
  normalizeLifecycleState
} = require('./src/constants/procurementLifecycle');

const runTests = async () => {
  console.log('====================================================');
  console.log('   AGRINEXUS PHASE 1: DISTRICT-FIRST FOUNDATION     ');
  console.log('====================================================\n');

  // Test 1: Canonical District Configuration
  console.log('--- 1. DISTRICT DOMAIN LAYER ---');
  const primary = getPrimaryDistrict();
  assert.ok(primary, 'Primary district must be defined');
  assert.strictEqual(primary.districtName, 'Lucknow');
  assert.strictEqual(primary.districtCode, 'UP_LUK');
  assert.strictEqual(primary.isPrimaryOperational, true);
  assert.strictEqual(primary.boundaryZones.length, 11, 'Lucknow must have 11 boundary zones');
  console.log('✓ Primary District is Lucknow (UP_LUK) with 11 zones: PASS');

  const adjacentDistricts = CANONICAL_DISTRICTS.filter(d => !d.isPrimaryOperational);
  assert.strictEqual(adjacentDistricts.length, 4, 'Must have 4 adjacent zones (Unnao, Barabanki, Sitapur, Rae Bareli)');
  console.log('✓ Adjacent operational zones (Unnao, Barabanki, Sitapur, Rae Bareli) registered: PASS');

  // Test 2: Mandi Model & ProcurementCentre Relationship
  console.log('\n--- 2. MANDI & PROCUREMENT CENTRE DOMAIN MODEL ---');
  assert.ok(Mandi.schema.paths.mandiCode, 'Mandi must have mandiCode');
  assert.ok(Mandi.schema.paths.name, 'Mandi must have name');
  assert.ok(Mandi.schema.paths.category, 'Mandi must have category');
  assert.ok(Mandi.schema.paths['location.coordinates'], 'Mandi must have location.coordinates');
  assert.ok(Mandi.schema.indexes().some(idx => idx[0].location === '2dsphere'), 'Mandi must have 2dsphere index');
  console.log('✓ Mandi schema includes mandiCode, category, location: PASS');

  assert.ok(ProcurementCentre.schema.paths.mandiId, 'ProcurementCentre must have mandiId reference');
  assert.ok(ProcurementCentre.schema.paths.centreType, 'ProcurementCentre must have centreType');
  assert.ok(ProcurementCentre.schema.paths.staffIds, 'ProcurementCentre must have staffIds array');
  assert.ok(ProcurementCentre.schema.paths.currentHeadId, 'ProcurementCentre must have currentHeadId');
  console.log('✓ ProcurementCentre schema includes mandiId, centreType, staffIds[], currentHeadId: PASS');

  // Test 3: Canonical Lifecycle State Machine
  console.log('\n--- 3. CANONICAL PROCUREMENT LIFECYCLE ---');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE.length, 10);
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[0], 'BOOKED');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[1], 'WAITING');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[2], 'CALLED');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[3], 'ARRIVED');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[4], 'VERIFICATION');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[5], 'QUALITY_CHECK');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[6], 'WEIGHING');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[7], 'PROCUREMENT_CONFIRMED');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[8], 'PAYMENT_PROCESSING');
  assert.strictEqual(ORDERED_LIFECYCLE_PIPELINE[9], 'PAYMENT_COMPLETED');
  console.log('✓ Complete 10-stage ordered pipeline verified: PASS');

  // Test Transitions
  assert.ok(canTransition('BOOKED', 'WAITING'), 'BOOKED -> WAITING should be valid');
  assert.ok(canTransition('WAITING', 'CALLED'), 'WAITING -> CALLED should be valid');
  assert.ok(canTransition('CALLED', 'ARRIVED'), 'CALLED -> ARRIVED should be valid');
  assert.ok(canTransition('ARRIVED', 'QUALITY_CHECK'), 'ARRIVED -> QUALITY_CHECK should be valid');
  assert.ok(canTransition('QUALITY_CHECK', 'WEIGHING'), 'QUALITY_CHECK -> WEIGHING should be valid');
  assert.ok(canTransition('WEIGHING', 'PROCUREMENT_CONFIRMED'), 'WEIGHING -> PROCUREMENT_CONFIRMED should be valid');
  assert.ok(canTransition('PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING'), 'CONFIRMED -> PROCESSING should be valid');
  assert.ok(canTransition('PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'), 'PROCESSING -> COMPLETED should be valid');

  // Negative transition test
  assert.strictEqual(canTransition('BOOKED', 'PAYMENT_COMPLETED'), false, 'BOOKED -> PAYMENT_COMPLETED must be invalid');
  assert.strictEqual(canTransition('WAITING', 'WEIGHING'), false, 'WAITING -> WEIGHING must be invalid');
  console.log('✓ Valid & Invalid lifecycle state transitions enforced: PASS');

  // Legacy normalization
  assert.strictEqual(normalizeLifecycleState('IN QUEUE'), 'WAITING');
  assert.strictEqual(normalizeLifecycleState('QUALITY CHECK'), 'QUALITY_CHECK');
  assert.strictEqual(normalizeLifecycleState('PROCUREMENT COMPLETE'), 'PROCUREMENT_CONFIRMED');
  assert.strictEqual(normalizeLifecycleState('COMPLETED'), 'PAYMENT_COMPLETED');
  console.log('✓ Legacy operational status normalization backwards-compatible: PASS');

  // Test 4: Schema Alignment for Booking, QueueEntry, Procurement
  console.log('\n--- 4. CROSS-COLLECTION SCHEMA ALIGNMENT ---');
  const bookingOpEnum = Booking.schema.paths.operationalStatus.enumValues;
  assert.ok(bookingOpEnum.includes('BOOKED'));
  assert.ok(bookingOpEnum.includes('WAITING'));
  assert.ok(bookingOpEnum.includes('QUALITY_CHECK'));
  assert.ok(bookingOpEnum.includes('PROCUREMENT_CONFIRMED'));
  assert.ok(bookingOpEnum.includes('PAYMENT_COMPLETED'));
  console.log('✓ Booking operationalStatus supports canonical lifecycle: PASS');

  const queueStateEnum = QueueEntry.schema.paths.state.enumValues;
  assert.ok(queueStateEnum.includes('WAITING'));
  assert.ok(queueStateEnum.includes('CALLED'));
  assert.ok(queueStateEnum.includes('QUALITY_CHECK'));
  assert.ok(queueStateEnum.includes('PROCUREMENT_CONFIRMED'));
  console.log('✓ QueueEntry state supports canonical lifecycle: PASS');

  const procStatusEnum = Procurement.schema.paths.status.enumValues;
  assert.ok(procStatusEnum.includes('VERIFICATION'));
  assert.ok(procStatusEnum.includes('QUALITY_CHECK'));
  assert.ok(procStatusEnum.includes('WEIGHING'));
  assert.ok(procStatusEnum.includes('PROCUREMENT_CONFIRMED'));
  console.log('✓ Procurement status supports canonical lifecycle: PASS');

  console.log('\n====================================================');
  console.log('🎉 ALL PHASE 1 DISTRICT FOUNDATION TESTS PASSED 100%!');
  console.log('====================================================');
};

runTests();
