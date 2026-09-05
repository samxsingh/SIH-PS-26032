const bhashiniService = require('../services/bhashiniService');

/**
 * Translate a single text string using Bhashini pipeline with local caching & protected terms.
 * POST /api/bhashini/translate
 */
exports.translateText = async (req, res, next) => {
  try {
    const { text, targetLanguage = 'hi', sourceLanguage = 'en' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Text string is required for translation.' }
      });
    }

    const result = await bhashiniService.translate(text, targetLanguage, sourceLanguage);

    return res.status(200).json({
      success: true,
      data: {
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage,
        targetLanguage,
        cached: result.cached,
        fallback: result.fallback,
        notice: result.notice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch translate an array of texts.
 * POST /api/bhashini/batch-translate
 */
exports.batchTranslate = async (req, res, next) => {
  try {
    const { texts, targetLanguage = 'hi', sourceLanguage = 'en' } = req.body;

    if (!Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        error: { message: 'An array of strings "texts" is required.' }
      });
    }

    const results = await bhashiniService.batchTranslate(texts, targetLanguage, sourceLanguage);

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List supported Indian languages and Bhashini configuration status.
 * GET /api/bhashini/languages
 */
exports.getLanguages = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      languages: bhashiniService.getSupportedLanguages(),
      configured: bhashiniService.isConfigured(),
      cacheStats: bhashiniService.getCacheStats()
    }
  });
};

/**
 * Voice Text-to-Speech (TTS) extension endpoint.
 * POST /api/bhashini/tts
 */
exports.textToSpeech = async (req, res, next) => {
  try {
    const { text, language = 'hi', gender = 'female' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: { message: 'Text string is required for speech synthesis.' }
      });
    }

    const result = await bhashiniService.textToSpeech(text, language, gender);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Voice Speech-to-Text (ASR) extension endpoint.
 * POST /api/bhashini/stt
 */
exports.speechToText = async (req, res, next) => {
  try {
    const { audioBase64, language = 'hi' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: { message: 'Base64 encoded audio string is required for speech recognition.' }
      });
    }

    const result = await bhashiniService.speechToText(audioBase64, language);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
