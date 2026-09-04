/**
 * AgriNexus Multilingual Registry Architecture
 * Governs active MVP languages and regional language expansion roadmap for Department of Consumer Affairs.
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    status: 'MVP',
    isDefault: true,
    direction: 'ltr'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    status: 'MVP',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    status: 'PLANNED',
    isDefault: false,
    direction: 'ltr'
  }
];

export const getActiveLanguages = () => SUPPORTED_LANGUAGES.filter((lang) => lang.status === 'MVP');

export const getPlannedLanguages = () => SUPPORTED_LANGUAGES.filter((lang) => lang.status === 'PLANNED');

export default SUPPORTED_LANGUAGES;
