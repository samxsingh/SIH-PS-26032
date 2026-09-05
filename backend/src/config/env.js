/**
 * AgriNexus - Centralized Backend Environment Configuration
 * 
 * Centralizes all process.env accesses into a single, validated, type-safe configuration object.
 * Strictly validates required production variables when NODE_ENV === 'production' to prevent
 * insecure defaults or misconfigurations on Render or cloud hosting environments.
 */

require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_TEST = NODE_ENV === 'test';

// Port configuration (Render dynamically sets process.env.PORT)
const PORT = parseInt(process.env.PORT, 10) || 5001;
const HOST = process.env.HOST || '0.0.0.0';

// Frontend URL & CORS Resolution
const rawFrontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
const FRONTEND_URL = rawFrontendUrl.replace(/\/+$/, '');

// Parse comma-separated CORS origins into an array of clean origins
const parseCorsOrigins = (rawString, defaultOrigin) => {
  if (!rawString || rawString.trim() === '') {
    return [defaultOrigin];
  }
  return rawString
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const CORS_ORIGINS = parseCorsOrigins(
  process.env.CORS_ORIGINS,
  FRONTEND_URL
);

const SOCKET_CORS_ORIGINS = process.env.SOCKET_CORS_ORIGINS
  ? parseCorsOrigins(process.env.SOCKET_CORS_ORIGINS, FRONTEND_URL)
  : CORS_ORIGINS;

// Database Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

// Authentication & JWT Security
const DEFAULT_DEV_JWT_SECRET = 'super_secret_sih_2026_gov_key_change_in_production';
const JWT_SECRET = process.env.JWT_SECRET || (IS_PRODUCTION ? null : DEFAULT_DEV_JWT_SECRET);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Pre-provisioned Government Administrator Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@agrinexus.gov.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpassword';

// Google Maps Platform (Backend)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Digital India Bhashini APIs (Backend Proxy)
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY || '';
const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID || '';
const BHASHINI_PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543d6';
const BHASHINI_API_URL = process.env.BHASHINI_API_URL || process.env.BHASHINI_INFERENCE_URL || 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';

/**
 * Validate configuration.
 * Throws a fatal error in production if required variables are missing or insecure.
 */
const validateConfig = () => {
  const errors = [];
  const warnings = [];

  // Port Validation
  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    errors.push(`Invalid PORT specified: "${process.env.PORT}". Must be an integer between 1 and 65535.`);
  }

  // Production Strict Validation
  if (IS_PRODUCTION) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      errors.push('JWT_SECRET is strictly required in production.');
    } else if (process.env.JWT_SECRET === DEFAULT_DEV_JWT_SECRET) {
      errors.push('JWT_SECRET cannot use the default development fallback in production.');
    } else if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production.');
    }

    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
      errors.push('MONGODB_URI is strictly required in production (e.g., MongoDB Atlas URI).');
    } else if (process.env.MONGODB_URI.includes('localhost') || process.env.MONGODB_URI.includes('127.0.0.1')) {
      warnings.push('MONGODB_URI points to localhost in production mode. Ensure a managed MongoDB Atlas URI is used.');
    }

    if (CORS_ORIGINS.some((o) => o.includes('localhost') || o.includes('127.0.0.1'))) {
      warnings.push('CORS_ORIGINS includes localhost in production. Ensure production frontend domains (Vercel) are specified.');
    }
  } else {
    // Development Warnings
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET not provided. Using development fallback secret.');
    }
    if (!process.env.MONGODB_URI) {
      warnings.push('MONGODB_URI not set. Defaulting to local MongoDB: mongodb://localhost:27017/smart_procurement_db.');
    }
  }

  // Bhashini Status
  if (!BHASHINI_API_KEY || BHASHINI_API_KEY === 'your_bhashini_api_key_here') {
    warnings.push('BHASHINI_API_KEY not configured. Bhashini proxy will operate in graceful fallback mode.');
  }

  // Log warnings in non-test mode
  if (warnings.length > 0 && !IS_TEST) {
    warnings.forEach((w) => console.warn(`[Config Notice] ${w}`));
  }

  // Abort startup on critical production errors
  if (errors.length > 0) {
    console.error('=======================================================');
    console.error('❌ FATAL CONFIGURATION ERROR(S) - STARTUP ABORTED:');
    errors.forEach((err) => console.error(`  • ${err}`));
    console.error('=======================================================');
    throw new Error(`Configuration validation failed: ${errors.join('; ')}`);
  }
};

module.exports = {
  NODE_ENV,
  IS_PRODUCTION,
  IS_TEST,
  PORT,
  HOST,
  FRONTEND_URL,
  CORS_ORIGINS,
  SOCKET_CORS_ORIGINS,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  GOOGLE_MAPS_API_KEY,
  BHASHINI_API_KEY,
  BHASHINI_USER_ID,
  BHASHINI_PIPELINE_ID,
  BHASHINI_API_URL,
  validateConfig
};
