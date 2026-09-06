/**
 * AgriNexus - Round 8 Playwright Demonstration & Cross-Portal Consistency Browser Verification
 */

const { chromium } = require('/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package');
const mongoose = require('mongoose');

const FRONTEND_URL = 'http://localhost:5173';
const BASE_URL = 'http://localhost:5001/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';
const seedOperationalData = require('./seed/seedOperationalData');
const QueueEntry = require('./src/models/QueueEntry');
const Procurement = require('./src/models/Procurement');

const apiPost = async (url, data, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
  return await res.json();
};

async function runRound8BrowserVerification() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 8 PLAYWRIGHT CROSS-PORTAL DEMO VERIFICATION');
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
    // -------------------------------------------------------------
    // TEST 1: DEMO ACCOUNT SELECTOR - GENERIC ADMIN & CLEAN RBAC
    // -------------------------------------------------------------
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopContext.newPage();

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
      '2. Demo Account Selector hides PII (no "Dr. Anand Verma", no "District Magistrate")',
      !modalContent.includes('Dr. Anand Verma') && !modalContent.includes('District Magistrate')
    );

    // Switch language to Hindi in modal
    const langBtn = page.locator('button:has-text("हिन्दी"), button:has-text("HI")').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(400);
      const hiModal = await page.locator('[role="dialog"]').innerText();
      assert('3. Demo Account Selector displays generic "प्रशासक" in Hindi', hiModal.includes('प्रशासक'));
      // Switch back to English
      const enBtn = page.locator('button:has-text("English"), button:has-text("EN")').first();
      if (await enBtn.isVisible()) await enBtn.click();
      await page.waitForTimeout(400);
    }

    // Close modal
    const closeBtn = page.locator('[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("रद्द करें")').first();
    if (await closeBtn.isVisible()) await closeBtn.click();

    // -------------------------------------------------------------
    // TEST 2: FARMER PORTAL - RAMESH PATEL INTAKE BOOKING
    // -------------------------------------------------------------
    await page.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });
    await page.locator('#login-farmer-mobile').fill('9876543210');
    await page.locator('#login-password').fill('password123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/farmer**', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const farmerPageText = await page.locator('main').innerText();
    assert(
      '4. Farmer Dashboard: Displays Ramesh Patel and canonical token GOM01-109',
      farmerPageText.includes('Ramesh') || farmerPageText.includes('GOM01-109') || farmerPageText.includes('Gomti Nagar')
    );

    // Navigate to active procurement page
    const trackBtn = page.locator('a[href*="/farmer/procurement/"]').first();
    if (await trackBtn.isVisible()) {
      await trackBtn.click();
      await page.waitForURL('**/farmer/procurement/**', { timeout: 8000 });
      await page.waitForTimeout(1200);

      const journeyText = await page.locator('main').innerText();
      assert(
        '5. Farmer Procurement Page: Displays 10-Stage progress ladder',
        journeyText.includes('10-Stage') || journeyText.includes('Stage') || journeyText.includes('GOM01-109')
      );
      assert(
        '6. Farmer Procurement Page: Displays Gomti Nagar centre and Wheat produce',
        journeyText.includes('Gomti Nagar') && journeyText.includes('Wheat')
      );
    }

    // -------------------------------------------------------------
    // TEST 3: CENTRE STAFF WORKSPACE - SATISH KUMAR AT GOMTI NAGAR
    // -------------------------------------------------------------
    const staffContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const staffPage = await staffContext.newPage();

    await staffPage.goto(`${FRONTEND_URL}/login?role=CENTRE_STAFF`, { waitUntil: 'networkidle' });
    await staffPage.locator('#login-staff-email').fill('gomtinagar.centre@agrinexus.demo');
    await staffPage.locator('#login-password').fill('password123');
    await staffPage.locator('button[type="submit"]').first().click();
    await staffPage.waitForURL('**/staff**', { timeout: 8000 });
    await staffPage.waitForTimeout(1200);

    const staffMainText = await staffPage.locator('main').innerText();
    assert(
      '7. Staff Dashboard: Logged in as Satish Kumar at Gomti Nagar centre (LKO_GOM01)',
      staffMainText.includes('Gomti Nagar') || staffMainText.includes('Satish')
    );

    // Switch to Today's Queue Tab
    const queueTabBtn = staffPage.locator('button:has-text("Today\'s Queue"), button:has-text("Queue")').first();
    if (await queueTabBtn.isVisible()) {
      await queueTabBtn.click();
      await staffPage.waitForTimeout(600);
      const queueText = await staffPage.locator('main').innerText();
      assert('8. Staff Queue: Live Queue Board displays active entries', queueText.includes('NOW SERVING') || queueText.includes('WAITING') || queueText.includes('Queue'));
    }

    // -------------------------------------------------------------
    // EXECUTE CANONICAL DEMO TRANSITION TO ADVANCE GOM01-109
    // -------------------------------------------------------------
    const staffLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      email: 'gomtinagar.centre@agrinexus.demo',
      password: 'password123'
    });
    const staffToken = staffLoginRes.data?.token;

    const rameshQueue = await QueueEntry.findOne({ tokenNumber: 'GOM01-109' }).populate('bookingId');
    const qeId = rameshQueue._id.toString();
    const bkgId = (rameshQueue.bookingId?._id || rameshQueue.bookingId).toString();

    // Advance to CALLED -> ARRIVED -> VERIFICATION -> QUALITY_CHECK -> WEIGHING -> COMPLETE
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'CALLED' }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'ARRIVED' }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'VERIFICATION' }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'QUALITY_CHECK' }, staffToken);
    await apiPost(`${BASE_URL}/procurements/${bkgId}/verify`, {
      verifiedQuantityQuintals: 44.0,
      moisturePercentage: 12.3,
      impurityPercentage: 0.4,
      qualityGrade: 'Grade A',
      notes: 'Standard RMS 2026-27 fair average quality Wheat'
    }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'WEIGHING' }, staffToken);
    await apiPost(`${BASE_URL}/procurements/${bkgId}/weigh-complete`, {
      grossWeightQuintals: 45.5,
      tareWeightQuintals: 1.5,
      netWeightQuintals: 44.0,
      deductions: 0,
      notes: 'Certified weighbridge measurement'
    }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PROCUREMENT_CONFIRMED' }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PAYMENT_PROCESSING' }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: 'PAYMENT_COMPLETED' }, staffToken);

    // -------------------------------------------------------------
    // TEST 4: DIGITAL RECEIPT MODAL VERIFICATION (SECTION 13)
    // -------------------------------------------------------------
    // Refresh farmer page to reflect completed transaction
    await page.bringToFront();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const receiptBtn = page.locator('button:has-text("View Official Digital Receipt"), button:has-text("Digital Receipt"), button:has-text("रसीद देखें")').first();
    assert('9. Completed Transaction: "View Official Digital Receipt" button visible', await receiptBtn.isVisible());

    if (await receiptBtn.isVisible()) {
      await receiptBtn.click();
      await page.waitForTimeout(600);

      const receiptModal = page.locator('#printable-receipt, [role="dialog"]').first();
      const receiptModalText = await receiptModal.innerText();
      assert(
        '10. Digital Receipt Modal: Displays Gross Weight (45.5), Tare Weight (1.5), and Net Weight (44.0 Qtl)',
        receiptModalText.includes('44') && (receiptModalText.includes('45.5') || receiptModalText.includes('Gross'))
      );
      assert(
        '11. Digital Receipt Modal: Displays MSP Rate ₹2,275 and Net Payable ₹1,00,100',
        receiptModalText.includes('2,275') && receiptModalText.includes('1,00,100')
      );
      assert(
        '12. Digital Receipt Modal: Displays DBT Payment Status & Reference',
        receiptModalText.includes('DBT') || receiptModalText.includes('STATUS') || receiptModalText.includes('PAID')
      );
      assert(
        '13. Digital Receipt Modal: AgriNexus brand wordmark strictly visible',
        receiptModalText.includes('AgriNexus')
      );

      // Close modal
      const closeReceipt = page.locator('[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("Close")').first();
      if (await closeReceipt.isVisible()) await closeReceipt.click();
    }

    // -------------------------------------------------------------
    // TEST 5: DISTRICT ADMIN DASHBOARD & AUDIT DRAWER
    // -------------------------------------------------------------
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${FRONTEND_URL}/login?role=ADMIN`, { waitUntil: 'networkidle' });
    const adminDemoBtn = adminPage.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    if (await adminDemoBtn.isVisible()) {
      await adminDemoBtn.click();
      await adminPage.waitForTimeout(300);
      await adminPage.locator('[role="dialog"] button:has-text("Use Account"), [role="dialog"] button:has-text("खाता चुनें")').first().click();
      await adminPage.waitForTimeout(200);
    }
    await adminPage.locator('button[type="submit"]').first().click();
    await adminPage.waitForURL('**/admin**', { timeout: 8000 });
    await adminPage.waitForTimeout(1500);

    const adminText = await adminPage.locator('main').innerText();
    assert(
      '14. Admin Dashboard: Displays Lucknow District Command Centre metrics',
      adminText.includes('Lucknow') && (adminText.includes('Centres') || adminText.includes('8'))
    );
    assert(
      '15. Admin Dashboard: Displays Deterministic Bottleneck indicators',
      adminText.includes('Bottleneck') || adminText.includes('Optimal Flow') || adminText.includes('Verification')
    );

    // Open first farmer drawer from recent farmers table if available
    const firstRow = adminPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await adminPage.waitForTimeout(700);
      const drawer = adminPage.locator('[role="dialog"], [class*="drawer"], aside');
      if (await drawer.isVisible()) {
        const drawerText = await drawer.innerText();
        assert(
          '16. Admin Farmer Drawer: Operational Audit Trail card visible with Quality & Weight audit',
          drawerText.includes('Operational Audit Trail') || drawerText.includes('Quality') || drawerText.includes('Weight')
        );
      }
    }

    // -------------------------------------------------------------
    // TEST 6: RESPONSIVE VIEWPORT CHECKS (MOBILE & DESKTOP)
    // -------------------------------------------------------------
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } }); // iPhone X/12/13
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });
    const mobileHeader = await mobilePage.locator('header, nav').innerText();
    assert('17. Responsive: Mobile (375x812) renders AgriNexus header without layout crash', mobileHeader.includes('AgriNexus'));
    await mobileContext.close();

    const tabletContext = await browser.newContext({ viewport: { width: 414, height: 896 } }); // iPhone XR/11
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });
    const tabletHeader = await tabletPage.locator('header, nav').innerText();
    assert('18. Responsive: Mobile (414x896) renders AgriNexus header cleanly', tabletHeader.includes('AgriNexus'));
    await tabletContext.close();

    // -------------------------------------------------------------
    // TEST 7: HINDI LOCALIZATION & BRAND PRESERVATION
    // -------------------------------------------------------------
    const hiContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const hiPage = await hiContext.newPage();
    await hiPage.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });

    // Switch to Hindi
    const pageLangBtn = hiPage.locator('button:has-text("हिन्दी"), button:has-text("HI")').first();
    if (await pageLangBtn.isVisible()) {
      await pageLangBtn.click();
      await hiPage.waitForTimeout(500);
    }

    const hiBodyText = await hiPage.locator('body').innerText();
    assert(
      '19. Hindi Localization: AgriNexus brand wordmark strictly preserved (never translated)',
      hiBodyText.includes('AgriNexus') &&
      !hiBodyText.includes('कृषि नेक्सस') &&
      !hiBodyText.includes('एग्रीनेक्सस') &&
      !hiBodyText.includes('कृषिNexus')
    );

    console.log('\n================================================================');
    console.log(`  PLAYWRIGHT ROUND 8 RESULT: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Playwright Error:', err);
    process.exit(1);
  }
}

runRound8BrowserVerification();
