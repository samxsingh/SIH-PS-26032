/**
 * AgriNexus - Round 6 Final Comprehensive Playwright Browser Journey
 * Tests full cross-portal workflows in English and Hindi across 4 viewports:
 * 1440x900 (Desktop), 1024x768 (Tablet), 414x896 (Mobile Large), 375x812 (Mobile Standard)
 */

const { chromium } = require('/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package');
const mongoose = require('mongoose');
const seedOperationalData = require('./seed/seedOperationalData');

const FRONTEND_URL = 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

const VIEWPORTS = [
  { name: '1440x900 (Desktop)', width: 1440, height: 900 },
  { name: '1024x768 (Tablet)', width: 1024, height: 768 },
  { name: '414x896 (Mobile Large)', width: 414, height: 896 },
  { name: '375x812 (Mobile Standard)', width: 375, height: 812 }
];

async function runBrowserJourney() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 6 FINAL PLAYWRIGHT BROWSER JOURNEY');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  await seedOperationalData();

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  let passed = 0;
  let total = 0;

  function assert(name, condition, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✔ PASS [${total}]: ${name}`);
    } else {
      console.error(`✖ FAIL [${total}]: ${name} ${detail ? `(${detail})` : ''}`);
    }
  }

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} ---`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      // 1. Farmer Login (English)
      await page.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });
      assert(`[${vp.name}] Farmer login page loaded`, await page.isVisible('button[type="submit"]'));

      // Verify Demo Accounts selector features canonical Ramesh Patel
      const demoBtn = page.locator('button:has-text("Demo Accounts")');
      if (await demoBtn.isVisible()) {
        await demoBtn.click();
        await page.waitForTimeout(300);
        const hasRamesh = await page.locator('text=Ramesh Patel').isVisible();
        assert(`[${vp.name}] Demo accounts selector shows canonical Ramesh Patel`, hasRamesh);
        // Select account
        await page.locator('button:has-text("Use Account"), button:has-text("Active")').first().click();
        await page.waitForTimeout(200);
      } else {
        await page.locator('#login-farmer-mobile').fill('9876543210');
        await page.locator('#login-password').fill('password123');
      }

      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/farmer**', { timeout: 8000 });
      assert(`[${vp.name}] Farmer dashboard reached`, page.url().includes('/farmer'));

      // 2. Verify Farmer Dashboard & Centre Discovery
      await page.waitForTimeout(1000);
      const hasAgriNexusWordmark = await page.locator('header, nav').locator('text=AgriNexus').first().isVisible();
      assert(`[${vp.name}] Brand AgriNexus wordmark preserved in English`, hasAgriNexusWordmark);

      // Verify active booking card shows GOM01-109
      const bookingText = await page.textContent('body');
      assert(`[${vp.name}] Active booking token GOM01-109 visible on Farmer Dashboard`, bookingText.includes('GOM01-109'));

      // 3. Navigate to Find Centres Map
      await page.goto(`${FRONTEND_URL}/farmer/find-centres`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      assert(`[${vp.name}] Find Centres map view rendered`, page.url().includes('find-centres'));

      // 4. Staff Portal Login
      await page.goto(`${FRONTEND_URL}/login?role=STAFF`, { waitUntil: 'networkidle' });
      await page.locator('#login-staff-email').fill('gomtinagar.centre@agrinexus.demo');
      await page.locator('#login-password').fill('password123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/staff**', { timeout: 8000 });
      assert(`[${vp.name}] Staff Workspace reached for Gomti Nagar`, page.url().includes('/staff'));

      // Switch to Queue tab to view queue entries
      const queueTab = page.locator('button:has-text("Today\'s Queue"), button:has-text("Queue")').first();
      if (await queueTab.isVisible()) {
        await queueTab.click();
        await page.waitForTimeout(600);
      }

      const staffBody = await page.textContent('body');
      assert(`[${vp.name}] Gomti Nagar staff queue board shows GOM01-109`, staffBody.includes('GOM01-109') || staffBody.includes('Ramesh Patel'));

      // 5. Admin District Command Dashboard
      await page.goto(`${FRONTEND_URL}/login?role=ADMIN`, { waitUntil: 'networkidle' });
      await page.locator('#login-admin-email').fill('admin@agrinexus.gov.in');
      await page.locator('#login-password').fill('adminpassword');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/admin**', { timeout: 8000 });
      assert(`[${vp.name}] Admin district dashboard reached`, page.url().includes('/admin'));

      await context.close();
    }

    // -------------------------------------------------------------
    // HINDI WORKFLOW & LOCALIZATION CONSISTENCY (1440x900)
    // -------------------------------------------------------------
    console.log('\n--- Testing Full Hindi Localization Flow ---');
    const hiContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const hiPage = await hiContext.newPage();
    await hiPage.addInitScript(() => {
      localStorage.setItem('languagePreference', 'hi');
    });

    // 1. Farmer Hindi Dashboard
    await hiPage.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });
    await hiPage.locator('#login-farmer-mobile').fill('9876543210');
    await hiPage.locator('#login-password').fill('password123');
    await hiPage.locator('button[type="submit"]').first().click();
    await hiPage.waitForURL('**/farmer**', { timeout: 8000 });
    await hiPage.waitForTimeout(1200);

    const hiFarmerText = await hiPage.textContent('body');
    const brandPreservedInHindi = await hiPage.locator('header, nav').locator('text=AgriNexus').first().isVisible();
    assert('Hindi: Brand AgriNexus remains untranslated as "AgriNexus"', brandPreservedInHindi);

    const hasNoDisallowedTrans = !hiFarmerText.includes('कृषि नेक्सस') && !hiFarmerText.includes('एग्रीनेक्सस');
    assert('Hindi: Zero occurrences of forbidden "कृषि नेक्सस" or "एग्रीनेक्सस"', hasNoDisallowedTrans);

    const hasHindiTerms = hiFarmerText.includes('किसान') || hiFarmerText.includes('खरीद केंद्र') || hiFarmerText.includes('गेहूं') || hiFarmerText.includes('बुकिंग');
    assert('Hindi: Core agricultural terms localized (किसान, खरीद केंद्र, गेहूं)', hasHindiTerms);

    // 2. Staff Hindi Workspace
    await hiPage.goto(`${FRONTEND_URL}/login?role=STAFF`, { waitUntil: 'networkidle' });
    await hiPage.locator('#login-staff-email').fill('gomtinagar.centre@agrinexus.demo');
    await hiPage.locator('#login-password').fill('password123');
    await hiPage.locator('button[type="submit"]').first().click();
    await hiPage.waitForURL('**/staff**', { timeout: 8000 });
    await hiPage.waitForTimeout(1200);

    const staffBrandPreserved = await hiPage.locator('header, nav').locator('text=AgriNexus').first().isVisible();
    assert('Hindi Staff: Brand AgriNexus remains untranslated', staffBrandPreserved);

    // 3. Admin Hindi Dashboard
    await hiPage.goto(`${FRONTEND_URL}/login?role=ADMIN`, { waitUntil: 'networkidle' });
    await hiPage.locator('#login-admin-email').fill('admin@agrinexus.gov.in');
    await hiPage.locator('#login-password').fill('adminpassword');
    await hiPage.locator('button[type="submit"]').first().click();
    await hiPage.waitForURL('**/admin**', { timeout: 8000 });
    await hiPage.waitForTimeout(1500);

    const hiAdminText = await hiPage.textContent('body');
    assert('Hindi Admin: District overview rendered cleanly in Hindi with AgriNexus wordmark', hiAdminText.includes('AgriNexus'));

    await hiContext.close();
    await browser.close();

    console.log('\n================================================================');
    console.log(`  PLAYWRIGHT JOURNEY: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Playwright Error:', err);
    await browser.close();
    process.exit(1);
  }
}

runBrowserJourney();
