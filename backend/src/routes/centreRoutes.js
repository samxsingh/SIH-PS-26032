const express = require('express');
const router = express.Router();
const {
  getCentres,
  getRecommendedCentres,
  getCentreById,
  getMyCentreProfile,
  updateMyCentreProfile,
  getMyCentreStaff,
  addCentreStaffMember,
  updateStaffStatus,
  updateStaffMemberDetails,
  getCentreTodayBookings,
  updateBookingOperationalStatus,
  reassignBookingStaff
} = require('../controllers/centreController');
const { authenticate, requireCentreAccess, requireCentreHead } = require('../middleware/authMiddleware');

// Public/Farmer Centre Discovery
router.get('/', authenticate, getCentres);
router.get('/recommend', authenticate, getRecommendedCentres);

// Centre Management & Staff Provisioning (Centre-scoped)
router.get('/my/profile', authenticate, requireCentreAccess, getMyCentreProfile);
router.put('/my/profile', authenticate, requireCentreHead, updateMyCentreProfile);
router.get('/my/staff', authenticate, requireCentreAccess, getMyCentreStaff);
router.post('/my/staff', authenticate, requireCentreHead, addCentreStaffMember);
router.patch('/my/staff/:staffId', authenticate, requireCentreHead, updateStaffMemberDetails);
router.patch('/my/staff/:staffId/status', authenticate, requireCentreHead, updateStaffStatus);

// Centre Operational Bookings & Status Updates
router.get('/my/bookings/today', authenticate, requireCentreAccess, getCentreTodayBookings);
router.patch('/my/bookings/:id/status', authenticate, requireCentreAccess, updateBookingOperationalStatus);
router.patch('/my/bookings/:id/reassign-staff', authenticate, requireCentreHead, reassignBookingStaff);

// Centre Details by ID (Must be below explicit /my routes)
router.get('/:id', authenticate, getCentreById);

module.exports = router;
