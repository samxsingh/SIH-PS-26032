require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const ProcurementCentre = require('../src/models/ProcurementCentre');
const Mandi = require('../src/models/Mandi');
const Slot = require('../src/models/Slot');
const Booking = require('../src/models/Booking');
const QueueEntry = require('../src/models/QueueEntry');
const Procurement = require('../src/models/Procurement');
const PaymentStatus = require('../src/models/PaymentStatus');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');
const { getTodayIST } = require('../src/utils/dateUtils');
const { DEMO_USERS_CANONICAL } = require('../src/config/demoUsers');

const seedData = async () => {
  try {
    console.log('[Seed Script] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db', {
      serverSelectionTimeoutMS: 2000
    });
    console.log('[Seed Script] Connected successfully.');

    // Clear existing collections
    await User.deleteMany({});
    await ProcurementCentre.deleteMany({});
    await Mandi.deleteMany({});
    await Slot.deleteMany({});
    await Booking.deleteMany({});
    await QueueEntry.deleteMany({});
    await Procurement.deleteMany({});
    await PaymentStatus.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed Script] Cleared existing database records.');

    
    // 1. Create Canonical Regulated Mandis in Lucknow
    const mandis = await Mandi.create([
      {
        mandiCode: 'MND_LKO_DUB',
        name: 'Dubagga Naveen Phal Va Krishi Mandi Samiti',
        category: 'PRINCIPAL_MARKET_YARD',
        address: 'Hardoi Road, Dubagga, Lucknow',
        district: 'Lucknow',
        districtCode: 'UP_LUK',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        pincode: '226003',
        location: { type: 'Point', coordinates: [80.8650, 26.8720] },
        operatingAuthority: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        supportedCommodities: ['Wheat', 'Paddy', 'Mustard', 'Gram', 'Maize'],
        operatingHours: { open: '06:00', close: '20:00' },
        isActive: true
      },
      {
        mandiCode: 'MND_LKO_STP',
        name: 'Naveen Galla Mandi Samiti — Sitapur Road',
        category: 'PRINCIPAL_MARKET_YARD',
        address: 'Sitapur Road, Mohibullapur, Lucknow',
        district: 'Lucknow',
        districtCode: 'UP_LUK',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        pincode: '226021',
        location: { type: 'Point', coordinates: [80.9320, 26.9050] },
        operatingAuthority: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        supportedCommodities: ['Wheat', 'Paddy', 'Mustard', 'Barley'],
        operatingHours: { open: '06:00', close: '20:00' },
        isActive: true
      },
      {
        mandiCode: 'MND_LKO_MOH',
        name: 'Mohanlalganj Sub-Market Yard',
        category: 'SUB_MARKET_YARD',
        address: 'Raebareli Highway, Mohanlalganj, Lucknow',
        district: 'Lucknow',
        districtCode: 'UP_LUK',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        pincode: '226301',
        location: { type: 'Point', coordinates: [80.9850, 26.6800] },
        operatingAuthority: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        supportedCommodities: ['Paddy', 'Wheat', 'Mustard'],
        operatingHours: { open: '07:00', close: '19:00' },
        isActive: true
      }
    ]);
    console.log(`[Seed Script] Created ${mandis.length} canonical regulated mandis across Lucknow.`);
    const mandiMap = new Map();
    mandis.forEach(m => mandiMap.set(m.mandiCode, m._id));

    // 2. Create Realistic Procurement Centres across Lucknow, Uttar Pradesh with transparent data provenance
    const centres = await ProcurementCentre.create([
      {
        centreCode: 'LKO_GOM01',
        centreType: 'PROCUREMENT_CENTRE',
        mandiId: mandiMap.get('MND_LKO_STP'),
        name: 'Krishi Seva Procurement Centre — Gomti Nagar',
        address: 'Vibhuti Khand, Gomti Nagar, Lucknow',
        villageName: 'Gomti Nagar',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_06',
        pincode: '226010',
        location: { type: 'Point', coordinates: [80.9980, 26.8530] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2720011',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 1500,
        maxConcurrentFarmers: 50,
        currentLoadPercentage: 35,
        activeQueueCount: 5,
        isActive: true
      },
      {
        centreCode: 'LKO_ALI02',
        centreType: 'PROCUREMENT_CENTRE',
        mandiId: mandiMap.get('MND_LKO_STP'),
        name: 'Kisan Suvidha Procurement Centre — Aliganj',
        address: 'Sector B, Aliganj, Lucknow',
        villageName: 'Aliganj',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_07',
        pincode: '226024',
        location: { type: 'Point', coordinates: [80.9420, 26.8870] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2324010',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 1200,
        maxConcurrentFarmers: 40,
        currentLoadPercentage: 60,
        activeQueueCount: 14,
        isActive: true
      },
      {
        centreCode: 'LKO_IND03',
        centreType: 'PROCUREMENT_CENTRE',
        mandiId: mandiMap.get('MND_LKO_STP'),
        name: 'Lucknow Grain Procurement Centre — Indira Nagar',
        address: 'Ring Road, Sector 14, Indira Nagar, Lucknow',
        villageName: 'Indira Nagar',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_08',
        pincode: '226016',
        location: { type: 'Point', coordinates: [80.9850, 26.8830] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2381200',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 1800,
        maxConcurrentFarmers: 60,
        currentLoadPercentage: 78,
        activeQueueCount: 22,
        isActive: true
      },
      {
        centreCode: 'LKO_JAN04',
        centreType: 'PROCUREMENT_CENTRE',
        mandiId: mandiMap.get('MND_LKO_STP'),
        name: 'Kisan Seva Centre — Jankipuram',
        address: 'Engineering College Road, Jankipuram, Lucknow',
        villageName: 'Jankipuram',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_09',
        pincode: '226021',
        location: { type: 'Point', coordinates: [80.9460, 26.9210] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2735111',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 1000,
        maxConcurrentFarmers: 35,
        currentLoadPercentage: 25,
        activeQueueCount: 4,
        isActive: true
      },
      {
        centreCode: 'LKO_ALA05',
        centreType: 'COLLECTION_POINT',
        mandiId: mandiMap.get('MND_LKO_DUB'),
        name: 'APMC Sub-Mandi Procurement Centre — Alambagh',
        address: 'Kanpur Road, Alambagh, Lucknow',
        villageName: 'Alambagh',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_10',
        pincode: '226005',
        location: { type: 'Point', coordinates: [80.9020, 26.8150] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2450099',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 2200,
        maxConcurrentFarmers: 75,
        currentLoadPercentage: 88,
        activeQueueCount: 32,
        isActive: true
      },
      {
        centreCode: 'LKO_CHI06',
        centreType: 'COLLECTION_POINT',
        mandiId: mandiMap.get('MND_LKO_STP'),
        name: 'Awadh Krishi Kendra — Chinhat',
        address: 'Faizabad Road, Chinhat, Lucknow',
        villageName: 'Chinhat',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_05',
        pincode: '226028',
        location: { type: 'Point', coordinates: [81.0350, 26.8780] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2816700',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 1600,
        maxConcurrentFarmers: 55,
        currentLoadPercentage: 42,
        activeQueueCount: 8,
        isActive: true
      },
      {
        centreCode: 'LKO_MOH07',
        centreType: 'COLLECTION_POINT',
        mandiId: mandiMap.get('MND_LKO_DUB'),
        name: 'Mohan Road Agro Procurement Centre',
        address: 'Mohan Road, Near Outer Ring Road, Lucknow',
        villageName: 'Mohan Road',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_11',
        pincode: '226017',
        location: { type: 'Point', coordinates: [80.8540, 26.8290] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2981010',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 1100,
        maxConcurrentFarmers: 40,
        currentLoadPercentage: 30,
        activeQueueCount: 3,
        isActive: true
      },
      {
        centreCode: 'LKO_BKT08',
        centreType: 'MANDI',
        mandiId: mandiMap.get('MND_LKO_STP'),
        name: 'Bakshi Ka Talab Kisan Mandi',
        address: 'Sitapur Highway, Bakshi Ka Talab, Lucknow',
        villageName: 'Bakshi Ka Talab',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK',
        localityCode: 'UP_LUK_01',
        pincode: '226201',
        location: { type: 'Point', coordinates: [80.9320, 26.9850] },
        verificationStatus: 'VERIFIED',
        dataSource: 'DEMO',
        sourceReference: 'UP State Agricultural Marketing Board (Mandi Parishad)',
        sourceName: 'UPSAMB',
        lastVerifiedAt: new Date('2026-08-15'),
        contactPhone: '+91 522 2977400',
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 2000,
        maxConcurrentFarmers: 70,
        currentLoadPercentage: 65,
        activeQueueCount: 16,
        isActive: true
      }
    ]);

    console.log(`[Seed Script] Created ${centres.length} realistic procurement centres across Lucknow, UP.`);

    // Map centre codes to their database documents
    const centreMap = new Map();
    centres.forEach((c) => centreMap.set(c.centreCode, c));

    // 2. Create Standard Demo Users from Canonical Registry
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('password123', salt);
    const adminPassword = process.env.AGRINEXUS_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'adminpassword';
    const adminPasswordHash = await bcrypt.hash(adminPassword, salt);

    for (const u of DEMO_USERS_CANONICAL) {
      let assignedCentreObjectId = null;
      if (u.centreCode && centreMap.has(u.centreCode)) {
        assignedCentreObjectId = centreMap.get(u.centreCode)._id;
      } else if (u.assignedCentreId === 'c1' || u.role === 'CENTRE_STAFF') {
        assignedCentreObjectId = centres[0]._id;
      }

      const isAdm = u.role === 'ADMIN';
      const createdUser = await User.create({
        fullName: u.fullName,
        phone: u.phone,
        email: isAdm ? (process.env.ADMIN_EMAIL || u.email) : u.email,
        passwordHash: isAdm ? adminPasswordHash : commonPasswordHash,
        role: u.role,
        assignedCentreId: assignedCentreObjectId,
        designation: u.designation,
        isCentreHead: !!u.isCentreHead,
        accountStatus: u.accountStatus || 'ACTIVE',
        district: u.district,
        state: u.state,
        villageName: u.villageName,
        stateCode: u.stateCode,
        districtCode: u.districtCode,
        localityCode: u.localityCode,
        languagePreference: u.languagePreference || 'en'
      });

      // If user is a centre head, link them to the procurement centre
      // Update procurement centre head and staff rosters
      if (assignedCentreObjectId && u.role === 'CENTRE_STAFF') {
        const updateDoc = {
          $addToSet: { staffIds: createdUser._id }
        };
        if (u.isCentreHead) {
          updateDoc.currentHeadId = createdUser._id;
        }
        await ProcurementCentre.findByIdAndUpdate(assignedCentreObjectId, updateDoc);
      }
    }

    console.log('[Seed Script] Created standard demo user accounts in Lucknow (Farmers, Centre Heads & Staff, Admin).');

    // 3. Populate Delivery Slots for Today and Next 7 Days
    const slotsToInsert = [];
    const timeWindows = [
      { start: '08:00', end: '09:00', label: '08:00 AM - 09:00 AM' },
      { start: '09:00', end: '10:00', label: '09:00 AM - 10:00 AM' },
      { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
      { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
      { start: '12:00', end: '13:00', label: '12:00 PM - 01:00 PM' },
      { start: '14:00', end: '15:00', label: '02:00 PM - 03:00 PM' },
      { start: '15:00', end: '16:00', label: '03:00 PM - 04:00 PM' },
      { start: '16:00', end: '17:00', label: '04:00 PM - 05:00 PM' },
    ];

    const today = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      for (const centre of centres) {
        for (let i = 0; i < timeWindows.length; i++) {
          const tw = timeWindows[i];
          const isFullDemo = i === 2 && centre.centreCode === 'AST02';
          const bookedCount = isFullDemo ? 15 : (i % 3) * 2;
          const status = bookedCount >= 15 ? 'FULL' : 'AVAILABLE';

          slotsToInsert.push({
            centreId: centre._id,
            date: dateStr,
            startTime: tw.start,
            endTime: tw.end,
            timeWindow: tw.label,
            maxCapacityQuintals: 200,
            bookedCapacityQuintals: bookedCount * 10,
            maxFarmersAllowed: 15,
            bookedFarmersCount: bookedCount,
            status
          });
        }
      }
    }

    const createdSlots = await Slot.create(slotsToInsert);
    console.log(`[Seed Script] Created ${createdSlots.length} hourly delivery slots.`);

    console.log('=======================================================');
    console.log('   Demo Credentials:');
    console.log('   • Farmer:       Phone: 9876543210 | Password: password123 (Ramesh Patel, Lucknow)');
    console.log('   • Centre Head:  Email: gomtinagar.centre@agrinexus.demo | Password: password123 (Gomti Nagar)');
    console.log('   • Admin:        Email: admin@agrinexus.gov.in | Password: adminpassword');
    console.log('=======================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed data:', err.message);
    process.exit(1);
  }
};

seedData();
