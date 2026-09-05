import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SUPPORTED_INDIAN_LANGUAGES,
  translateWithBhashini,
  speakTextWithBhashini
} from '../services/bhashiniService';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(() => localStorage.getItem('languagePreference') || 'en');
  const [isTranslating, setIsTranslating] = useState(false);

  const changeLanguage = useCallback((newLang) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('languagePreference', newLang);
  }, [i18n]);

  const toggleLanguage = useCallback(() => {
    const nextLang = language === 'en' ? 'hi' : 'en';
    changeLanguage(nextLang);
  }, [language, changeLanguage]);

  // Translate any dynamic or runtime string using Bhashini proxy
  const translateDynamic = useCallback(async (text, targetLang = null) => {
    const target = targetLang || language;
    if (!text || target === 'en') return text;
    try {
      setIsTranslating(true);
      const res = await translateWithBhashini(text, target, 'en');
      return res;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Voice narration helper using Bhashini TTS or browser speech
  const speakText = useCallback(async (text, lang = null) => {
    const targetLang = lang || language;
    return await speakTextWithBhashini(text, targetLang);
  }, [language]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const currentLanguageMeta = SUPPORTED_INDIAN_LANGUAGES.find((l) => l.code === language) || {
    code: language,
    name: language.toUpperCase(),
    nativeName: language.toUpperCase()
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        currentLanguageMeta,
        supportedLanguages: SUPPORTED_INDIAN_LANGUAGES,
        changeLanguage,
        toggleLanguage,
        translateDynamic,
        speakText,
        isTranslating
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
