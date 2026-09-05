const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const QueueEntry = require('../src/models/QueueEntry');
const Procurement = require('../src/models/Procurement');
const PaymentStatus = require('../src/models/PaymentStatus');
const AuditLog = require('../src/models/AuditLog');
const ProcurementCentre = require('../src/models/ProcurementCentre');
const User = require('../src/models/User');
const Slot = require('../src/models/Slot');
const { getTodayIST } = require('../src/utils/dateUtils');
const { MSP_POLICY_RATES } = require('../src/config/policyRates');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

const seedOperationalData = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log('[Operational Seed] Connected to MongoDB');

    const todayStr = getTodayIST();
    const centres = await ProcurementCentre.find().lean();
    const existingFarmers = await User.find({ role: 'FARMER' }).lean();
    const staff = await User.find({ role: 'CENTRE_STAFF' }).lean();

    if (centres.length === 0 || existingFarmers.length === 0) {
      console.warn('[Operational Seed] Missing centres or farmers in DB. Run main seed first.');
      return;
    }

    // Clean prior test/seed queue & booking data to guarantee clean deterministic operational states
    await Booking.deleteMany({});
    await QueueEntry.deleteMany({});
    await Procurement.deleteMany({});
    await PaymentStatus.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[Operational Seed] Cleared old operational records');

    const slots = await Slot.find({ date: todayStr }).lean();
    const getSlotId = (centreId) => {
      const match = slots.find((s) => s.centreId?.toString() === centreId.toString());
      return match ? match._id : (slots[0] ? slots[0]._id : new mongoose.Types.ObjectId());
    };

    // Realistic Lucknow district farmer roster
    const farmerDirectory = [
      { name: 'Ramesh Patel', phone: '9876543210', village: 'Chinhat', tehsil: 'Lucknow' }, // Canonical Demo Farmer
      { name: 'Rahul Sharma', phone: '9876543220', village: 'Aliganj', tehsil: 'Lucknow' },
      { name: 'Priya Verma', phone: '9876543221', village: 'Gomti Nagar', tehsil: 'Lucknow' },
      { name: 'Amit Yadav', phone: '9876543202', village: 'Bakshi Ka Talab', tehsil: 'Bakshi Ka Talab' },
      { name: 'Suresh Kumar', phone: '9876543233', village: 'Malihabad', tehsil: 'Malihabad' },
      { name: 'Mahendra Singh', phone: '9876543244', village: 'Mohanlalganj', tehsil: 'Mohanlalganj' },
      { name: 'Dinesh Chandra', phone: '9876543255', village: 'Sarojini Nagar', tehsil: 'Sarojini Nagar' },
      { name: 'Kavita Devi', phone: '9876543266', village: 'Kakori', tehsil: 'Lucknow' },
      { name: 'Rajendra Prasad', phone: '9876543277', village: 'Jankipuram', tehsil: 'Lucknow' },
      { name: 'Sunil Verma', phone: '9876543288', village: 'Indira Nagar', tehsil: 'Lucknow' },
      { name: 'Anil Kumar', phone: '9876543299', village: 'Alambagh', tehsil: 'Lucknow' },
      { name: 'Virendra Yadav', phone: '9876543201', village: 'Mohan Road', tehsil: 'Lucknow' },
      { name: 'Brijesh Tiwari', phone: '9876543203', village: 'Dubagga', tehsil: 'Lucknow' },
      { name: 'Sanjay Rawat', phone: '9876543204', village: 'Itaunja', tehsil: 'Bakshi Ka Talab' },
      { name: 'Santosh Maurya', phone: '9876543205', village: 'Gosainganj', tehsil: 'Mohanlalganj' },
      { name: 'Harish Chandra', phone: '9876543206', village: 'Nagram', tehsil: 'Mohanlalganj' },
      { name: 'Vijay Bahadur', phone: '9876543207', village: 'Banthra', tehsil: 'Sarojini Nagar' },
      { name: 'Devendra Singh', phone: '9876543208', village: 'Madiyaon', tehsil: 'Lucknow' },
      { name: 'Ram Vilas', phone: '9876543209', village: 'Kathwara', tehsil: 'Bakshi Ka Talab' },
      { name: 'Shyamlal Verma', phone: '9876543211', village: 'Gauri', tehsil: 'Sarojini Nagar' },
      { name: 'Balwant Singh', phone: '9876543212', village: 'Para', tehsil: 'Lucknow' },
      { name: 'Ganesh Tiwari', phone: '9876543213', village: 'Aurangabad', tehsil: 'Lucknow' },
      { name: 'Laxman Prasad', phone: '9876543214', village: 'Bijnor', tehsil: 'Sarojini Nagar' },
      { name: 'Kusum Lata', phone: '9876543215', village: 'Kalli Pashchim', tehsil: 'Sarojini Nagar' }
    ];

    // Ensure all directory farmers exist as real users
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const farmerUserMap = new Map();
    for (const f of farmerDirectory) {
      let u = existingFarmers.find((ef) => ef.phone === f.phone);
      if (!u) {
        u = await User.findOne({ phone: f.phone });
      }
      if (!u) {
        u = await User.create({
          fullName: f.name,
          phone: f.phone,
          email: `${f.name.toLowerCase().replace(/\s+/g, '.')}@agrinexus.demo`,
          passwordHash: defaultPasswordHash,
          role: 'FARMER',
          district: 'Lucknow',
          state: 'Uttar Pradesh',
          villageName: f.village,
          stateCode: 'UP',
          districtCode: 'UP_LUK'
        });
      }
      farmerUserMap.set(f.phone, u);
    }

    // Centre Maps
    const centreMap = new Map();
    centres.forEach((c) => centreMap.set(c.centreCode, c));

    // Heterogeneous Centre Operational Load Profiles
    const centreProfiles = [
      {
        code: 'LKO_GOM01', // Gomti Nagar: High load urban centre (~80%)
        entries: [
          { stage: 'BOOKED', crop: 'Wheat', qty: 35, farmer: 'Devendra Singh', timeOffset: 60 },
          { stage: 'WAITING', crop: 'Wheat', qty: 40, farmer: 'Suresh Kumar', waitMins: 42, isSlaRisk: true, seq: 1 },
          { stage: 'WAITING', crop: 'Paddy', qty: 30, farmer: 'Mahendra Singh', waitMins: 34, isSlaRisk: true, seq: 2 },
          { stage: 'WAITING', crop: 'Wheat', qty: 45, farmer: 'Sunil Verma', waitMins: 24, seq: 3 },
          { stage: 'WAITING', crop: 'Wheat', qty: 50, farmer: 'Ramesh Patel', waitMins: 18, seq: 4 }, // DEMO USER RAMESH PATEL: Seq #4, ~18m wait
          { stage: 'WAITING', crop: 'Mustard', qty: 20, farmer: 'Kavita Devi', waitMins: 12, seq: 5 },
          { stage: 'WAITING', crop: 'Wheat', qty: 38, farmer: 'Dinesh Chandra', waitMins: 6, seq: 6 },
          { stage: 'CALLED', crop: 'Wheat', qty: 45, farmer: 'Amit Yadav', counter: 'Counter 01', seq: 7, calledAgoMins: 3 },
          { stage: 'ARRIVED', crop: 'Paddy', qty: 28, farmer: 'Sanjay Rawat', counter: 'Intake Bay 02', seq: 8, arrivedAgoMins: 8 },
          { stage: 'VERIFICATION', crop: 'Wheat', qty: 40, farmer: 'Brijesh Tiwari', counter: 'Counter 02', seq: 9 },
          { stage: 'QUALITY_CHECK', crop: 'Paddy', qty: 32, farmer: 'Santosh Maurya', counter: 'Quality Bay 01', seq: 10 },
          { stage: 'WEIGHING', crop: 'Wheat', qty: 52, farmer: 'Virendra Yadav', counter: 'Weighbridge 01', seq: 11 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 45, farmer: 'Harish Chandra', seq: 12 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Wheat', qty: 40, farmer: 'Vijay Bahadur', seq: 13 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 45, farmer: 'Ramesh Patel', seq: 14, isPastHistory: true }, // Completed past booking for Ramesh
          { stage: 'PAYMENT_COMPLETED', crop: 'Paddy', qty: 50, farmer: 'Ram Vilas', seq: 15 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 42, farmer: 'Shyamlal Verma', seq: 16 }
        ]
      },
      {
        code: 'LKO_ALI02', // Aliganj: Busy peri-urban (~55%)
        entries: [
          { stage: 'WAITING', crop: 'Wheat', qty: 35, farmer: 'Balwant Singh', waitMins: 28, seq: 1 },
          { stage: 'WAITING', crop: 'Paddy', qty: 25, farmer: 'Ganesh Tiwari', waitMins: 20, seq: 2 },
          { stage: 'WAITING', crop: 'Wheat', qty: 40, farmer: 'Laxman Prasad', waitMins: 14, seq: 3 },
          { stage: 'WAITING', crop: 'Mustard', qty: 18, farmer: 'Kusum Lata', waitMins: 6, seq: 4 },
          { stage: 'CALLED', crop: 'Wheat', qty: 35, farmer: 'Rahul Sharma', counter: 'Counter 01', seq: 5, calledAgoMins: 4 },
          { stage: 'WEIGHING', crop: 'Wheat', qty: 48, farmer: 'Rajendra Prasad', counter: 'Weighbridge 01', seq: 6 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 42, farmer: 'Anil Kumar', seq: 7 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Paddy', qty: 36, farmer: 'Suresh Kumar', seq: 8 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 50, farmer: 'Mahendra Singh', seq: 9 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 46, farmer: 'Dinesh Chandra', seq: 10 }
        ]
      },
      {
        code: 'LKO_IND03', // Indira Nagar: Balanced (~45%)
        entries: [
          { stage: 'WAITING', crop: 'Wheat', qty: 30, farmer: 'Devendra Singh', waitMins: 22, seq: 1 },
          { stage: 'WAITING', crop: 'Paddy', qty: 28, farmer: 'Vijay Bahadur', waitMins: 15, seq: 2 },
          { stage: 'WAITING', crop: 'Wheat', qty: 36, farmer: 'Harish Chandra', waitMins: 7, seq: 3 },
          { stage: 'CALLED', crop: 'Wheat', qty: 32, farmer: 'Sunil Verma', counter: 'Counter 01', seq: 4, calledAgoMins: 2 },
          { stage: 'VERIFICATION', crop: 'Paddy', qty: 26, farmer: 'Santosh Maurya', counter: 'Counter 02', seq: 5 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 44, farmer: 'Brijesh Tiwari', seq: 6 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Wheat', qty: 38, farmer: 'Sanjay Rawat', seq: 7 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 50, farmer: 'Virendra Yadav', seq: 8 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Paddy', qty: 40, farmer: 'Ram Vilas', seq: 9 }
        ]
      },
      {
        code: 'LKO_JAN04', // Jankipuram: Fast Throughput (~30%)
        entries: [
          { stage: 'WAITING', crop: 'Wheat', qty: 30, farmer: 'Shyamlal Verma', waitMins: 12, seq: 1 },
          { stage: 'WAITING', crop: 'Wheat', qty: 25, farmer: 'Balwant Singh', waitMins: 5, seq: 2 },
          { stage: 'CALLED', crop: 'Mustard', qty: 20, farmer: 'Rajendra Prasad', counter: 'Counter 01', seq: 3, calledAgoMins: 3 },
          { stage: 'QUALITY_CHECK', crop: 'Wheat', qty: 35, farmer: 'Ganesh Tiwari', counter: 'Quality Bay 01', seq: 4 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 40, farmer: 'Laxman Prasad', seq: 5 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Paddy', qty: 32, farmer: 'Kusum Lata', seq: 6 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 48, farmer: 'Devendra Singh', seq: 7 }
        ]
      },
      {
        code: 'LKO_ALA05', // Alambagh: High Load Transit Hub (~78%)
        entries: [
          { stage: 'WAITING', crop: 'Wheat', qty: 42, farmer: 'Kavita Devi', waitMins: 38, isSlaRisk: true, seq: 1 },
          { stage: 'WAITING', crop: 'Paddy', qty: 35, farmer: 'Anil Kumar', waitMins: 31, isSlaRisk: true, seq: 2 },
          { stage: 'WAITING', crop: 'Wheat', qty: 38, farmer: 'Dinesh Chandra', waitMins: 22, seq: 3 },
          { stage: 'WAITING', crop: 'Wheat', qty: 45, farmer: 'Suresh Kumar', waitMins: 16, seq: 4 },
          { stage: 'WAITING', crop: 'Mustard', qty: 22, farmer: 'Mahendra Singh', waitMins: 8, seq: 5 },
          { stage: 'CALLED', crop: 'Wheat', qty: 40, farmer: 'Brijesh Tiwari', counter: 'Counter 01', seq: 6, calledAgoMins: 5 },
          { stage: 'ARRIVED', crop: 'Paddy', qty: 30, farmer: 'Harish Chandra', counter: 'Intake Bay 01', seq: 7, arrivedAgoMins: 10 },
          { stage: 'WEIGHING', crop: 'Wheat', qty: 50, farmer: 'Vijay Bahadur', counter: 'Weighbridge 01', seq: 8 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 46, farmer: 'Santosh Maurya', seq: 9 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Wheat', qty: 42, farmer: 'Sanjay Rawat', seq: 10 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 52, farmer: 'Virendra Yadav', seq: 11 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Paddy', qty: 45, farmer: 'Ram Vilas', seq: 12 }
        ]
      },
      {
        code: 'LKO_CHI06', // Chinhat: Normal Eastern Corridor (~40%)
        entries: [
          { stage: 'WAITING', crop: 'Wheat', qty: 32, farmer: 'Ganesh Tiwari', waitMins: 18, seq: 1 },
          { stage: 'WAITING', crop: 'Paddy', qty: 26, farmer: 'Laxman Prasad', waitMins: 12, seq: 2 },
          { stage: 'WAITING', crop: 'Wheat', qty: 34, farmer: 'Kusum Lata', waitMins: 6, seq: 3 },
          { stage: 'CALLED', crop: 'Wheat', qty: 38, farmer: 'Shyamlal Verma', counter: 'Counter 01', seq: 4, calledAgoMins: 2 },
          { stage: 'VERIFICATION', crop: 'Wheat', qty: 36, farmer: 'Balwant Singh', counter: 'Counter 02', seq: 5 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 42, farmer: 'Devendra Singh', seq: 6 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Paddy', qty: 30, farmer: 'Vijay Bahadur', seq: 7 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 46, farmer: 'Harish Chandra', seq: 8 }
        ]
      },
      {
        code: 'LKO_MOH07', // Mohan Road: Low-Load Feeder (~25%)
        entries: [
          { stage: 'WAITING', crop: 'Wheat', qty: 28, farmer: 'Ram Vilas', waitMins: 9, seq: 1 },
          { stage: 'CALLED', crop: 'Wheat', qty: 30, farmer: 'Virendra Yadav', counter: 'Counter 01', seq: 2, calledAgoMins: 1 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Mustard', qty: 22, farmer: 'Sanjay Rawat', seq: 3 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Wheat', qty: 35, farmer: 'Santosh Maurya', seq: 4 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 40, farmer: 'Brijesh Tiwari', seq: 5 }
        ]
      },
      {
        code: 'LKO_BKT08', // Bakshi Ka Talab: High Intake Rural Belt (~70%)
        entries: [
          { stage: 'WAITING', crop: 'Wheat', qty: 48, farmer: 'Suresh Kumar', waitMins: 36, isSlaRisk: true, seq: 1 },
          { stage: 'WAITING', crop: 'Wheat', qty: 42, farmer: 'Mahendra Singh', waitMins: 27, seq: 2 },
          { stage: 'WAITING', crop: 'Paddy', qty: 38, farmer: 'Dinesh Chandra', waitMins: 20, seq: 3 },
          { stage: 'WAITING', crop: 'Wheat', qty: 45, farmer: 'Kavita Devi', waitMins: 14, seq: 4 },
          { stage: 'WAITING', crop: 'Mustard', qty: 24, farmer: 'Rajendra Prasad', waitMins: 6, seq: 5 },
          { stage: 'CALLED', crop: 'Wheat', qty: 44, farmer: 'Sunil Verma', counter: 'Counter 01', seq: 6, calledAgoMins: 4 },
          { stage: 'ARRIVED', crop: 'Wheat', qty: 50, farmer: 'Anil Kumar', counter: 'Intake Bay 01', seq: 7, arrivedAgoMins: 9 },
          { stage: 'QUALITY_CHECK', crop: 'Wheat', qty: 46, farmer: 'Amit Yadav', counter: 'Quality Bay 01', seq: 8 },
          { stage: 'WEIGHING', crop: 'Wheat', qty: 54, farmer: 'Priya Verma', counter: 'Weighbridge 01', seq: 9 },
          { stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 50, farmer: 'Harish Chandra', seq: 10 },
          { stage: 'PAYMENT_PROCESSING', crop: 'Wheat', qty: 48, farmer: 'Vijay Bahadur', seq: 11 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 56, farmer: 'Devendra Singh', seq: 12 },
          { stage: 'PAYMENT_COMPLETED', crop: 'Paddy', qty: 42, farmer: 'Ram Vilas', seq: 13 }
        ]
      }
    ];

    let globalTokenCounter = 100;

    for (const cp of centreProfiles) {
      const centre = centreMap.get(cp.code) || centres[0];
      const slotId = getSlotId(centre._id);

      for (const item of cp.entries) {
        globalTokenCounter++;
        const tokenNumber = `${cp.code.split('_')[1] || 'LKO'}-${globalTokenCounter}`;
        const bookingRef = `AGR-${cp.code}-${todayStr.replace(/-/g, '')}-${globalTokenCounter}`;

        // Find user by farmer name
        const farmerProfile = farmerDirectory.find((f) => f.name === item.farmer) || farmerDirectory[0];
        const farmerUser = farmerUserMap.get(farmerProfile.phone) || existingFarmers[0];

        const isTerminal = ['COMPLETED', 'PAYMENT_COMPLETED'].includes(item.stage);
        const bookingStatus = isTerminal ? 'COMPLETED' : 'CONFIRMED';
        const opStatus = item.stage;

        const now = Date.now();
        const waitMinutes = item.waitMins || 10;
        const createdAt = new Date(now - (waitMinutes + 10) * 60000);

        const booking = await Booking.create({
          bookingReference: bookingRef,
          tokenNumber,
          farmerId: farmerUser._id,
          centreId: centre._id,
          slotId,
          bookingDate: todayStr,
          timeWindow: '09:00 AM - 10:00 AM',
          cropType: item.crop,
          estimatedQuantityQuintals: item.qty,
          bookingStatus,
          operationalStatus: opStatus,
          createdAt
        });

        // Compute stage realistic timestamps
        const calledAt = ['CALLED', 'ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(opStatus)
          ? new Date(now - (item.calledAgoMins ? item.calledAgoMins * 60000 : 3600000))
          : null;
        const arrivedAt = ['ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(opStatus)
          ? new Date(now - (item.arrivedAgoMins ? item.arrivedAgoMins * 60000 : 3000000))
          : null;
        const verificationStartedAt = ['VERIFICATION', 'QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(opStatus)
          ? new Date(now - 2400000)
          : null;
        const weighingStartedAt = ['WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(opStatus)
          ? new Date(now - 1800000)
          : null;
        const completedAt = ['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(opStatus)
          ? new Date(now - 900000)
          : null;

        const queueEntry = await QueueEntry.create({
          bookingId: booking._id,
          farmerId: farmerUser._id,
          centreId: centre._id,
          slotId,
          tokenNumber,
          queueDate: todayStr,
          sequenceNumber: item.seq || 1,
          state: opStatus,
          counterId: item.counter || 'Counter 01',
          calledAt,
          arrivedAt,
          verificationStartedAt,
          weighingStartedAt,
          completedAt,
          createdAt
        });

        const mspRate = MSP_POLICY_RATES[item.crop]?.mspRatePerQuintal || 2275;
        const grossAmount = item.qty * mspRate;
        const netPayable = grossAmount;

        if (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(opStatus)) {
          const receiptSerialNumber = `REC-${centre.centreCode}-${todayStr.replace(/-/g, '')}-${globalTokenCounter}-${Math.floor(Math.random() * 900 + 100)}`;
          const proc = await Procurement.create({
            bookingId: booking._id,
            queueEntryId: queueEntry._id,
            farmerId: farmerUser._id,
            centreId: centre._id,
            tokenNumber,
            cropType: item.crop,
            declaredQuantityQuintals: item.qty,
            verifiedQuantityQuintals: item.qty,
            netWeightQuintals: item.qty,
            moisturePercentage: 11.6,
            qualityGrade: 'Grade A',
            procurementRatePerQuintal: mspRate,
            grossAmount,
            deductions: 0,
            netPayableAmount: netPayable,
            status: 'COMPLETED',
            receiptSerialNumber,
            completedAt: new Date(now - 900000)
          });

          let payStage = 'PROCUREMENT_COMPLETED';
          if (opStatus === 'PAYMENT_PROCESSING') payStage = 'PAYMENT_PROCESSING';
          if (opStatus === 'PAYMENT_COMPLETED') payStage = 'PAID';

          await PaymentStatus.create({
            bookingId: booking._id,
            procurementId: proc._id,
            farmerId: farmerUser._id,
            currentStage: payStage,
            totalAmount: netPayable,
            demoReferenceNumber: `DBT-LKO-2026-${globalTokenCounter}`,
            stageHistory: [
              { stage: 'SLOT_CONFIRMED', updatedAt: new Date(now - 7200000), updatedByRole: 'FARMER' },
              { stage: 'PROCUREMENT_COMPLETED', updatedAt: new Date(now - 3600000), updatedByRole: 'STAFF' },
              { stage: payStage, updatedAt: new Date(), updatedByRole: 'ADMIN' }
            ]
          });
        }
      }
    }

    // Realistic recent audit trail
    const auditLogsToCreate = [
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'GOM-107', counter: 'Counter 01', centreCode: 'LKO_GOM01', minsAgo: 3 },
      { action: 'MARK_ARRIVED', prev: 'CALLED', next: 'ARRIVED', token: 'GOM-108', counter: 'Intake Bay 02', centreCode: 'LKO_GOM01', minsAgo: 8 },
      { action: 'MARK_VERIFICATION', prev: 'ARRIVED', next: 'VERIFICATION', token: 'GOM-109', counter: 'Counter 02', centreCode: 'LKO_GOM01', minsAgo: 14 },
      { action: 'MARK_QUALITY_CHECK', prev: 'VERIFICATION', next: 'QUALITY_CHECK', token: 'GOM-110', counter: 'Quality Bay 01', centreCode: 'LKO_GOM01', minsAgo: 20 },
      { action: 'MARK_WEIGHING', prev: 'QUALITY_CHECK', next: 'WEIGHING', token: 'GOM-111', counter: 'Weighbridge 01', centreCode: 'LKO_GOM01', minsAgo: 26 },
      { action: 'PROCUREMENT_CONFIRMED', prev: 'WEIGHING', next: 'PROCUREMENT_CONFIRMED', token: 'GOM-112', counter: 'Counter 01', centreCode: 'LKO_GOM01', minsAgo: 32 },
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'ALI-205', counter: 'Counter 01', centreCode: 'LKO_ALI02', minsAgo: 4 },
      { action: 'MARK_WEIGHING', prev: 'QUALITY_CHECK', next: 'WEIGHING', token: 'BKT-809', counter: 'Weighbridge 01', centreCode: 'LKO_BKT08', minsAgo: 12 },
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'BKT-806', counter: 'Counter 01', centreCode: 'LKO_BKT08', minsAgo: 5 },
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'ALA-506', counter: 'Counter 01', centreCode: 'LKO_ALA05', minsAgo: 6 }
    ];

    for (const a of auditLogsToCreate) {
      const centre = centreMap.get(a.centreCode) || centres[0];
      const staffUser = staff.find((s) => s.assignedCentreId?.toString() === centre._id?.toString()) || staff[0] || { _id: new mongoose.Types.ObjectId(), role: 'CENTRE_STAFF' };

      await AuditLog.create({
        userId: staffUser._id,
        userRole: 'CENTRE_STAFF',
        centreId: centre._id,
        action: a.action,
        previousState: a.prev,
        newState: a.next,
        details: { tokenNumber: a.token, counterId: a.counter },
        createdAt: new Date(Date.now() - a.minsAgo * 60000)
      });
    }

    console.log(`[Operational Seed] Successfully seeded heterogeneous operational state across all 8 Lucknow centres!`);
  } catch (err) {
    console.error('[Operational Seed Error]', err);
  }
};

if (require.main === module) {
  seedOperationalData().then(() => process.exit(0));
}

module.exports = seedOperationalData;
