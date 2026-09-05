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

// Semantic Transition Action Routes
router.post('/:id/arrived', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'ARRIVED';
  handleTransition(req, res, next);
});
router.post('/:id/verify', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'VERIFICATION';
  handleTransition(req, res, next);
});
router.post('/:id/quality-check', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'QUALITY_CHECK';
  handleTransition(req, res, next);
});
router.post('/:id/weigh', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'WEIGHING';
  handleTransition(req, res, next);
});
router.post('/:id/confirm', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'PROCUREMENT_CONFIRMED';
  handleTransition(req, res, next);
});
router.post('/:id/payment-processing', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'PAYMENT_PROCESSING';
  handleTransition(req, res, next);
});
router.post('/:id/payment-completed', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'PAYMENT_COMPLETED';
  handleTransition(req, res, next);
});
router.post('/:id/complete', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'COMPLETED';
  handleTransition(req, res, next);
});
router.post('/:id/cancel', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'CANCELLED';
  handleTransition(req, res, next);
});
router.post('/:id/no-show', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'NO_SHOW';
  handleTransition(req, res, next);
});
router.post('/:id/reject', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), (req, res, next) => {
  req.body.targetState = req.body.targetState || 'REJECTED';
  handleTransition(req, res, next);
});

router.get('/stats', authenticate, authorize('CENTRE_STAFF', 'ADMIN'), getStats);
router.get('/farmer-status', authenticate, authorize('FARMER'), getMyQueueStatus);

module.exports = router;
