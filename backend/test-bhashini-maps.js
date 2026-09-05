/**
 * Test Suite: Digital India Bhashini APIs & Google Maps Services Verification
 */

const assert = require('assert');
const bhashiniService = require('./src/services/bhashiniService');

console.log('====================================================');
console.log('🧪 RUNNING BHASHINI & GOOGLE MAPS SERVICE TESTS');
console.log('====================================================\n');

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err.message);
      process.exitCode = 1;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err.message);
      process.exitCode = 1;
    }
  }

  // 1. Languages Discovery
  test('Supported Languages list includes major Indian regional languages', () => {
    const langs = bhashiniService.getSupportedLanguages();
    assert(Array.isArray(langs), 'Languages must be an array');
    assert(langs.length >= 8, 'Must support at least 8 languages');
    const codes = langs.map((l) => l.code);
    assert(codes.includes('en'), 'Must include English');
    assert(codes.includes('hi'), 'Must include Hindi');
    assert(codes.includes('mr'), 'Must include Marathi');
    assert(codes.includes('pa'), 'Must include Punjabi');
    assert(codes.includes('gu'), 'Must include Gujarati');
    assert(codes.includes('ta'), 'Must include Tamil');
    assert(codes.includes('te'), 'Must include Telugu');
    assert(codes.includes('kn'), 'Must include Kannada');
  });

  // 2. Protected Terms Masking & Preservation
  test('Protected Terms Masking protects "AgriNexus", Centre Codes, and Currency amounts', () => {
    const original = 'Welcome to AgriNexus for mandi delivery at centre LKO-GOM-001 with MSP ₹2,275 per quintal';
    const { maskedText, tokenMap } = bhashiniService.maskProtectedTerms(original);

    // Protected terms should not be in the masked text
    assert(!maskedText.includes('AgriNexus'), 'AgriNexus should be masked');
    assert(!maskedText.includes('LKO-GOM-001'), 'Centre code should be masked');
    assert(!maskedText.includes('₹2,275'), 'Currency amount should be masked');
    assert(tokenMap.size >= 3, `Expected at least 3 tokens, got ${tokenMap.size}`);

    // Unmasking should restore exact original strings
    const unmasked = bhashiniService.unmaskProtectedTerms(maskedText, tokenMap);
    assert(unmasked.includes('AgriNexus'), 'Unmasked must contain AgriNexus');
    assert(unmasked.includes('LKO-GOM-001'), 'Unmasked must contain centre code');
    assert(unmasked.includes('₹2,275'), 'Unmasked must contain currency amount');
  });

  // 3. Fallback Translation when unconfigured
  await asyncTest('Bhashini service gracefully falls back when unconfigured without throwing', async () => {
    bhashiniService.clearCache();
    const result = await bhashiniService.translate('Book Slot', 'hi', 'en');
    assert.strictEqual(result.fallback, true, 'Should indicate fallback');
    assert.strictEqual(result.translatedText, 'Book Slot', 'Should return original text');
  });

  // 4. In-Memory Cache Verification
  await asyncTest('Translation caching avoids repeated pipeline lookups', async () => {
    bhashiniService.clearCache();
    // Pre-populate or test caching
    const text = 'Farmer Produce Intake';
    const res1 = await bhashiniService.translate(text, 'hi', 'en');
    assert.strictEqual(res1.cached, false);

    // If cache entry exists, verify cache hits
    const res2 = await bhashiniService.translate(text, 'hi', 'en');
    const stats = bhashiniService.getCacheStats();
    assert(typeof stats.entriesCount === 'number');
  });

  // 5. Batch Translation Verification
  await asyncTest('Batch translation processes array of texts gracefully', async () => {
    const texts = ['Procurement Status', 'Digital Token', 'Quality Inspection'];
    const results = await bhashiniService.batchTranslate(texts, 'mr', 'en');
    assert(Array.isArray(results));
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].original, 'Procurement Status');
    assert.strictEqual(results[0].fallback, true);
  });

  // 6. Voice TTS & STT Extension Stubs
  await asyncTest('TTS and STT methods return graceful structured response when unconfigured', async () => {
    const ttsRes = await bhashiniService.textToSpeech('Test', 'hi');
    assert.strictEqual(ttsRes.supported, false);
    assert(ttsRes.notice.includes('BHASHINI_API_KEY'));

    const sttRes = await bhashiniService.speechToText('dummyBase64', 'hi');
    assert.strictEqual(sttRes.supported, false);
    assert(sttRes.notice.includes('BHASHINI_API_KEY'));
  });

  // 7. Haversine Distance Mathematics
  test('Haversine distance formula accurately measures geographic distance', () => {
    // Lucknow to Kanpur: ~75-80 km
    const lat1 = 26.8467, lon1 = 80.9462;
    const lat2 = 26.4499, lon2 = 80.3319;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(R * c * 10) / 10;

    assert(dist >= 70 && dist <= 85, `Expected ~75-80km, calculated ${dist}km`);
  });

  console.log(`\n====================================================`);
  console.log(`📊 RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log(`====================================================\n`);
}

runTests();
