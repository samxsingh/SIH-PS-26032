const express = require('express');
const router = express.Router();
const {
  getTodayQueue,
  handleCallNext,
  handleTransition,
  getStats,
  getMyQueueStatus
} = require('../controllers/queueController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/today', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), getTodayQueue);
router.post('/call-next', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), handleCallNext);
router.post('/:id/transition', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), handleTransition);
router.get('/stats', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), getStats);
router.get('/farmer-status', authenticate, authorize('FARMER'), getMyQueueStatus);

module.exports = router;
