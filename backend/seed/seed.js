require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const ProcurementCentre = require('../src/models/ProcurementCentre');
const Slot = require('../src/models/Slot');
const Booking = require('../src/models/Booking');
const QueueEntry = require('../src/models/QueueEntry');
const Procurement = require('../src/models/Procurement');
const PaymentStatus = require('../src/models/PaymentStatus');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');
const { getTodayIST } = require('../src/utils/dateUtils');

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
    await Slot.deleteMany({});
    await Booking.deleteMany({});
    await QueueEntry.deleteMany({});
    await Procurement.deleteMany({});
    await PaymentStatus.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed Script] Cleared existing database records.');

    // 1. Create Realistic Procurement Centres across Lucknow, Uttar Pradesh with transparent data provenance
    const centres = await ProcurementCentre.create([
      {
        centreCode: 'LKO_GOM01',
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

    // 2. Create Standard Demo Users for Hackathon Presentation in Lucknow
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('password123', salt);
    const adminPasswordHash = await bcrypt.hash('adminpassword', salt);

    const farmer = await User.create({
      fullName: 'Ramesh Patel',
      phone: '9876543210',
      passwordHash: commonPasswordHash,
      role: 'FARMER',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      villageName: 'Chinhat',
      stateCode: 'UP',
      districtCode: 'UP_LUK',
      localityCode: 'UP_LUK_05',
      languagePreference: 'en'
    });

    // Appointed Centre Head for Gomti Nagar Centre
    const appointedHead = await User.create({
      fullName: 'Satish Kumar',
      phone: '9876543211',
      email: 'gomtinagar.centre@agrinexus.demo',
      passwordHash: commonPasswordHash,
      role: 'CENTRE_STAFF',
      designation: 'Centre Manager',
      isCentreHead: true,
      assignedCentreId: centres[0]._id,
      accountStatus: 'ACTIVE',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      stateCode: 'UP',
      districtCode: 'UP_LUK',
      languagePreference: 'en'
    });

    // Link appointed head to Gomti Nagar centre
    centres[0].currentHeadId = appointedHead._id;
    await centres[0].save();

    // Additional operating staff under Gomti Nagar centre
    await User.create([
      {
        fullName: 'Amit Sharma',
        phone: '9876543215',
        email: 'amit.sharma@agrinexus.demo',
        passwordHash: commonPasswordHash,
        role: 'CENTRE_STAFF',
        designation: 'Procurement Officer',
        isCentreHead: false,
        assignedCentreId: centres[0]._id,
        accountStatus: 'ACTIVE',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK'
      },
      {
        fullName: 'Pooja Verma',
        phone: '9876543216',
        email: 'pooja.verma@agrinexus.demo',
        passwordHash: commonPasswordHash,
        role: 'CENTRE_STAFF',
        designation: 'Weighing Operator',
        isCentreHead: false,
        assignedCentreId: centres[0]._id,
        accountStatus: 'ACTIVE',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK'
      },
      {
        fullName: 'Anil Verma',
        phone: '9876543217',
        email: 'anil.verma@agrinexus.demo',
        passwordHash: commonPasswordHash,
        role: 'CENTRE_STAFF',
        designation: 'Quality Inspector',
        isCentreHead: false,
        assignedCentreId: centres[0]._id,
        accountStatus: 'ACTIVE',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        districtCode: 'UP_LUK'
      }
    ]);

    const admin = await User.create({
      fullName: 'District Magistrate / Administrator',
      phone: '9876543212',
      email: 'admin@agrinexus.gov.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      stateCode: 'UP',
      districtCode: 'UP_LUK',
      languagePreference: 'en'
    });

    console.log('[Seed Script] Created standard demo user accounts in Lucknow (Farmer, Centre Head & Staff, Admin).');

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

    const todayStr = getTodayIST();
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
