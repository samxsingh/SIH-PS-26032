/**
 * Environment Variable Validator for AgriNexus Backend
 * Validates required configuration on server startup without leaking secret values.
 */

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const warnings = [];
  const errors = [];

  // 1. Port Configuration
  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    errors.push('PORT must be a valid integer number.');
  }

  // 2. JWT Secret Verification
  if (!process.env.JWT_SECRET) {
    if (isProduction) {
      errors.push('JWT_SECRET is required in production.');
    } else {
      warnings.push('JWT_SECRET not provided. Using development fallback secret key.');
    }
  } else if (isProduction && process.env.JWT_SECRET === 'super_secret_sih_2026_gov_key_change_in_production') {
    errors.push('JWT_SECRET cannot use default fallback value in production.');
  }

  // 3. Database URI Verification
  if (!process.env.MONGODB_URI) {
    warnings.push('MONGODB_URI not provided. Connecting to default local MongoDB instance.');
  }

  // 4. CORS Client URL Verification
  if (!process.env.CLIENT_URL) {
    warnings.push('CLIENT_URL not set. Defaulting to http://localhost:5173.');
  }

  // 5. Digital India Bhashini Service
  if (!process.env.BHASHINI_API_KEY) {
    warnings.push('BHASHINI_API_KEY not set. Operating with built-in static translations & graceful fallback.');
  }

  // Output warnings if any
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    warnings.forEach((w) => console.warn(`[Config Notice] ${w}`));
  }

  // Throw error if critical production configuration is missing
  if (errors.length > 0) {
    console.error('=======================================================');
    console.error('❌ CRITICAL ENVIRONMENT CONFIGURATION ERROR(S):');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('=======================================================');
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }
};

module.exports = validateEnv;
