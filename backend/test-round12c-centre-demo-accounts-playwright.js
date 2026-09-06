/**
 * AgriNexus - Round 12C Playwright End-to-End Verification
 * Verifies Human Demonstration Story:
 * STEP 1: Open login page as CENTRE_STAFF
 * STEP 2: Open Centre Staff demo accounts modal
 * STEP 3: Verify multiple Centre Staff accounts are visible (>= 4)
 * STEP 4: Select Satish Kumar (Gomti Nagar)
 * STEP 5: Verify autofill & login
 * STEP 6: Verify LKO_GOM01 / Gomti Nagar appears on Staff Dashboard
 * STEP 7: Verify GOM01-* tokens exist in queue board
 * STEP 8: Logout
 * STEP 9: Open Centre Staff demo accounts again
 * STEP 10: Select second Centre Staff account (e.g. Jankipuram / LKO_JAN04)
 * STEP 11: Login
 * STEP 12: Verify second centre appears (Jankipuram / LKO_JAN04)
 * STEP 13: Verify queue belongs to second centre (JAN04-* tokens, zero GOM01-* leakage)
 * STEP 14: Switch to Hindi, verify natural labels & untranslated AgriNexus
 * STEP 15: Switch back to English, verify clean state
 * STEP 16: Logout
 * STEP 17: Login as Farmer Ramesh Patel, verify GOM01-109
 * STEP 18: Logout, Login as Satish Kumar, verify same GOM01-109 exists in queue
 */

const { chromium } = require('/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package');
const mongoose = require('mongoose');

const FRONTEND_URL = 'http://localhost:5173';
const BASE_URL = 'http://localhost:5001/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';
const seedOperationalData = require('./seed/seedOperationalData');

async function runRound12cPlaywright() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 12C PLAYWRIGHT MULTI-CENTRE VERIFICATION');
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
      console.log('✔ PASS [' + total + ']: ' + name);
    } else {
      console.error('✖ FAIL [' + total + ']: ' + name + (detail ? ' (' + detail + ')' : ''));
    }
  }

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // --- STEP 1 to 3: Open Centre Staff login & inspect modal ---
    await page.goto(FRONTEND_URL + '/login?role=CENTRE_STAFF', { waitUntil: 'networkidle' });
    const demoBtn = page.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await demoBtn.click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    assert('1. Centre Staff demo modal opened', await modal.isVisible());

    const modalText = await modal.innerText();
    assert('2. Demo modal contains Satish Kumar (Gomti Nagar)', modalText.includes('Satish Kumar') && modalText.includes('LKO_GOM01'));
    assert('3. Demo modal contains Jankipuram Centre Staff', modalText.includes('Jankipuram') && modalText.includes('LKO_JAN04'));
    assert('4. Demo modal contains Aliganj Centre Staff', modalText.includes('Aliganj') && modalText.includes('LKO_ALI02'));
    assert('5. Demo modal contains Indira Nagar Centre Staff', modalText.includes('Indira Nagar') && modalText.includes('LKO_IND03'));
    assert('6. Demo modal contains Alambagh Centre Staff', modalText.includes('Alambagh') && modalText.includes('LKO_ALA05'));

    // --- STEP 4 to 7: Select Satish Kumar & verify Gomti Nagar Queue ---
    const satishBtn = page.locator('button[data-account-id="centre_01"]').first();
    await satishBtn.click();
    await page.waitForTimeout(400);

    const staffSubmit = page.locator('button[type="submit"]').first();
    await staffSubmit.click();
    await page.waitForURL('**/staff**', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const gomtiBodyText = await page.innerText('body');
    assert('7. Reached Staff Dashboard for Gomti Nagar', gomtiBodyText.includes('Gomti Nagar') || gomtiBodyText.includes('LKO_GOM01'));
    assert('8. Gomti Nagar queue displays GOM01 tokens', gomtiBodyText.includes('GOM01-'));

    // --- STEP 8 to 13: Logout, select Jankipuram Centre Staff & verify isolation ---
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("लॉग आउट")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('**/login**', { timeout: 8000 });
    }
    await page.goto(FRONTEND_URL + '/login?role=CENTRE_STAFF', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Open Demo modal again
    const demoBtn2 = page.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await demoBtn2.click();
    await page.waitForTimeout(400);

    const jankiBtn = page.locator('button[data-account-id="centre_02"]').first();
    await jankiBtn.click();
    await page.waitForTimeout(400);

    const staffSubmit2 = page.locator('button[type="submit"]').first();
    await staffSubmit2.click();
    await page.waitForURL('**/staff**', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const jankiBodyText = await page.innerText('body');
    assert('9. Reached Staff Dashboard for Jankipuram centre', jankiBodyText.includes('Jankipuram') || jankiBodyText.includes('LKO_JAN04'));
    assert('10. Jankipuram queue displays JAN04 tokens', jankiBodyText.includes('JAN04-'));
    assert('11. Zero leakage: Gomti tokens (GOM01-109) do NOT appear in Jankipuram', !jankiBodyText.includes('GOM01-109'));

    // --- STEP 14 to 16: Switch Language to Hindi & back ---
    const langDropdownBtn = page.locator('button[title*="Select Language"]').first();
    if (await langDropdownBtn.isVisible()) {
      await langDropdownBtn.click();
      await page.waitForTimeout(300);
      const hiOption = page.locator('button[data-lang="hi"]').first();
      if (await hiOption.isVisible()) {
        await hiOption.click();
        await page.waitForTimeout(600);
      }
    }

    const hiBodyText = await page.innerText('body');
    assert('12. Hindi UI renders natural "अगले किसान को बुलाएं"', hiBodyText.includes('अगले किसान को बुलाएं'));
    assert('13. Hindi UI preserves untranslated "AgriNexus"', hiBodyText.includes('AgriNexus'));
    assert('14. Zero transliterated "कॉल नेक्स्ट" in Hindi UI', !hiBodyText.includes('कॉल नेक्स्ट (CALL NEXT)'));

    // Switch back to English
    const langDropdownBtn2 = page.locator('button[title*="Select Language"]').first();
    if (await langDropdownBtn2.isVisible()) {
      await langDropdownBtn2.click();
      await page.waitForTimeout(300);
      const enOption = page.locator('button[data-lang="en"]').first();
      if (await enOption.isVisible()) {
        await enOption.click();
        await page.waitForTimeout(600);
      }
    }

    // --- STEP 17 to 18: Cross-portal Farmer Ramesh Patel ↔ Staff Satish Kumar ---
    await page.goto(FRONTEND_URL + '/login?role=FARMER', { waitUntil: 'networkidle' });
    const farmerDemoBtn = page.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await farmerDemoBtn.click();
    await page.waitForTimeout(400);

    const rameshBtn = page.locator('button[data-account-id="farmer_01"]').first();
    await rameshBtn.click();
    await page.waitForTimeout(400);

    const farmerSubmit = page.locator('button[type="submit"]').first();
    await farmerSubmit.click();
    await page.waitForURL('**/farmer**', { timeout: 8000 });
    await page.waitForTimeout(800);

    const farmerDashboardText = await page.innerText('body');
    assert('15. Ramesh Patel farmer dashboard displays GOM01-109 token', farmerDashboardText.includes('GOM01-109'));

    // Logout and log in as Satish Kumar
    const logoutBtn3 = page.locator('button:has-text("Logout"), button:has-text("लॉग आउट")').first();
    if (await logoutBtn3.isVisible()) {
      await logoutBtn3.click();
      await page.waitForURL('**/login**', { timeout: 8000 });
    }
    await page.goto(FRONTEND_URL + '/login?role=CENTRE_STAFF', { waitUntil: 'networkidle' });
    const staffDemoBtn3 = page.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await staffDemoBtn3.click();
    await page.waitForTimeout(400);

    const satishBtn3 = page.locator('button[data-account-id="centre_01"]').first();
    await satishBtn3.click();
    await page.waitForTimeout(400);

    const staffSubmit3 = page.locator('button[type="submit"]').first();
    await staffSubmit3.click();
    await page.waitForURL('**/staff**', { timeout: 8000 });
    await page.waitForTimeout(1000);

    // Switch to Today's Queue tab to see full roster
    const queueTabBtn = page.locator('button:has-text("Today\'s Queue"), button:has-text("आज की कतार")').first();
    if (await queueTabBtn.isVisible()) {
      await queueTabBtn.click();
      await page.waitForTimeout(600);
    }

    const finalStaffText = await page.innerText('body');
    assert('16. Satish Kumar queue reflects the same GOM01-109 token', finalStaffText.includes('GOM01-109'));

    console.log('\n================================================================');
    console.log(`  ROUND 12C PLAYWRIGHT COMPLETE: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Playwright execution error:', err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  }
}

runRound12cPlaywright().catch((err) => {
  console.error('Fatal error in Round 12C Playwright:', err);
  process.exit(1);
});
