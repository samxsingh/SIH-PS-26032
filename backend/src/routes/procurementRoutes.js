const express = require('express');
const router = express.Router();
const {
  handleRecordVerification,
  handleCompleteProcurement,
  getProcurementDetails
} = require('../controllers/procurementController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/:bookingId/verify', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), handleRecordVerification);
router.post('/:bookingId/weigh-complete', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), handleCompleteProcurement);
router.get('/:bookingId', authenticate, getProcurementDetails);

module.exports = router;
