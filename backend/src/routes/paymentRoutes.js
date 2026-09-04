const express = require('express');
const router = express.Router();
const { getPaymentStatus, handleUpdatePaymentStage } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/:bookingId', authenticate, getPaymentStatus);
router.post('/:bookingId/stage', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), handleUpdatePaymentStage);

module.exports = router;
