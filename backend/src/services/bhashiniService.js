/**
 * AgriNexus - Digital India Bhashini API Service Layer
 * 
 * Secure backend proxy for MeitY / Digital India Bhashini (ULCA) translation pipeline.
 * Features:
 *  - Native fetch (zero extra dependencies)
 *  - High-performance in-memory caching with TTL
 *  - Strict protected term preservation ("AgriNexus", Centre Codes, Currency amounts, IDs)
 *  - Graceful zero-error fallback when unconfigured, offline, or rate-limited
 *  - Voice-ready extension points for STT (Speech-to-Text) and TTS (Text-to-Speech)
 */

// Supported Indian regional languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
];

// Terms strictly protected from translation across all languages
const PROTECTED_TERMS = [
  'AgriNexus',
  'AGRINEXUS',
  'agrinexus',
  'Kisan',
  'Mandi',
  'MSP',
  'DBT',
  'UPI',
  'NEFT',
  'RTGS'
];

const env = require('../config/env');

// In-memory translation cache: key -> { translatedText, timestamp }
const translationCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class BhashiniService {
  constructor() {
    this.apiKey = env.BHASHINI_API_KEY || '';
    this.userId = env.BHASHINI_USER_ID || '';
    this.pipelineId = env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543d6';
    this.inferenceUrl = env.BHASHINI_API_URL || 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
  }

  /**
   * Check if Bhashini credentials are fully configured.
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(
      this.apiKey &&
      this.apiKey.trim() !== '' &&
      this.apiKey !== 'your_bhashini_api_key_here' &&
      this.userId &&
      this.userId.trim() !== '' &&
      this.userId !== 'your_bhashini_user_id_here'
    );
  }

  /**
   * Returns the list of officially supported Indian languages.
   * @returns {Array<{code: string, name: string, nativeName: string}>}
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Mask protected terms, centre codes, and currency amounts before translation.
   * @param {string} text
   * @returns {{ maskedText: string, tokenMap: Map<string, string> }}
   */
  maskProtectedTerms(text) {
    if (!text || typeof text !== 'string') return { maskedText: text, tokenMap: new Map() };

    const tokenMap = new Map();
    let tokenIndex = 0;
    let masked = text;

    // 1. Mask explicit brand and system terms
    PROTECTED_TERMS.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'g');
      masked = masked.replace(regex, (match) => {
        const token = `__PRTK_${tokenIndex++}__`;
        tokenMap.set(token, match);
        return token;
      });
    });

    // 2. Mask centre codes and application IDs (e.g., LKO-GOM-001, SEH01, APP-2026-X)
    const codeRegex = /\b[A-Z]{2,4}-[A-Z0-9]+-[0-9]{3,4}\b|\b[A-Z]{3}[0-9]{2}\b/g;
    masked = masked.replace(codeRegex, (match) => {
      const token = `__PRTK_${tokenIndex++}__`;
      tokenMap.set(token, match);
      return token;
    });

    // 3. Mask currency amounts (e.g., ₹2,275 or Rs. 50,000)
    const currencyRegex = /(?:₹|Rs\.?)\s?[\d,]+(?:\.\d{2})?/g;
    masked = masked.replace(currencyRegex, (match) => {
      const token = `__PRTK_${tokenIndex++}__`;
      tokenMap.set(token, match);
      return token;
    });

    return { maskedText: masked, tokenMap };
  }

  /**
   * Unmask previously replaced protected tokens back to original values.
   * @param {string} text
   * @param {Map<string, string>} tokenMap
   * @returns {string}
   */
  unmaskProtectedTerms(text, tokenMap) {
    if (!text || !tokenMap || tokenMap.size === 0) return text;

    let unmasked = text;
    tokenMap.forEach((originalValue, token) => {
      // Handles cases where translation engine might alter spacing around tokens
      const escapedToken = token.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const flexibleRegex = new RegExp(`\\s*${escapedToken}\\s*`, 'g');
      unmasked = unmasked.replace(flexibleRegex, ` ${originalValue} `);
    });

    return unmasked.replace(/\s+/g, ' ').trim();
  }

  /**
   * Translate a single text string from source to target language.
   * Gracefully falls back to original text if Bhashini is unreachable or unconfigured.
   * @param {string} text
   * @param {string} targetLang
   * @param {string} [sourceLang='en']
   * @returns {Promise<{ translatedText: string, cached: boolean, fallback: boolean, notice?: string, error?: string }>}
   */
  async translate(text, targetLang = 'hi', sourceLang = 'en') {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return { translatedText: text, cached: false, fallback: false };
    }

    // Identical languages require no translation
    if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
      return { translatedText: text, cached: false, fallback: false };
    }

    const cacheKey = `${sourceLang}:${targetLang}:${text.trim()}`;
    const cachedEntry = translationCache.get(cacheKey);

    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      return { translatedText: cachedEntry.translatedText, cached: true, fallback: false };
    }

    // If Bhashini credentials are not present, return original text safely
    if (!this.isConfigured()) {
      return {
        translatedText: text,
        cached: false,
        fallback: true,
        notice: 'Bhashini API credentials not configured. Serving original language.'
      };
    }

    // Mask protected terms
    const { maskedText, tokenMap } = this.maskProtectedTerms(text);

    try {
      const payload = {
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
              }
            }
          }
        ],
        inputData: {
          input: [
            {
              source: maskedText
            }
          ]
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(this.inferenceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey,
          ulcaApiKey: this.apiKey,
          userId: this.userId
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from Bhashini endpoint`);
      }

      const resData = await response.json();
      const output = resData?.pipelineResponse?.[0]?.output?.[0]?.target;
      if (output) {
        const finalTranslated = this.unmaskProtectedTerms(output, tokenMap);
        translationCache.set(cacheKey, {
          translatedText: finalTranslated,
          timestamp: Date.now()
        });

        return { translatedText: finalTranslated, cached: false, fallback: false };
      }

      throw new Error('Invalid pipeline response structure from Bhashini');
    } catch (err) {
      console.warn(`[Bhashini Service] Translation fallback (${sourceLang} -> ${targetLang}):`, err.message);
      // Resilient fallback: return original text with fallback flag
      return {
        translatedText: text,
        cached: false,
        fallback: true,
        error: err.message
      };
    }
  }

  /**
   * Batch translate multiple text strings.
   * @param {string[]} texts
   * @param {string} targetLang
   * @param {string} [sourceLang='en']
   * @returns {Promise<Array<{ original: string, translated: string, fallback: boolean }>>}
   */
  async batchTranslate(texts, targetLang = 'hi', sourceLang = 'en') {
    if (!Array.isArray(texts) || texts.length === 0) return [];

    const results = await Promise.all(
      texts.map(async (text) => {
        const res = await this.translate(text, targetLang, sourceLang);
        return {
          original: text,
          translated: res.translatedText,
          fallback: res.fallback
        };
      })
    );

    return results;
  }

  /**
   * Extension point for Bhashini Text-to-Speech (TTS).
   * Generates audio base64 for voice-guided procurement assistance.
   * @param {string} text
   * @param {string} language
   * @param {'female'|'male'} [gender='female']
   * @returns {Promise<{ audioContent: string|null, supported: boolean }>}
   */
  async textToSpeech(text, language = 'hi', gender = 'female') {
    if (!this.isConfigured()) {
      return {
        audioContent: null,
        supported: false,
        notice: 'Bhashini TTS requires active BHASHINI_API_KEY configuration.'
      };
    }

    try {
      const payload = {
        pipelineTasks: [
          {
            taskType: 'tts',
            config: {
              language: { sourceLanguage: language },
              gender
            }
          }
        ],
        inputData: {
          input: [{ source: text }]
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(this.inferenceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey,
          ulcaApiKey: this.apiKey,
          userId: this.userId
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const resData = await response.json();
      const audioBase64 = resData?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
      return { audioContent: audioBase64 || null, supported: Boolean(audioBase64) };
    } catch (err) {
      console.warn('[Bhashini TTS] Service unavailable:', err.message);
      return { audioContent: null, supported: false, error: err.message };
    }
  }

  /**
   * Extension point for Bhashini Automated Speech Recognition (ASR / STT).
   * Converts voice audio from farmers into text.
   * @param {string} audioBase64 Base64 encoded audio
   * @param {string} language Source language code
   * @returns {Promise<{ transcript: string, supported: boolean }>}
   */
  async speechToText(audioBase64, language = 'hi') {
    if (!this.isConfigured()) {
      return {
        transcript: '',
        supported: false,
        notice: 'Bhashini ASR requires active BHASHINI_API_KEY configuration.'
      };
    }

    try {
      const payload = {
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: { sourceLanguage: language }
            }
          }
        ],
        inputData: {
          audio: [{ audioContent: audioBase64 }]
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.inferenceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey,
          ulcaApiKey: this.apiKey,
          userId: this.userId
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const resData = await response.json();
      const transcript = resData?.pipelineResponse?.[0]?.output?.[0]?.source || '';
      return { transcript, supported: true };
    } catch (err) {
      console.warn('[Bhashini STT] Service unavailable:', err.message);
      return { transcript: '', supported: false, error: err.message };
    }
  }

  /**
   * Clear in-memory translation cache (useful for testing or cache invalidation).
   */
  clearCache() {
    translationCache.clear();
  }

  /**
   * Return cache statistics.
   */
  getCacheStats() {
    return {
      entriesCount: translationCache.size,
      ttlMs: CACHE_TTL_MS
    };
  }
}

module.exports = new BhashiniService();
