import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  hi: {
    translation: translationHI,
  },
};

const savedLanguage = localStorage.getItem('languagePreference') || 'en';

// Humanize raw key so dots like 'farmer.book_slot' never appear raw in UI
const formatMissingKey = (key) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[i18n Warning] Missing translation key: "${key}" in language: "${i18n.language || savedLanguage}"`);
  }
  const segment = key.includes('.') ? key.split('.').pop() : key;
  return segment
    .split('_')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    returnEmptyString: false,
    returnNull: false,
    parseMissingKeyHandler: formatMissingKey,
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n Missing] [${lng}:${ns}] "${key}"`);
      }
    },
    interpolation: {
      escapeValue: false, // React handles XSS escaping
    },
  });

export default i18n;
