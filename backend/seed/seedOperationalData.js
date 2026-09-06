const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    const staffAndAdmins = await User.find({ role: { $in: ['CENTRE_STAFF', 'ADMIN'] } }).lean();
    const staffAndAdminIds = new Set(staffAndAdmins.map((u) => u._id.toString()));
    const staffAndAdminPhones = new Set(staffAndAdmins.map((u) => u.phone));

    if (centres.length === 0) {
      console.warn('[Operational Seed] Missing centres in DB. Run main seed first.');
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

    // 60+ Realistic Lucknow District Farmers with real tehsils and villages (Strictly Non-Colliding Phone Numbers)
    const farmerDirectory = [
      // Canonical Demo Farmers from demoUsers.js
      { name: 'Ramesh Patel', phone: '9876543210', village: 'Chinhat', tehsil: 'Lucknow' },
      { name: 'Rahul Sharma', phone: '9876543220', village: 'Malihabad', tehsil: 'Malihabad' },
      { name: 'Priya Verma', phone: '9876543221', village: 'Bakshi Ka Talab', tehsil: 'Bakshi Ka Talab' },
      { name: 'Amit Yadav', phone: '9876543202', village: 'Mohan Road', tehsil: 'Lucknow' },

      // Additional Lucknow Farmers (Distinct dedicated phone range 9876500001 - 9876500060)
      { name: 'Suresh Kumar', phone: '9876500001', village: 'Malihabad', tehsil: 'Malihabad' },
      { name: 'Mahendra Singh', phone: '9876500002', village: 'Mohanlalganj', tehsil: 'Mohanlalganj' },
      { name: 'Dinesh Chandra', phone: '9876500003', village: 'Banthra', tehsil: 'Sarojini Nagar' },
      { name: 'Kavita Devi', phone: '9876500004', village: 'Kakori', tehsil: 'Lucknow' },
      { name: 'Rajendra Prasad', phone: '9876500005', village: 'Jankipuram', tehsil: 'Lucknow' },
      { name: 'Sunil Verma', phone: '9876500006', village: 'Indira Nagar', tehsil: 'Lucknow' },
      { name: 'Anil Kumar', phone: '9876500007', village: 'Alambagh', tehsil: 'Lucknow' },
      { name: 'Virendra Yadav', phone: '9876500008', village: 'Mohan Road', tehsil: 'Lucknow' },
      { name: 'Brijesh Tiwari', phone: '9876500009', village: 'Dubagga', tehsil: 'Lucknow' },
      { name: 'Sanjay Rawat', phone: '9876500010', village: 'Itaunja', tehsil: 'Bakshi Ka Talab' },
      { name: 'Santosh Maurya', phone: '9876500011', village: 'Gosainganj', tehsil: 'Mohanlalganj' },
      { name: 'Harish Chandra', phone: '9876500012', village: 'Nagram', tehsil: 'Mohanlalganj' },
      { name: 'Vijay Bahadur', phone: '9876500013', village: 'Banthra', tehsil: 'Sarojini Nagar' },
      { name: 'Devendra Singh', phone: '9876500014', village: 'Madiyaon', tehsil: 'Lucknow' },
      { name: 'Ram Vilas', phone: '9876500015', village: 'Kathwara', tehsil: 'Bakshi Ka Talab' },
      { name: 'Shyamlal Verma', phone: '9876500016', village: 'Gauri', tehsil: 'Sarojini Nagar' },
      { name: 'Balwant Singh', phone: '9876500017', village: 'Para', tehsil: 'Lucknow' },
      { name: 'Ganesh Tiwari', phone: '9876500018', village: 'Aurangabad', tehsil: 'Lucknow' },
      { name: 'Laxman Prasad', phone: '9876500019', village: 'Bijnor', tehsil: 'Sarojini Nagar' },
      { name: 'Kusum Lata', phone: '9876500020', village: 'Kalli Pashchim', tehsil: 'Sarojini Nagar' },
      { name: 'Manoj Shukla', phone: '9876500021', village: 'Sisendi', tehsil: 'Mohanlalganj' },
      { name: 'Shiv Prasad', phone: '9876500022', village: 'Nigohan', tehsil: 'Mohanlalganj' },
      { name: 'Om Prakash', phone: '9876500023', village: 'Asti', tehsil: 'Bakshi Ka Talab' },
      { name: 'Sunita Devi', phone: '9876500024', village: 'Malhaur', tehsil: 'Lucknow' },
      { name: 'Rajesh Maurya', phone: '9876500025', village: 'Rahimabad', tehsil: 'Malihabad' },
      { name: 'Kamlesh Yadav', phone: '9876500026', village: 'Saspan', tehsil: 'Malihabad' },
      { name: 'Geeta Devi', phone: '9876500027', village: 'Juggaur', tehsil: 'Lucknow' },
      { name: 'Jagdish Prasad', phone: '9876500028', village: 'Natkur', tehsil: 'Sarojini Nagar' },
      { name: 'Ram Kishore', phone: '9876500029', village: 'Digoi', tehsil: 'Bakshi Ka Talab' },
      { name: 'Meena Kumari', phone: '9876500030', village: 'Semra', tehsil: 'Lucknow' },
      { name: 'Mohan Lal', phone: '9876500031', village: 'Piparsand', tehsil: 'Sarojini Nagar' },
      { name: 'Ashok Kumar', phone: '9876500032', village: 'Bakhtiyarnagar', tehsil: 'Malihabad' },
      { name: 'Sarita Devi', phone: '9876500033', village: 'Jabrauli', tehsil: 'Mohanlalganj' },
      { name: 'Rakesh Verma', phone: '9876500034', village: 'Aramba', tehsil: 'Bakshi Ka Talab' },
      { name: 'Dharmendra Singh', phone: '9876500035', village: 'Sarosa Bharosa', tehsil: 'Lucknow' },
      { name: 'Poonam Yadav', phone: '9876500036', village: 'Deva', tehsil: 'Mohanlalganj' },
      { name: 'Chandra Bhan', phone: '9876500037', village: 'Khujauli', tehsil: 'Mohanlalganj' },
      { name: 'Ajay Kumar', phone: '9876500038', village: 'Siswara', tehsil: 'Malihabad' },
      { name: 'Rekha Devi', phone: '9876500039', village: 'Usarna', tehsil: 'Bakshi Ka Talab' },
      { name: 'Vinod Kumar', phone: '9876500040', village: 'Arjunganj', tehsil: 'Lucknow' },
      { name: 'Shanti Devi', phone: '9876500041', village: 'Samesi', tehsil: 'Mohanlalganj' },
      { name: 'Subhash Chandra', phone: '9876500042', village: 'Nabipanah', tehsil: 'Malihabad' },
      { name: 'Anupama Singh', phone: '9876500043', village: 'Indara', tehsil: 'Bakshi Ka Talab' },
      { name: 'Krishna Murari', phone: '9876500044', village: 'Bakkas', tehsil: 'Lucknow' },
      { name: 'Maya Devi', phone: '9876500045', village: 'Jindaur', tehsil: 'Malihabad' },
      { name: 'Ram Chandra', phone: '9876500046', village: 'Ahmamau', tehsil: 'Lucknow' },
      { name: 'Sangeeta Verma', phone: '9876500047', village: 'Datli', tehsil: 'Malihabad' },
      { name: 'Mukesh Kumar', phone: '9876500048', village: 'Bargadi', tehsil: 'Bakshi Ka Talab' },
      { name: 'Prem Lata', phone: '9876500049', village: 'Ashiyana Rural', tehsil: 'Sarojini Nagar' },
      { name: 'Gyanendra Singh', phone: '9876500050', village: 'Kankaha', tehsil: 'Malihabad' },
      { name: 'Ramlal Kashyap', phone: '9876500051', village: 'Mall', tehsil: 'Malihabad' },
      { name: 'Satish Rawat', phone: '9876500052', village: 'Goshainganj Rural', tehsil: 'Mohanlalganj' },
      { name: 'Phoolmati Devi', phone: '9876500053', village: 'Bijnaur', tehsil: 'Sarojini Nagar' },
      { name: 'Tribhuvan Nath', phone: '9876500054', village: 'Mahona', tehsil: 'Bakshi Ka Talab' },
      { name: 'Chotey Lal', phone: '9876500055', village: 'Gosainganj', tehsil: 'Mohanlalganj' }
    ];

    // Guarantee that no farmer directory phone collides with any staff or admin user
    for (const f of farmerDirectory) {
      if (staffAndAdminPhones.has(f.phone)) {
        throw new Error(`CRITICAL INTEGRITY VIOLATION: Farmer ${f.name} shares phone ${f.phone} with staff/admin!`);
      }
    }

    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const farmerUserMap = new Map();

    for (const f of farmerDirectory) {
      let u = await User.findOne({ phone: f.phone });
      if (u) {
        if (u.role !== 'FARMER') {
          throw new Error(`CRITICAL INTEGRITY VIOLATION: User ${u.phone} has role ${u.role}, not FARMER!`);
        }
      } else {
        u = await User.create({
          fullName: f.name,
          phone: f.phone,
          email: `${f.name.toLowerCase().replace(/\s+/g, '.')}.${f.phone.slice(-4)}@agrinexus.demo`,
          passwordHash: defaultPasswordHash,
          role: 'FARMER',
          district: 'Lucknow',
          state: 'Uttar Pradesh',
          villageName: f.village,
          stateCode: 'UP',
          districtCode: 'UP_LUK',
          locationSource: 'REGISTERED',
          isActive: true
        });
      }
      farmerUserMap.set(f.name, u);
    }

    // Centre Map
    const centreMap = new Map();
    centres.forEach((c) => centreMap.set(c.centreCode, c));

    // Heterogeneous Centre Operational Load Profiles (Completely Disjoint Farmers Per Active Queue Entry)
    const centreProfiles = [
      {
        code: 'LKO_GOM01', // Gomti Nagar: Flagship district model centre with all 10 lifecycle stages represented
        prefix: 'GOM01',
        entries: [
          { seq: 1, stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 50, farmer: 'Chotey Lal' },
          { seq: 2, stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 42, farmer: 'Ramlal Kashyap' },
          { seq: 3, stage: 'WEIGHING', crop: 'Wheat', qty: 44, farmer: 'Satish Rawat', counter: 'Weighbridge 01' },
          { seq: 4, stage: 'QUALITY_CHECK', crop: 'Wheat', qty: 38, farmer: 'Anil Kumar', counter: 'Quality Bay 01' },
          { seq: 5, stage: 'VERIFICATION', crop: 'Mustard', qty: 25, farmer: 'Sunil Verma', counter: 'Counter 02' },
          { seq: 6, stage: 'ARRIVED', crop: 'Wheat', qty: 45, farmer: 'Rajendra Prasad', counter: 'Intake Bay 01', arrivedAgoMins: 8 },
          { seq: 7, stage: 'CALLED', crop: 'Paddy', qty: 32, farmer: 'Kavita Devi', counter: 'Counter 01', calledAgoMins: 4 },
          { seq: 8, stage: 'WAITING', crop: 'Wheat', qty: 35, farmer: 'Suresh Kumar', waitMins: 45, isSlaRisk: true },
          { seq: 9, stage: 'BOOKED', crop: 'Wheat', qty: 44, farmer: 'Ramesh Patel', timeOffset: 60 } // Canonical Demo Farmer (GOM01-109)
        ]
      },
      {
        code: 'LKO_ALI02', // Aliganj: Busy peri-urban (~55%)
        prefix: 'ALI02',
        entries: [
          { seq: 1, stage: 'WAITING', crop: 'Wheat', qty: 32, farmer: 'Virendra Yadav', waitMins: 26 },
          { seq: 2, stage: 'WAITING', crop: 'Paddy', qty: 28, farmer: 'Brijesh Tiwari', waitMins: 18 },
          { seq: 3, stage: 'WAITING', crop: 'Wheat', qty: 40, farmer: 'Sanjay Rawat', waitMins: 10 },
          { seq: 4, stage: 'CALLED', crop: 'Wheat', qty: 35, farmer: 'Rahul Sharma', counter: 'Counter 01', calledAgoMins: 3 }, // Canonical Demo Farmer #2
          { seq: 5, stage: 'WEIGHING', crop: 'Wheat', qty: 48, farmer: 'Santosh Maurya', counter: 'Weighbridge 01' },
          { seq: 6, stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 42, farmer: 'Harish Chandra' },
          { seq: 7, stage: 'PAYMENT_PROCESSING', crop: 'Paddy', qty: 36, farmer: 'Vijay Bahadur' }
        ]
      },
      {
        code: 'LKO_IND03', // Indira Nagar: Balanced (~45%)
        prefix: 'IND03',
        entries: [
          { seq: 1, stage: 'WAITING', crop: 'Wheat', qty: 30, farmer: 'Devendra Singh', waitMins: 20 },
          { seq: 2, stage: 'WAITING', crop: 'Paddy', qty: 26, farmer: 'Ram Vilas', waitMins: 12 },
          { seq: 3, stage: 'CALLED', crop: 'Wheat', qty: 34, farmer: 'Shyamlal Verma', counter: 'Counter 01', calledAgoMins: 2 },
          { seq: 4, stage: 'VERIFICATION', crop: 'Paddy', qty: 30, farmer: 'Balwant Singh', counter: 'Counter 02' },
          { seq: 5, stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 45, farmer: 'Ganesh Tiwari' },
          { seq: 6, stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 48, farmer: 'Laxman Prasad' }
        ]
      },
      {
        code: 'LKO_JAN04', // Jankipuram: Fast Throughput (~35%)
        prefix: 'JAN04',
        entries: [
          { seq: 1, stage: 'WAITING', crop: 'Wheat', qty: 28, farmer: 'Kusum Lata', waitMins: 14 },
          { seq: 2, stage: 'WAITING', crop: 'Wheat', qty: 32, farmer: 'Manoj Shukla', waitMins: 6 },
          { seq: 3, stage: 'CALLED', crop: 'Mustard', qty: 22, farmer: 'Shiv Prasad', counter: 'Counter 01', calledAgoMins: 3 },
          { seq: 4, stage: 'QUALITY_CHECK', crop: 'Wheat', qty: 36, farmer: 'Om Prakash', counter: 'Quality Bay 01' },
          { seq: 5, stage: 'WEIGHING', crop: 'Wheat', qty: 40, farmer: 'Sunita Devi', counter: 'Weighbridge 01' },
          { seq: 6, stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 50, farmer: 'Rajesh Maurya' }
        ]
      },
      {
        code: 'LKO_ALA05', // Alambagh: High Load Transit Hub (~78%)
        prefix: 'ALA05',
        entries: [
          { seq: 1, stage: 'WAITING', crop: 'Wheat', qty: 44, farmer: 'Kamlesh Yadav', waitMins: 40, isSlaRisk: true },
          { seq: 2, stage: 'WAITING', crop: 'Paddy', qty: 36, farmer: 'Geeta Devi', waitMins: 32, isSlaRisk: true },
          { seq: 3, stage: 'WAITING', crop: 'Wheat', qty: 38, farmer: 'Jagdish Prasad', waitMins: 22 },
          { seq: 4, stage: 'WAITING', crop: 'Wheat', qty: 42, farmer: 'Ram Kishore', waitMins: 12 },
          { seq: 5, stage: 'CALLED', crop: 'Wheat', qty: 40, farmer: 'Meena Kumari', counter: 'Counter 01', calledAgoMins: 5 },
          { seq: 6, stage: 'ARRIVED', crop: 'Paddy', qty: 32, farmer: 'Mohan Lal', counter: 'Intake Bay 01', arrivedAgoMins: 9 },
          { seq: 7, stage: 'VERIFICATION', crop: 'Wheat', qty: 46, farmer: 'Ashok Kumar', counter: 'Counter 02' },
          { seq: 8, stage: 'PAYMENT_PROCESSING', crop: 'Wheat', qty: 48, farmer: 'Sarita Devi' }
        ]
      },
      {
        code: 'LKO_CHI06', // Chinhat: Eastern Corridor (~40%)
        prefix: 'CHI06',
        entries: [
          { seq: 1, stage: 'WAITING', crop: 'Wheat', qty: 30, farmer: 'Rakesh Verma', waitMins: 16 },
          { seq: 2, stage: 'WAITING', crop: 'Paddy', qty: 25, farmer: 'Dharmendra Singh', waitMins: 8 },
          { seq: 3, stage: 'CALLED', crop: 'Wheat', qty: 36, farmer: 'Poonam Yadav', counter: 'Counter 01', calledAgoMins: 2 },
          { seq: 4, stage: 'VERIFICATION', crop: 'Wheat', qty: 34, farmer: 'Chandra Bhan', counter: 'Counter 02' },
          { seq: 5, stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 42, farmer: 'Ajay Kumar' },
          { seq: 6, stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 46, farmer: 'Rekha Devi' }
        ]
      },
      {
        code: 'LKO_MOH07', // Mohan Road: Feeder Centre (~25%)
        prefix: 'MOH07',
        entries: [
          { seq: 1, stage: 'BOOKED', crop: 'Wheat', qty: 25, farmer: 'Vinod Kumar', timeOffset: 60 },
          { seq: 2, stage: 'WAITING', crop: 'Wheat', qty: 35, farmer: 'Amit Yadav', waitMins: 10 }, // Canonical Demo Farmer #4
          { seq: 3, stage: 'CALLED', crop: 'Mustard', qty: 20, farmer: 'Shanti Devi', counter: 'Counter 01', calledAgoMins: 1 },
          { seq: 4, stage: 'WEIGHING', crop: 'Wheat', qty: 38, farmer: 'Subhash Chandra', counter: 'Weighbridge 01' },
          { seq: 5, stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 40, farmer: 'Anupama Singh' }
        ]
      },
      {
        code: 'LKO_BKT08', // Bakshi Ka Talab: High Intake Rural Belt (~70%)
        prefix: 'BKT08',
        entries: [
          { seq: 1, stage: 'WAITING', crop: 'Wheat', qty: 46, farmer: 'Krishna Murari', waitMins: 38, isSlaRisk: true },
          { seq: 2, stage: 'WAITING', crop: 'Wheat', qty: 42, farmer: 'Maya Devi', waitMins: 28 },
          { seq: 3, stage: 'WAITING', crop: 'Paddy', qty: 36, farmer: 'Ram Chandra', waitMins: 18 },
          { seq: 4, stage: 'CALLED', crop: 'Wheat', qty: 44, farmer: 'Sangeeta Verma', counter: 'Counter 01', calledAgoMins: 4 },
          { seq: 5, stage: 'ARRIVED', crop: 'Wheat', qty: 50, farmer: 'Mukesh Kumar', counter: 'Intake Bay 01', arrivedAgoMins: 10 },
          { seq: 6, stage: 'WEIGHING', crop: 'Wheat', qty: 52, farmer: 'Priya Verma', counter: 'Weighbridge 01' }, // Canonical Demo Farmer #3
          { seq: 7, stage: 'PROCUREMENT_CONFIRMED', crop: 'Wheat', qty: 48, farmer: 'Prem Lata' },
          { seq: 8, stage: 'PAYMENT_COMPLETED', crop: 'Wheat', qty: 54, farmer: 'Gyanendra Singh' }
        ]
      }
    ];

    // Assert disjointness of active farmers across all centres
    const usedActiveFarmers = new Set();
    for (const cp of centreProfiles) {
      for (const item of cp.entries) {
        if (usedActiveFarmers.has(item.farmer)) {
          throw new Error(`DUPLICATE FARMER DETECTED in active queues: ${item.farmer} in centre ${cp.code}!`);
        }
        usedActiveFarmers.add(item.farmer);
      }
    }
    console.log(`[Operational Seed] Verified 0 duplicate farmers across all ${usedActiveFarmers.size} operational entries.`);

    let totalBookingsCreated = 0;
    let totalQueueEntriesCreated = 0;

    for (const cp of centreProfiles) {
      const centre = centreMap.get(cp.code) || centres[0];
      const slotId = getSlotId(centre._id);

      for (const item of cp.entries) {
        const tokenNumber = `${cp.prefix}-${100 + item.seq}`;
        const bookingRef = `AGR-${cp.prefix}-${todayStr.replace(/-/g, '')}-${item.seq.toString().padStart(3, '0')}`;

        const farmerUser = farmerUserMap.get(item.farmer);
        if (!farmerUser || farmerUser.role !== 'FARMER') {
          throw new Error(`CRITICAL: User ${item.farmer} not found or role is not FARMER!`);
        }
        if (staffAndAdminIds.has(farmerUser._id.toString())) {
          throw new Error(`CRITICAL: User ${item.farmer} is staff or admin! Cannot be farmer in booking!`);
        }

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
        totalBookingsCreated++;

        // Calculate stage realistic timestamps
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
          sequenceNumber: item.seq,
          state: opStatus,
          counterId: item.counter || 'Counter 01',
          calledAt,
          arrivedAt,
          verificationStartedAt,
          weighingStartedAt,
          completedAt,
          createdAt
        });
        totalQueueEntriesCreated++;

        const mspRate = MSP_POLICY_RATES[item.crop]?.mspRatePerQuintal || 2275;
        const grossAmount = item.qty * mspRate;
        const netPayable = grossAmount;

        if (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(opStatus)) {
          const receiptSerialNumber = `REC-${centre.centreCode}-${todayStr.replace(/-/g, '')}-${item.seq.toString().padStart(3, '0')}`;
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
            demoReferenceNumber: `DBT-LKO-2026-${cp.prefix}-${item.seq}`,
            stageHistory: [
              { stage: 'SLOT_CONFIRMED', updatedAt: new Date(now - 7200000), updatedByRole: 'FARMER' },
              { stage: 'PROCUREMENT_COMPLETED', updatedAt: new Date(now - 3600000), updatedByRole: 'STAFF' },
              { stage: payStage, updatedAt: new Date(), updatedByRole: 'ADMIN' }
            ]
          });
        }
      }
    }

    // Historical completed booking for Ramesh Patel from 2 weeks ago (No active queue entry today)
    const rameshUser = farmerUserMap.get('Ramesh Patel');
    const gomtiCentre = centreMap.get('LKO_GOM01') || centres[0];
    const pastDateStr = '2026-08-20';

    const pastBooking = await Booking.create({
      bookingReference: 'AGR-GOM01-20260820-042',
      tokenNumber: 'GOM01-042',
      farmerId: rameshUser._id,
      centreId: gomtiCentre._id,
      slotId: getSlotId(gomtiCentre._id),
      bookingDate: pastDateStr,
      timeWindow: '10:00 AM - 11:00 AM',
      cropType: 'Wheat',
      estimatedQuantityQuintals: 45,
      bookingStatus: 'COMPLETED',
      operationalStatus: 'PAYMENT_COMPLETED',
      createdAt: new Date('2026-08-20T10:00:00Z')
    });
    totalBookingsCreated++;

    const pastProc = await Procurement.create({
      bookingId: pastBooking._id,
      farmerId: rameshUser._id,
      centreId: gomtiCentre._id,
      tokenNumber: 'GOM01-042',
      cropType: 'Wheat',
      declaredQuantityQuintals: 45,
      verifiedQuantityQuintals: 45,
      netWeightQuintals: 45,
      moisturePercentage: 11.2,
      qualityGrade: 'Grade A',
      procurementRatePerQuintal: 2275,
      grossAmount: 45 * 2275,
      deductions: 0,
      netPayableAmount: 45 * 2275,
      status: 'COMPLETED',
      receiptSerialNumber: 'REC-LKO_GOM01-20260820-042',
      completedAt: new Date('2026-08-20T11:30:00Z')
    });

    await PaymentStatus.create({
      bookingId: pastBooking._id,
      procurementId: pastProc._id,
      farmerId: rameshUser._id,
      currentStage: 'PAID',
      totalAmount: 45 * 2275,
      demoReferenceNumber: 'DBT-LKO-2026-GOM01-042',
      stageHistory: [
        { stage: 'SLOT_CONFIRMED', updatedAt: new Date('2026-08-20T09:00:00Z'), updatedByRole: 'FARMER' },
        { stage: 'PROCUREMENT_COMPLETED', updatedAt: new Date('2026-08-20T11:30:00Z'), updatedByRole: 'STAFF' },
        { stage: 'PAID', updatedAt: new Date('2026-08-21T14:00:00Z'), updatedByRole: 'ADMIN' }
      ]
    });

    // Realistic Recent Audit Trail (Staff actions)
    const staff = await User.find({ role: 'CENTRE_STAFF' }).lean();
    const auditLogsToCreate = [
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'GOM01-105', counter: 'Counter 01', centreCode: 'LKO_GOM01', minsAgo: 4 },
      { action: 'MARK_ARRIVED', prev: 'CALLED', next: 'ARRIVED', token: 'GOM01-106', counter: 'Intake Bay 01', centreCode: 'LKO_GOM01', minsAgo: 8 },
      { action: 'MARK_VERIFICATION', prev: 'ARRIVED', next: 'VERIFICATION', token: 'GOM01-107', counter: 'Counter 02', centreCode: 'LKO_GOM01', minsAgo: 14 },
      { action: 'MARK_QUALITY_CHECK', prev: 'VERIFICATION', next: 'QUALITY_CHECK', token: 'GOM01-108', counter: 'Quality Bay 01', centreCode: 'LKO_GOM01', minsAgo: 20 },
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'ALI02-104', counter: 'Counter 01', centreCode: 'LKO_ALI02', minsAgo: 3 },
      { action: 'MARK_WEIGHING', prev: 'QUALITY_CHECK', next: 'WEIGHING', token: 'BKT08-106', counter: 'Weighbridge 01', centreCode: 'LKO_BKT08', minsAgo: 12 },
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'BKT08-104', counter: 'Counter 01', centreCode: 'LKO_BKT08', minsAgo: 4 },
      { action: 'CALL_NEXT', prev: 'WAITING', next: 'CALLED', token: 'ALA05-105', counter: 'Counter 01', centreCode: 'LKO_ALA05', minsAgo: 5 }
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

    console.log(`[Operational Seed] SUCCESS: Seeded ${totalBookingsCreated} bookings, ${totalQueueEntriesCreated} queue entries across all 8 Lucknow centres!`);
  } catch (err) {
    console.error('[Operational Seed Error]', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedOperationalData().then(() => process.exit(0));
}

module.exports = seedOperationalData;
