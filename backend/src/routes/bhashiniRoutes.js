const express = require('express');
const router = express.Router();
const bhashiniController = require('../controllers/bhashiniController');

// Public translation and language discovery routes
router.get('/languages', bhashiniController.getLanguages);
router.post('/translate', bhashiniController.translateText);
router.post('/batch-translate', bhashiniController.batchTranslate);

// Voice extension routes
router.post('/tts', bhashiniController.textToSpeech);
router.post('/stt', bhashiniController.speechToText);

module.exports = router;
