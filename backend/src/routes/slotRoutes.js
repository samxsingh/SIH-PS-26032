const express = require('express');
const router = express.Router();
const { getSlots } = require('../controllers/slotController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getSlots);

module.exports = router;
