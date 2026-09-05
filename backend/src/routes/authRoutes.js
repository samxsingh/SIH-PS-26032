const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  getStatesHandler,
  getDistrictsHandler,
  getVillagesHandler,
  gpsSuggestHandler,
  getLocationProvenanceHandler
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.post('/logout', (req, res) => res.status(200).json({ success: true, message: 'Logged out successfully' }));

// Location directory APIs
router.get('/locations/states', getStatesHandler);
router.get('/locations/districts', getDistrictsHandler);
router.get('/locations/villages', getVillagesHandler);
router.get('/locations/provenance', getLocationProvenanceHandler);
router.post('/locations/gps-suggest', gpsSuggestHandler);

module.exports = router;
