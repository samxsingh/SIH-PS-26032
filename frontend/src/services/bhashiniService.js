/**
 * AgriNexus - Digital India Bhashini Client Service
 * 
 * Provides client-side translation caching, language discovery,
 * and proxy integration with backend /api/bhashini endpoints.
 */

import apiClient from './apiClient';

// Client-side in-memory & localStorage translation cache
const CLIENT_CACHE_KEY_PREFIX = 'agrinexus_bhashini_cache_';

export const SUPPORTED_INDIAN_LANGUAGES = [
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

/**
 * Get cached translation from browser storage if available.
 */
const getClientCache = (sourceLang, targetLang, text) => {
  try {
    const key = `${CLIENT_CACHE_KEY_PREFIX}${sourceLang}_${targetLang}_${encodeURIComponent(text.slice(0, 40))}`;
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      // Cache valid for 48 hours
      if (Date.now() - parsed.timestamp < 48 * 60 * 60 * 1000) {
        return parsed.translated;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
};

/**
 * Store translation in client storage.
 */
const setClientCache = (sourceLang, targetLang, text, translated) => {
  try {
    const key = `${CLIENT_CACHE_KEY_PREFIX}${sourceLang}_${targetLang}_${encodeURIComponent(text.slice(0, 40))}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        translated,
        timestamp: Date.now()
      })
    );
  } catch (e) {
    // LocalStorage quota or disabled
  }
};

/**
 * Translate a single dynamic text string via Bhashini proxy.
 * @param {string} text Text to translate
 * @param {string} targetLang Target language code (e.g., 'hi', 'mr', 'pa')
 * @param {string} [sourceLang='en'] Source language code
 * @returns {Promise<string>} Translated text (or original text on fallback)
 */
export const translateWithBhashini = async (text, targetLang = 'hi', sourceLang = 'en') => {
  if (!text || typeof text !== 'string' || text.trim() === '') return text;
  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) return text;

  // Check client cache first
  const cached = getClientCache(sourceLang, targetLang, text);
  if (cached) return cached;

  try {
    const res = await apiClient.post('/bhashini/translate', {
      text,
      targetLanguage: targetLang,
      sourceLanguage: sourceLang
    });

    if (res.success && res.data?.translatedText) {
      const translated = res.data.translatedText;
      setClientCache(sourceLang, targetLang, text, translated);
      return translated;
    }
  } catch (err) {
    console.warn('[Bhashini Client] Translation request fallback:', err.message);
  }

  // Graceful fallback to original text
  return text;
};

/**
 * Batch translate an array of strings.
 * @param {string[]} texts
 * @param {string} targetLang
 * @param {string} [sourceLang='en']
 * @returns {Promise<string[]>}
 */
export const batchTranslateWithBhashini = async (texts, targetLang = 'hi', sourceLang = 'en') => {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) return texts;

  try {
    const res = await apiClient.post('/bhashini/batch-translate', {
      texts,
      targetLanguage: targetLang,
      sourceLanguage: sourceLang
    });

    if (res.success && Array.isArray(res.data)) {
      return res.data.map((item) => item.translated || item.original);
    }
  } catch (err) {
    console.warn('[Bhashini Client] Batch translation fallback:', err.message);
  }

  return texts;
};

/**
 * Fetch supported Indian languages from server.
 */
export const fetchSupportedLanguages = async () => {
  try {
    const res = await apiClient.get('/bhashini/languages');
    if (res.success && res.data?.languages) {
      return res.data.languages;
    }
  } catch (err) {
    console.warn('[Bhashini Client] Languages lookup fallback:', err.message);
  }
  return SUPPORTED_INDIAN_LANGUAGES;
};

/**
 * Play text-to-speech audio for voice accessibility.
 * @param {string} text Text to vocalize
 * @param {string} language Language code
 */
export const speakTextWithBhashini = async (text, language = 'hi') => {
  try {
    const res = await apiClient.post('/bhashini/tts', { text, language });
    if (res.success && res.data?.audioContent) {
      const audio = new Audio(`data:audio/wav;base64,${res.data.audioContent}`);
      await audio.play();
      return true;
    }
  } catch (err) {
    console.warn('[Bhashini TTS] Audio playback unavailable:', err.message);
  }

  // Native browser Web Speech API fallback
  if ('speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('[Browser Speech] Speech synthesis error:', e);
    }
  }

  return false;
};

export default {
  SUPPORTED_INDIAN_LANGUAGES,
  translateWithBhashini,
  batchTranslateWithBhashini,
  fetchSupportedLanguages,
  speakTextWithBhashini
};
