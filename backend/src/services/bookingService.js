const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const ProcurementCentre = require('../models/ProcurementCentre');
const QueueEntry = require('../models/QueueEntry');
const { generateTokenNumber } = require('./tokenService');

// In-memory fallback stores if MongoDB is offline during test runner execution
const inMemoryBookings = new Map();
const inMemorySlots = new Map();
const inMemoryQueueEntries = new Map();

// Seed realistic operational bookings for today in Lucknow Gomti Nagar Centre (c1)
const initDemoBookings = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const demoBookings = [
    {
      _id: 'bkg_demo_01',
      id: 'bkg_demo_01',
      bookingReference: 'AGR-LKO-10291',
      tokenNumber: 'LKO-1042',
      farmerId: 'user_farmer_01',
      farmerName: 'Ramesh Patel',
      farmerPhone: '9876543210',
      farmerVillage: 'Chinhat',
      centreId: 'c1',
      slotId: 'slot_demo_01',
      bookingDate: todayStr,
      timeWindow: '09:00 AM - 10:00 AM',
      cropType: 'Wheat',
      estimatedQuantityQuintals: 25,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'IN QUEUE',
      assignedStaffId: 'user_staff_04',
      assignedStaffName: 'Amit Sharma',
      assignedStaffDesignation: 'Procurement Officer',
      assignmentStatus: 'ASSIGNED',
      statusHistory: [
        { status: 'BOOKED', updatedAt: new Date(Date.now() - 3600000), updatedBy: 'Farmer Portal', note: 'Slot reserved' },
        { status: 'ARRIVED', updatedAt: new Date(Date.now() - 1800000), updatedBy: 'Satish Kumar', note: 'Farmer verified at gate' },
        { status: 'IN QUEUE', updatedAt: new Date(Date.now() - 900000), updatedBy: 'Ravi Sharma', note: 'Token active in queue counter 1' }
      ],
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date()
    },
    {
      _id: 'bkg_demo_02',
      id: 'bkg_demo_02',
      bookingReference: 'AGR-LKO-10292',
      tokenNumber: 'LKO-1043',
      farmerId: 'user_farmer_02',
      farmerName: 'Suresh Kumar',
      farmerPhone: '9876543221',
      farmerVillage: 'Aliganj',
      centreId: 'c1',
      slotId: 'slot_demo_02',
      bookingDate: todayStr,
      timeWindow: '10:00 AM - 11:00 AM',
      cropType: 'Paddy',
      estimatedQuantityQuintals: 35,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'QUALITY CHECK',
      assignedStaffId: 'user_staff_05',
      assignedStaffName: 'Pooja Verma',
      assignedStaffDesignation: 'Quality Inspector',
      assignmentStatus: 'ASSIGNED',
      statusHistory: [
        { status: 'BOOKED', updatedAt: new Date(Date.now() - 4000000), updatedBy: 'Farmer Portal', note: 'Slot reserved' },
        { status: 'ARRIVED', updatedAt: new Date(Date.now() - 2200000), updatedBy: 'Satish Kumar', note: 'Arrived at inspection counter' },
        { status: 'QUALITY CHECK', updatedAt: new Date(Date.now() - 600000), updatedBy: 'Pooja Verma', note: 'Sample moisture test under inspection' }
      ],
      createdAt: new Date(Date.now() - 4000000),
      updatedAt: new Date()
    },
    {
      _id: 'bkg_demo_03',
      id: 'bkg_demo_03',
      bookingReference: 'AGR-LKO-10293',
      tokenNumber: 'LKO-1044',
      farmerId: 'user_farmer_03',
      farmerName: 'Mahendra Singh',
      farmerPhone: '9876543233',
      farmerVillage: 'Bakshi Ka Talab',
      centreId: 'c1',
      slotId: 'slot_demo_03',
      bookingDate: todayStr,
      timeWindow: '11:00 AM - 12:00 PM',
      cropType: 'Mustard',
      estimatedQuantityQuintals: 18,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'WEIGHING',
      assignedStaffId: 'user_staff_03',
      assignedStaffName: 'Anil Verma',
      assignedStaffDesignation: 'Weighing Operator',
      assignmentStatus: 'ASSIGNED',
      statusHistory: [
        { status: 'BOOKED', updatedAt: new Date(Date.now() - 5000000), updatedBy: 'Farmer Portal', note: 'Slot reserved' },
        { status: 'QUALITY CHECK', updatedAt: new Date(Date.now() - 1500000), updatedBy: 'Pooja Verma', note: 'Quality approved Grade A' },
        { status: 'WEIGHING', updatedAt: new Date(Date.now() - 300000), updatedBy: 'Anil Verma', note: 'Weighbridge gross weight in progress' }
      ],
      createdAt: new Date(Date.now() - 5000000),
      updatedAt: new Date()
    },
    {
      _id: 'bkg_demo_04',
      id: 'bkg_demo_04',
      bookingReference: 'AGR-LKO-10294',
      tokenNumber: 'LKO-1045',
      farmerId: 'user_farmer_04',
      farmerName: 'Rajesh Verma',
      farmerPhone: '9876543244',
      farmerVillage: 'Indira Nagar',
      centreId: 'c1',
      slotId: 'slot_demo_04',
      bookingDate: todayStr,
      timeWindow: '12:00 PM - 01:00 PM',
      cropType: 'Wheat',
      estimatedQuantityQuintals: 40,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'ARRIVED',
      assignedStaffId: 'user_staff_02',
      assignedStaffName: 'Ravi Sharma',
      assignedStaffDesignation: 'Token/Queue Operator',
      assignmentStatus: 'ASSIGNED',
      statusHistory: [
        { status: 'BOOKED', updatedAt: new Date(Date.now() - 2000000), updatedBy: 'Farmer Portal', note: 'Slot reserved' },
        { status: 'ARRIVED', updatedAt: new Date(Date.now() - 400000), updatedBy: 'Ravi Sharma', note: 'Checked in at security gate' }
      ],
      createdAt: new Date(Date.now() - 2000000),
      updatedAt: new Date()
    },
    {
      _id: 'bkg_demo_05',
      id: 'bkg_demo_05',
      bookingReference: 'AGR-LKO-10295',
      tokenNumber: 'LKO-1046',
      farmerId: 'user_farmer_05',
      farmerName: 'Dharmendra Yadav',
      farmerPhone: '9876543255',
      farmerVillage: 'Gomti Nagar',
      centreId: 'c1',
      slotId: 'slot_demo_05',
      bookingDate: todayStr,
      timeWindow: '02:00 PM - 03:00 PM',
      cropType: 'Maize',
      estimatedQuantityQuintals: 50,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'BOOKED',
      assignedStaffId: 'user_staff_04',
      assignedStaffName: 'Amit Sharma',
      assignedStaffDesignation: 'Procurement Officer',
      assignmentStatus: 'ASSIGNED',
      statusHistory: [
        { status: 'BOOKED', updatedAt: new Date(Date.now() - 1000000), updatedBy: 'Farmer Portal', note: 'Slot reserved for afternoon' }
      ],
      createdAt: new Date(Date.now() - 1000000),
      updatedAt: new Date()
    },
    {
      _id: 'bkg_demo_00',
      id: 'bkg_demo_00',
      bookingReference: 'AGR-LKO-10290',
      tokenNumber: 'LKO-1041',
      farmerId: 'user_farmer_06',
      farmerName: 'Ram Prasad',
      farmerPhone: '9876543266',
      farmerVillage: 'Chinhat',
      centreId: 'c1',
      slotId: 'slot_demo_00',
      bookingDate: todayStr,
      timeWindow: '08:00 AM - 09:00 AM',
      cropType: 'Wheat',
      estimatedQuantityQuintals: 30,
      bookingStatus: 'COMPLETED',
      operationalStatus: 'COMPLETED',
      assignedStaffId: 'user_staff_04',
      assignedStaffName: 'Amit Sharma',
      assignedStaffDesignation: 'Procurement Officer',
      assignmentStatus: 'ASSIGNED',
      statusHistory: [
        { status: 'BOOKED', updatedAt: new Date(Date.now() - 7200000), updatedBy: 'Farmer Portal', note: 'Slot reserved' },
        { status: 'COMPLETED', updatedAt: new Date(Date.now() - 1800000), updatedBy: 'Satish Kumar', note: 'Procurement completed and receipt issued' }
      ],
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date()
    }
  ];

  for (const b of demoBookings) {
    inMemoryBookings.set(b._id, b);
  }
};

initDemoBookings();

const createBooking = async ({ farmerId, centreId, slotId, cropType, estimatedQuantityQuintals }) => {
  const reqQty = Number(estimatedQuantityQuintals) || 1;

  // 1. Verify Slot Existence
  let slot = null;
  try {
    slot = await Slot.findById(slotId);
  } catch (err) {
    slot = inMemorySlots.get(slotId);
  }

  if (!slot && inMemorySlots.has(slotId)) {
    slot = inMemorySlots.get(slotId);
  }

  if (!slot) {
    throw new Error('The selected time slot was not found or is no longer available.');
  }

  if (slot.status === 'CLOSED' || slot.status === 'FULL') {
    throw new Error('This time slot is fully booked or closed. Please select another slot.');
  }

  // 2. Dual Capacity Verification (Farmer count AND Quintal capacity limit)
  if (slot.bookedFarmersCount >= slot.maxFarmersAllowed) {
    slot.status = 'FULL';
    if (slot.save) await slot.save();
    throw new Error('This time slot has reached maximum farmer capacity. Please select another slot.');
  }

  if (slot.bookedCapacityQuintals + reqQty > slot.maxCapacityQuintals) {
    throw new Error(`Booking ${reqQty} quintals exceeds slot capacity limit (${slot.maxCapacityQuintals - slot.bookedCapacityQuintals} Qtl remaining).`);
  }

  // 3. Fetch Procurement Centre Code
  let centre = null;
  try {
    centre = await ProcurementCentre.findById(centreId);
  } catch (err) {
    // Centre check
  }

  if (centre) {
    if (centre.verificationStatus === 'REJECTED' || centre.verificationStatus === 'INACTIVE' || centre.isActive === false) {
      throw new Error('This procurement centre is not currently accepting bookings.');
    }
  }

  const centreCode = centre ? (centre.centreCode || 'LKO_GOM01') : 'LKO_GOM01';

  // 4. Prevent duplicate active booking on the same date for the farmer
  let existingFarmerBooking = null;
  try {
    existingFarmerBooking = await Booking.findOne({
      farmerId,
      bookingDate: slot.date,
      bookingStatus: 'CONFIRMED'
    });
  } catch (err) {
    for (const [, b] of inMemoryBookings) {
      if ((b.farmerId === farmerId || b.farmerId.toString() === farmerId.toString()) && b.bookingDate === slot.date && b.bookingStatus === 'CONFIRMED') {
        existingFarmerBooking = b;
        break;
      }
    }
  }

  if (existingFarmerBooking) {
    throw new Error(`You already have an active procurement booking (${existingFarmerBooking.tokenNumber}) on ${slot.date}.`);
  }

  // 5. Generate Token & Booking Reference
  const { tokenNumber, bookingReference, sequenceNumber } = await generateTokenNumber(centreCode, slot.date);

  // 6. Atomic Capacity Reservation on Slot (Dual Farmer Count + Quintal Limit Protection)
  try {
    const updatedSlot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        bookedFarmersCount: { $lt: slot.maxFarmersAllowed },
        $expr: {
          $lte: [
            { $add: ['$bookedCapacityQuintals', reqQty] },
            '$maxCapacityQuintals'
          ]
        },
        status: { $ne: 'CLOSED' }
      },
      {
        $inc: {
          bookedFarmersCount: 1,
          bookedCapacityQuintals: reqQty
        }
      },
      { new: true }
    );

    if (!updatedSlot) {
      throw new Error('Slot capacity limit reached during booking. Please try another slot.');
    }

    if (updatedSlot.bookedFarmersCount >= updatedSlot.maxFarmersAllowed || updatedSlot.bookedCapacityQuintals >= updatedSlot.maxCapacityQuintals) {
      updatedSlot.status = 'FULL';
      await updatedSlot.save();
    }
  } catch (dbErr) {
    if (dbErr.message.includes('Slot capacity limit')) throw dbErr;
    // Fallback in-memory update
    slot.bookedFarmersCount += 1;
    slot.bookedCapacityQuintals += reqQty;
    if (slot.bookedFarmersCount >= slot.maxFarmersAllowed || slot.bookedCapacityQuintals >= slot.maxCapacityQuintals) {
      slot.status = 'FULL';
    }
  }

  // 7. Deterministically Assign Active Centre Staff Operator
  const { assignStaffToBooking } = require('./staffAssignmentService');
  let staffAssignment = { assignedStaffId: null, assignedStaffName: null, assignedStaffDesignation: null, assignmentStatus: 'PENDING' };
  try {
    staffAssignment = await assignStaffToBooking({ centreId, bookingDate: slot.date });
  } catch (assignErr) {
    console.warn('[Staff Assignment] Auto-assignment skipped/failed gracefully:', assignErr.message);
  }

  // 8. Create Booking Document
  let newBooking;
  try {
    newBooking = await Booking.create({
      bookingReference,
      tokenNumber,
      farmerId,
      centreId,
      slotId,
      bookingDate: slot.date,
      timeWindow: slot.timeWindow,
      cropType: cropType || 'Wheat',
      estimatedQuantityQuintals: reqQty,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'BOOKED',
      statusHistory: [
        {
          status: 'BOOKED',
          updatedAt: new Date(),
          updatedBy: 'System',
          note: 'Slot booked successfully'
        }
      ],
      assignedStaffId: staffAssignment.assignedStaffId,
      assignedStaffName: staffAssignment.assignedStaffName,
      assignedStaffDesignation: staffAssignment.assignedStaffDesignation,
      assignmentStatus: staffAssignment.assignmentStatus
    });
  } catch (dbErr) {
    const id = 'bkg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    newBooking = {
      _id: id,
      bookingReference,
      tokenNumber,
      farmerId,
      centreId,
      slotId,
      bookingDate: slot.date,
      timeWindow: slot.timeWindow,
      cropType: cropType || 'Wheat',
      estimatedQuantityQuintals: reqQty,
      bookingStatus: 'CONFIRMED',
      operationalStatus: 'BOOKED',
      statusHistory: [
        {
          status: 'BOOKED',
          updatedAt: new Date(),
          updatedBy: 'System',
          note: 'Slot booked successfully'
        }
      ],
      assignedStaffId: staffAssignment.assignedStaffId,
      assignedStaffName: staffAssignment.assignedStaffName,
      assignedStaffDesignation: staffAssignment.assignedStaffDesignation,
      assignmentStatus: staffAssignment.assignmentStatus,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryBookings.set(id, newBooking);
  }

  // 8. Create Initial QueueEntry in state WAITING
  const bookingId = newBooking._id ? newBooking._id.toString() : newBooking.id;
  try {
    await QueueEntry.create({
      bookingId,
      farmerId,
      centreId,
      slotId,
      tokenNumber,
      queueDate: slot.date,
      sequenceNumber,
      state: 'WAITING'
    });
  } catch (qErr) {
    const qId = 'qe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    inMemoryQueueEntries.set(qId, {
      _id: qId,
      bookingId,
      farmerId,
      centreId,
      slotId,
      tokenNumber,
      queueDate: slot.date,
      sequenceNumber,
      state: 'WAITING',
      createdAt: new Date()
    });
  }

  return newBooking;
};

module.exports = {
  createBooking,
  inMemoryBookings,
  inMemorySlots,
  inMemoryQueueEntries
};
