const express = require('express');
const router = express.Router();
const { createFarmerBooking, getMyBookings, cancelBooking } = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/', authenticate, authorize('FARMER'), createFarmerBooking);
router.get('/my', authenticate, authorize('FARMER'), getMyBookings);
router.post('/:id/cancel', authenticate, authorize('FARMER'), cancelBooking);

module.exports = router;
