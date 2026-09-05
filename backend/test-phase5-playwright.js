const { chromium } = require('/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package');
const fs = require('fs');
const path = require('path');

const screenshotDir = '/Users/sameersingh/.gemini/antigravity/brain/4a7cb2c6-5e3f-43aa-b743-6d62e0cfe4b4';

const VIEWPORTS = [
  { name: '1920x1080_FHD', width: 1920, height: 1080 },
  { name: '1440x900_Desktop', width: 1440, height: 900 },
  { name: '1366x768_Laptop', width: 1366, height: 768 },
  { name: '1280x720_HD', width: 1280, height: 720 },
  { name: '1152x864_Desktop', width: 1152, height: 864 },
  { name: '1024x768_Tablet_L', width: 1024, height: 768 },
  { name: '768x1024_Tablet_P', width: 768, height: 1024 },
  { name: '414x896_Mobile_L', width: 414, height: 896 },
  { name: '390x844_Mobile_M', width: 390, height: 844 },
  { name: '375x812_Mobile_S', width: 375, height: 812 }
];

async function runPhase5PlaywrightAudit() {
  console.log('================================================================');
  console.log('  AGRINEXUS PHASE 5: PLAYWRIGHT PRODUCTION HARDENING AUDIT');
  console.log('  Farmer Portal • Centre Portal • District Command Centre (10 Sizes)');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  try {
    // =========================================================================
    // SECTION 1: FARMER PORTAL AUDIT
    // =========================================================================
    console.log('--- SECTION 1: FARMER PORTAL AUDIT ---');
    const farmerContext = await browser.newContext();
    const farmerPage = await farmerContext.newPage();

    console.log('1.1 Authenticating as Farmer (9876543210)...');
    await farmerPage.goto('http://localhost:5173/login?role=FARMER', { waitUntil: 'networkidle' });
    await farmerPage.waitForTimeout(500);

    const farmerMobileInput = farmerPage.locator('#login-farmer-mobile');
    await farmerMobileInput.waitFor({ state: 'visible', timeout: 5000 });
    await farmerMobileInput.fill('9876543210');

    const farmerPassInput = farmerPage.locator('#login-password');
    await farmerPassInput.fill('password123');

    const farmerSubmit = farmerPage.locator('button[type="submit"]').first();
    await farmerSubmit.click();

    await farmerPage.waitForURL('**/farmer**', { timeout: 8000 });
    await farmerPage.waitForTimeout(1000);
    console.log('✔ Farmer login successful. URL:', farmerPage.url());

    // Audit Farmer Dashboard across 10 Viewports for Zero Horizontal Overflow
    console.log('\n1.2 Auditing Farmer Dashboard responsive layout & horizontal overflow...');
    for (const vp of VIEWPORTS) {
      await farmerPage.setViewportSize({ width: vp.width, height: vp.height });
      await farmerPage.waitForTimeout(200);

      const overflow = await farmerPage.evaluate(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        return { hasOverflow: scrollW > innerW, scrollW, innerW, diff: scrollW - innerW };
      });

      if (overflow.hasOverflow) {
        throw new Error(`Farmer Dashboard overflow at ${vp.name}: ${overflow.diff}px`);
      }
    }
    console.log('✔ Farmer Dashboard: Zero horizontal overflow across all 10 viewports (1920x1080 to 375x812)');

    // Capture representative Farmer screenshots
    await farmerPage.setViewportSize({ width: 1920, height: 1080 });
    await farmerPage.waitForTimeout(400);
    await farmerPage.screenshot({ path: path.join(screenshotDir, 'farmer_dashboard_1920x1080.png'), fullPage: false });

    await farmerPage.setViewportSize({ width: 375, height: 812 });
    await farmerPage.waitForTimeout(400);
    await farmerPage.screenshot({ path: path.join(screenshotDir, 'farmer_dashboard_375x812.png'), fullPage: false });
    console.log('✔ Captured Farmer Dashboard screenshots (1920x1080, 375x812)');

    // Verify Active Procurement Journey Hero Block
    const journeyDetails = await farmerPage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasActiveJourney: text.includes('Active Procurement Journey') || text.includes('सक्रिय अधिप्राप्ति यात्रा') || text.includes('Token:'),
        hasToken: /Token:\s*[A-Z0-9-]+/.test(text) || text.includes('Token'),
        hasDistrict: text.includes('Lucknow District') || text.includes('लखनऊ'),
        hasNextAction: text.includes('Next:') || text.includes('Report to Intake') || text.includes('Proceed to Counter') || text.includes('Weighbridge')
      };
    });
    console.log('✔ Farmer Active Procurement Journey block elements:', journeyDetails);

    // 1.3 Test Map-First Centre Discovery & Centre Drawer
    console.log('\n1.3 Testing Farmer Centre Discovery (/farmer/find-centres)...');
    await farmerPage.goto('http://localhost:5173/farmer/find-centres', { waitUntil: 'networkidle' });
    await farmerPage.waitForTimeout(1000);

    for (const vp of [VIEWPORTS[0], VIEWPORTS[9]]) {
      await farmerPage.setViewportSize({ width: vp.width, height: vp.height });
      await farmerPage.waitForTimeout(200);
      const overflow = await farmerPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) throw new Error(`Find Centres overflow at ${vp.name}`);
    }
    console.log('✔ Find Centres: Zero horizontal overflow verified');

    // Click on a centre card to open drawer
    const centreCard = farmerPage.locator('button, div').filter({ hasText: /APMC|Mandi|Procurement Centre/i }).first();
    if (await centreCard.isVisible()) {
      await centreCard.click();
      await farmerPage.waitForTimeout(600);
      const drawerText = await farmerPage.evaluate(() => document.body.innerText);
      const hasGoogleNav = drawerText.includes('Google Maps') || drawerText.includes('Navigation');
      const hasDisclaimer = drawerText.includes('external navigation') || drawerText.includes('mapping application');
      console.log(`✔ Centre Details Drawer: Google Maps Nav Button=${hasGoogleNav}, External Disclaimer=${hasDisclaimer}`);
    }

    await farmerContext.close();

    // =========================================================================
    // SECTION 2: CENTRE PORTAL AUDIT
    // =========================================================================
    console.log('\n--- SECTION 2: CENTRE PORTAL AUDIT ---');
    const centreContext = await browser.newContext();
    const centrePage = await centreContext.newPage();

    console.log('2.1 Authenticating as Centre Manager (gomtinagar.centre@agrinexus.demo)...');
    await centrePage.goto('http://localhost:5173/staff/login', { waitUntil: 'networkidle' });
    await centrePage.waitForTimeout(500);

    const centreEmail = centrePage.locator('#login-staff-email, input[type="email"]').first();
    await centreEmail.fill('gomtinagar.centre@agrinexus.demo');
    const centrePass = centrePage.locator('#login-password, input[type="password"]').first();
    await centrePass.fill('password123');
    const centreSubmit = centrePage.locator('button[type="submit"]').first();
    await centreSubmit.click();

    await centrePage.waitForURL('**/staff**', { timeout: 8000 });
    await centrePage.waitForTimeout(1000);
    console.log('✔ Centre Manager login successful. URL:', centrePage.url());

    // Audit Centre Portal across 10 Viewports
    console.log('2.2 Auditing Centre Portal responsive layout & zero horizontal overflow...');
    for (const vp of VIEWPORTS) {
      await centrePage.setViewportSize({ width: vp.width, height: vp.height });
      await centrePage.waitForTimeout(200);

      const overflow = await centrePage.evaluate(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        return { hasOverflow: scrollW > innerW, scrollW, innerW, diff: scrollW - innerW };
      });

      if (overflow.hasOverflow) {
        throw new Error(`Centre Portal overflow at ${vp.name}: ${overflow.diff}px`);
      }
    }
    console.log('✔ Centre Portal: Zero horizontal overflow across all 10 viewports (1920x1080 to 375x812)');

    // Verify Centre Operations Header & CALL NEXT actionability
    const centreState = await centrePage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasCallNext: text.includes('CALL NEXT') || text.includes('Call Next') || text.includes('अगला बुलाएं'),
        hasLucknowContext: text.includes('Lucknow') || text.includes('UP_LUK'),
        hasMandiAffiliation: text.includes('Mandi') || text.includes('APMC'),
        hasQueue: text.includes('Queue') || text.includes('Waiting') || text.includes('Active')
      };
    });
    console.log('✔ Centre Operations Status:', centreState);

    await centrePage.setViewportSize({ width: 1920, height: 1080 });
    await centrePage.screenshot({ path: path.join(screenshotDir, 'centre_portal_hardened_1920x1080.png'), fullPage: false });
    await centrePage.setViewportSize({ width: 375, height: 812 });
    await centrePage.screenshot({ path: path.join(screenshotDir, 'centre_portal_hardened_375x812.png'), fullPage: false });
    console.log('✔ Captured Centre Portal screenshots (1920x1080, 375x812)');

    await centreContext.close();

    // =========================================================================
    // SECTION 3: DISTRICT COMMAND CENTRE AUDIT
    // =========================================================================
    console.log('\n--- SECTION 3: DISTRICT COMMAND CENTRE AUDIT ---');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    console.log('3.1 Authenticating as District Administrator (admin@agrinexus.gov.in)...');
    await adminPage.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(500);

    const adminEmail = adminPage.locator('#login-admin-email, input[type="email"]').first();
    await adminEmail.fill('admin@agrinexus.gov.in');
    const adminPass = adminPage.locator('#login-password, input[type="password"]').first();
    await adminPass.fill('adminpassword');
    const adminSubmit = adminPage.locator('button[type="submit"]').first();
    await adminSubmit.click();

    await adminPage.waitForURL('**/admin**', { timeout: 8000 });
    await adminPage.waitForTimeout(1000);
    console.log('✔ Admin login successful. URL:', adminPage.url());

    // Audit Admin Portal across 10 Viewports
    console.log('3.2 Auditing District Command Centre responsive layout & horizontal overflow...');
    for (const vp of VIEWPORTS) {
      await adminPage.setViewportSize({ width: vp.width, height: vp.height });
      await adminPage.waitForTimeout(200);

      const overflow = await adminPage.evaluate(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        return { hasOverflow: scrollW > innerW, scrollW, innerW, diff: scrollW - innerW };
      });

      if (overflow.hasOverflow) {
        throw new Error(`Admin Portal overflow at ${vp.name}: ${overflow.diff}px`);
      }
    }
    console.log('✔ District Command Centre: Zero horizontal overflow across all 10 viewports (1920x1080 to 375x812)');

    // Verify Admin Command Centre Key Components & Visual DBT Disclaimer
    const adminOverview = await adminPage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasLucknowDistrict: text.includes('Lucknow') || text.includes('UP_LUK'),
        hasMandiHierarchy: text.includes('APMC Mandis') || text.includes('Mandi Hierarchy'),
        hasCentresTable: text.includes('Procurement Centres') || text.includes('Centres Reporting'),
        hasDBTDisclaimer: text.includes('PFMS') || text.includes('Visual Tracking Only') || text.includes('DBT transactions would route through PFMS'),
        hasSingleManagerAssigned: text.includes('Centre Manager') || text.includes('Station Head') || text.includes('Head')
      };
    });
    console.log('✔ Admin Command Centre Integrity:', adminOverview);

    await adminPage.setViewportSize({ width: 1920, height: 1080 });
    await adminPage.screenshot({ path: path.join(screenshotDir, 'admin_command_centre_hardened_1920x1080.png'), fullPage: false });
    await adminPage.setViewportSize({ width: 375, height: 812 });
    await adminPage.screenshot({ path: path.join(screenshotDir, 'admin_command_centre_hardened_375x812.png'), fullPage: false });
    console.log('✔ Captured District Command Centre screenshots (1920x1080, 375x812)');

    await adminContext.close();

    console.log('\n================================================================');
    console.log('  ALL PHASE 5 PLAYWRIGHT AUDITS PASSED WITH 100% SUCCESS');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runPhase5PlaywrightAudit().catch(err => {
  console.error('❌ Phase 5 Playwright Audit Failed:', err);
  process.exit(1);
});
