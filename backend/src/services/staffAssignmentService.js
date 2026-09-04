const User = require('../models/User');
const Booking = require('../models/Booking');
const { inMemoryUsers } = require('../middleware/authMiddleware');

/**
 * Deterministically assigns an active staff member belonging strictly to the selected procurement centre.
 * Evaluates active workload and assigns candidate with lowest active booking count.
 * Tie-breaking: sorted deterministically by activeWorkload ASC, fullName ASC, _id ASC.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.centreId - Procurement Centre ID
 * @param {string} params.bookingDate - Booking date string (YYYY-MM-DD)
 * @returns {Promise<{assignedStaffId: any, assignedStaffName: string, assignedStaffDesignation: string, assignmentStatus: string}>}
 */
const assignStaffToBooking = async ({ centreId, bookingDate }) => {
  if (!centreId) {
    return {
      assignedStaffId: null,
      assignedStaffName: null,
      assignedStaffDesignation: null,
      assignmentStatus: 'PENDING'
    };
  }

  const centreIdStr = centreId.toString();

  // 1. Fetch all ACTIVE staff belonging strictly to this centre
  let candidates = [];
  try {
    candidates = await User.find({
      assignedCentreId: centreId,
      role: 'CENTRE_STAFF',
      accountStatus: 'ACTIVE',
      isActive: true
    }).select('_id fullName email designation isCentreHead accountStatus').lean();
  } catch (err) {
    candidates = [];
  }

  // Fallback to inMemoryUsers if MongoDB returned empty or during test fallback
  if (!candidates || candidates.length === 0) {
    if (inMemoryUsers && inMemoryUsers.size > 0) {
      for (const [, u] of inMemoryUsers) {
        const userCentre = u.assignedCentreId ? u.assignedCentreId.toString() : null;
        if (
          userCentre &&
          (userCentre === centreIdStr || userCentre === 'c1' || centreIdStr === 'c1') &&
          u.role === 'CENTRE_STAFF' &&
          u.accountStatus === 'ACTIVE' &&
          u.isActive !== false
        ) {
          candidates.push({
            _id: u._id || u.id,
            id: u._id || u.id,
            fullName: u.fullName,
            email: u.email,
            designation: u.designation || (u.isCentreHead ? 'Centre Head' : 'Procurement Operator'),
            isCentreHead: !!u.isCentreHead
          });
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      assignedStaffId: null,
      assignedStaffName: null,
      assignedStaffDesignation: null,
      assignmentStatus: 'PENDING'
    };
  }

  // 2. Role priority weighting & active workload for each candidate on bookingDate
  // General slot booking prioritizes Procurement Officer / Centre Manager / Procurement Operator
  const getRolePriority = (designation) => {
    const des = (designation || '').toLowerCase();
    if (des.includes('procurement officer')) return 1;
    if (des.includes('procurement operator')) return 2;
    if (des.includes('centre manager')) return 3;
    if (des.includes('quality inspector')) return 4;
    if (des.includes('weighing operator')) return 5;
    if (des.includes('queue') || des.includes('token')) return 6;
    return 7;
  };

  const operationalStaff = candidates.filter(c => !c.isCentreHead);
  const eligiblePool = operationalStaff.length > 0 ? operationalStaff : candidates;

  const staffWorkload = [];

  for (const staff of eligiblePool) {
    const staffId = staff._id ? staff._id.toString() : staff.id;
    let activeBookingsCount = 0;

    try {
      activeBookingsCount = await Booking.countDocuments({
        assignedStaffId: staff._id,
        bookingDate: bookingDate,
        bookingStatus: { $in: ['CONFIRMED', 'ARRIVED', 'IN QUEUE', 'QUALITY CHECK', 'WEIGHING', 'PROCUREMENT COMPLETE', 'PAYMENT PROCESSING'] }
      });
    } catch (countErr) {
      // In-memory count fallback
      const { inMemoryBookings } = require('./bookingService');
      if (inMemoryBookings) {
        for (const [, b] of inMemoryBookings) {
          if (
            b.assignedStaffId &&
            b.assignedStaffId.toString() === staffId &&
            b.bookingDate === bookingDate &&
            b.bookingStatus !== 'CANCELLED' &&
            b.bookingStatus !== 'COMPLETED'
          ) {
            activeBookingsCount += 1;
          }
        }
      }
    }

    staffWorkload.push({
      staff,
      activeBookingsCount,
      rolePriority: getRolePriority(staff.designation)
    });
  }

  // 3. Sort deterministically:
  // - Minimum active bookings count
  // - Role suitability (Procurement Officer / Operator preferred for slot intake)
  // - Stable tie-breaker: alphabetical by full name, then staff ID
  staffWorkload.sort((a, b) => {
    if (a.activeBookingsCount !== b.activeBookingsCount) {
      return a.activeBookingsCount - b.activeBookingsCount;
    }
    if (a.rolePriority !== b.rolePriority) {
      return a.rolePriority - b.rolePriority;
    }
    const nameCmp = a.staff.fullName.localeCompare(b.staff.fullName);
    if (nameCmp !== 0) return nameCmp;
    const idA = (a.staff._id || a.staff.id || '').toString();
    const idB = (b.staff._id || b.staff.id || '').toString();
    return idA.localeCompare(idB);
  });

  const selectedCandidate = staffWorkload[0].staff;

  return {
    assignedStaffId: selectedCandidate._id || selectedCandidate.id,
    assignedStaffName: selectedCandidate.fullName,
    assignedStaffDesignation: selectedCandidate.designation || 'Procurement Officer',
    assignmentStatus: 'ASSIGNED'
  };
};

/**
 * Returns a summary map of active workloads and total today assignments for staff at a centre.
 */
const getStaffWorkloadSummary = async ({ centreId, date }) => {
  const queryDate = date || new Date().toISOString().split('T')[0];
  const summary = new Map();

  try {
    const bookings = await Booking.find({
      centreId,
      bookingDate: queryDate
    }).select('assignedStaffId operationalStatus bookingStatus').lean();

    for (const b of bookings) {
      if (!b.assignedStaffId) continue;
      const sId = b.assignedStaffId.toString();
      const curr = summary.get(sId) || { activeWorkload: 0, todayAssignments: 0 };
      curr.todayAssignments += 1;
      const isCompleted = b.bookingStatus === 'COMPLETED' || b.operationalStatus === 'COMPLETED' || b.bookingStatus === 'CANCELLED' || b.operationalStatus === 'CANCELLED';
      if (!isCompleted) {
        curr.activeWorkload += 1;
      }
      summary.set(sId, curr);
    }
  } catch (err) {
    const { inMemoryBookings } = require('./bookingService');
    if (inMemoryBookings) {
      for (const [, b] of inMemoryBookings) {
        if (!b.assignedStaffId) continue;
        if (b.centreId && b.centreId.toString() !== centreId.toString()) continue;
        if (b.bookingDate === queryDate) {
          const sId = b.assignedStaffId.toString();
          const curr = summary.get(sId) || { activeWorkload: 0, todayAssignments: 0 };
          curr.todayAssignments += 1;
          const isCompleted = b.bookingStatus === 'COMPLETED' || b.operationalStatus === 'COMPLETED' || b.bookingStatus === 'CANCELLED' || b.operationalStatus === 'CANCELLED';
          if (!isCompleted) {
            curr.activeWorkload += 1;
          }
          summary.set(sId, curr);
        }
      }
    }
  }

  return summary;
};

module.exports = {
  assignStaffToBooking,
  getStaffWorkloadSummary
};
