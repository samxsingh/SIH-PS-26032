/**
 * Localization helper for domain models, lifecycle enums, and commodities.
 * Maps backend database enums and technical strings to human-readable i18n keys.
 */

export const getLocalizedStage = (stageKey, t) => {
  if (!stageKey || !t) return '';
  const raw = String(stageKey).trim();
  const lower = raw.toLowerCase();

  // Normalize aliases to canonical enum keys
  let normalizedKey = lower;
  if (lower === 'confirmed' || lower === 'procured') normalizedKey = 'procurement_confirmed';
  if (lower === 'qc' || lower === 'quality') normalizedKey = 'quality_check';
  if (lower === 'verify') normalizedKey = 'verification';
  if (lower === 'weigh') normalizedKey = 'weighing';
  if (lower === 'settled' || lower === 'paid') normalizedKey = 'payment_completed';

  // 1. Check lifecycle namespace
  const lifecycleKey = `lifecycle.${normalizedKey}`;
  const translated = t(lifecycleKey);
  if (translated && translated !== lifecycleKey) return translated;

  // 2. Check status namespace with normalized key
  const statusKey = `status.${normalizedKey}`;
  const statusTranslated = t(statusKey);
  if (statusTranslated && statusTranslated !== statusKey) return statusTranslated;

  // 3. Check status namespace with direct lower key
  const directStatusKey = `status.${lower}`;
  const directTranslated = t(directStatusKey);
  if (directTranslated && directTranslated !== directStatusKey) return directTranslated;

  // Friendly human format fallback
  return raw.replace(/_/g, ' ');
};

export const getLocalizedCrop = (cropName, t) => {
  if (!cropName || !t) return '';
  const raw = String(cropName).trim();
  const key = raw.toLowerCase();
  
  const cropKey = `crops.${key}`;
  const translated = t(cropKey);
  if (translated && translated !== cropKey) return translated;

  return raw;
};

/**
 * Authoritative Government MSP policy rate lookup for client components
 * Department of Consumer Affairs / Ministry of Agriculture
 */
export const getMspRateForCrop = (cropType) => {
  const norm = String(cropType || '').trim().toLowerCase();
  switch (norm) {
    case 'paddy':
    case 'dhan':
      return 2300;
    case 'mustard':
    case 'sarson':
      return 5650;
    case 'pulses':
    case 'dal':
    case 'dalhan':
      return 6600;
    case 'wheat':
    case 'gehun':
    default:
      return 2275;
  }
};

