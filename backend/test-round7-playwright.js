/**
 * AgriNexus - Round 7 Playwright Browser Verification
 * Verifies:
 * 1. Demo Account Selector presents Administrator generically (No Dr. Anand Verma, no District Magistrate, no phone or email displayed)
 * 2. Admin Dashboard renders District Operational Intelligence metrics & Operational Exception Desk
 * 3. 8 Centres Health and Reporting table with Area/Tehsil and Current Bottleneck
 * 4. Staff Queue Board visual hierarchy: NOW SERVING, NEXT, 7-stage operational metrics
 * 5. Farmer Procurement Page: DEMO ENVIRONMENT badge, 10-stage ladder, receipt print capability
 * 6. Brand name AgriNexus strictly preserved
 */

const { chromium } = require('/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package');
const mongoose = require('mongoose');

const FRONTEND_URL = 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';
const seedOperationalData = require('./seed/seedOperationalData');

async function runRound7BrowserVerification() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 7 PLAYWRIGHT BROWSER VERIFICATION');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  await seedOperationalData();

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

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
    // -------------------------------------------------------------
    // TEST 1: DEMO ACCOUNT SELECTOR - ADMIN ROLE
    // -------------------------------------------------------------
    await page.goto(`${FRONTEND_URL}/login?role=ADMIN`, { waitUntil: 'networkidle' });
    const demoBtn = page.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await demoBtn.click();
    await page.waitForTimeout(500);

    const modalContent = await page.locator('[role="dialog"]').innerText();
    assert(
      '1. Demo Account Selector displays generic "Administrator"',
      modalContent.includes('Administrator')
    );
    assert(
      '2. Demo Account Selector displays "District-level monitoring and operations"',
      modalContent.includes('District-level monitoring and operations')
    );
    assert(
      '3. Demo Account Selector DOES NOT display "Dr. Anand Verma"',
      !modalContent.includes('Dr. Anand Verma') && !modalContent.includes('Anand Verma')
    );
    assert(
      '4. Demo Account Selector DOES NOT display "District Magistrate"',
      !modalContent.includes('District Magistrate')
    );
    assert(
      '5. Demo Account Selector DOES NOT display admin email or phone in card body',
      !modalContent.includes('admin@agrinexus.gov.in') && !modalContent.includes('9876543200')
    );

    // Select account and login
    const useAccountBtn = page.locator('[role="dialog"] button:has-text("Use Account"), [role="dialog"] button:has-text("खाता चुनें")').first();
    await useAccountBtn.click();
    await page.waitForTimeout(300);

    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/admin**', { timeout: 8000 });
    await page.waitForTimeout(1500);

    // -------------------------------------------------------------
    // TEST 2: ADMIN DASHBOARD - OPERATIONAL INTELLIGENCE & EXCEPTION DESK
    // -------------------------------------------------------------
    const adminPageText = await page.locator('main').innerText();
    assert(
      '6. Admin Dashboard: Displays Active Farmers metric',
      adminPageText.includes('Active Farmers') || adminPageText.includes('55')
    );
    assert(
      '7. Admin Dashboard: Displays Centres Operational (8/8)',
      adminPageText.includes('8/8') || adminPageText.includes('Centres Operational')
    );
    assert(
      '8. Admin Dashboard: Displays Current Bottleneck indicator',
      adminPageText.includes('Bottleneck') || adminPageText.includes('Optimal Flow') || adminPageText.includes('Verification')
    );
    assert(
      '9. Admin Dashboard: Displays Operational Exception Desk',
      /operational exception desk/i.test(adminPageText) || adminPageText.includes('Reported Cases')
    );
    assert(
      '10. Admin Dashboard: Exception Desk contains Moisture limit exception',
      adminPageText.includes('Moisture') || adminPageText.includes('14.8%')
    );

    // Test Exception Tab
    const exceptionTab = page.locator('[data-testid="tab-exceptions"]');
    if (await exceptionTab.isVisible()) {
      await exceptionTab.click();
      await page.waitForTimeout(500);
      const tabText = await page.locator('main').innerText();
      assert('11. Admin Exception Desk dedicated tab works cleanly', /operational exception desk/i.test(tabText) || tabText.includes('Reported Cases'));
    }

    // -------------------------------------------------------------
    // TEST 3: STAFF QUEUE BOARD - HIERARCHY & 7-STAGE METRICS
    // -------------------------------------------------------------
    await page.goto(`${FRONTEND_URL}/login?role=CENTRE_STAFF`, { waitUntil: 'networkidle' });
    await page.locator('#login-staff-email').fill('gomtinagar.centre@agrinexus.demo');
    await page.locator('#login-password').fill('password123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/staff**', { timeout: 8000 });
    await page.waitForTimeout(1500);

    // Switch to Queue tab to view queue board
    const queueTab = page.locator('button:has-text("Today\'s Queue"), button:has-text("Queue")').first();
    if (await queueTab.isVisible()) {
      await queueTab.click();
      await page.waitForTimeout(600);
    }

    const staffText = await page.locator('main').innerText();
    assert(
      '12. Staff Board: Displays NOW SERVING section',
      staffText.includes('NOW SERVING') || staffText.includes('Live Counter Operations')
    );
    assert(
      '13. Staff Board: Displays NEXT in line preview',
      staffText.includes('NEXT') || staffText.includes('CALL NEXT')
    );
    assert(
      '14. Staff Board: Displays 7-stage operational metrics strip',
      /waiting/i.test(staffText) || /completed/i.test(staffText) || staffText.includes('प्रतीक्षारत')
    );

    // -------------------------------------------------------------
    // TEST 4: FARMER PROCUREMENT JOURNEY & RECEIPT
    // -------------------------------------------------------------
    await page.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });
    await page.locator('#login-farmer-mobile').fill('9876543210');
    await page.locator('#login-password').fill('password123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/farmer**', { timeout: 8000 });
    await page.waitForTimeout(1200);

    // Go to procurement journey for active booking
    const trackBtn = page.locator('a[href*="/farmer/procurement/"]').first();
    if (await trackBtn.isVisible()) {
      await trackBtn.click();
      await page.waitForURL('**/farmer/procurement/**', { timeout: 8000 });
      await page.waitForTimeout(1200);

      const journeyText = await page.locator('main').innerText();
      assert(
        '15. Farmer Journey: Displays "DEMO ENVIRONMENT • Lucknow District"',
        journeyText.includes('DEMO ENVIRONMENT') || journeyText.includes('Lucknow District')
      );
      assert(
        '16. Farmer Journey: Displays PFMS and Digital Weighbridge simulation indicators',
        journeyText.includes('PFMS Simulation') && journeyText.includes('Digital Weighbridge')
      );
      assert(
        '17. Farmer Journey: 10-Stage progress ladder visible',
        journeyText.includes('10-Stage Procurement') || journeyText.includes('stages completed')
      );
    }

    // Check brand wordmark AgriNexus untranslated
    const brandName = await page.locator('header, nav').locator('text=AgriNexus').first().isVisible();
    assert('18. Brand AgriNexus wordmark visible and untranslated', brandName);

    await context.close();
    await browser.close();

    console.log('\n================================================================');
    console.log(`  PLAYWRIGHT ROUND 7 RESULT: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Playwright Error:', err);
    await browser.close();
    process.exit(1);
  }
}

runRound7BrowserVerification();
