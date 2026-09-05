const express = require('express');
const router = express.Router();
const { getMandis, getMandiById } = require('../controllers/mandiController');
const { authenticate } = require('../middleware/authMiddleware');

// Public/Farmer Mandi Discovery
router.get('/', authenticate, getMandis);
router.get('/:id', authenticate, getMandiById);

module.exports = router;
