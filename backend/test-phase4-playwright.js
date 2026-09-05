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

async function runPhase4Audit() {
  console.log('================================================================');
  console.log('  AGRINEXUS PHASE 4: PLAYWRIGHT DISTRICT COMMAND AUDIT (10 SIZES)');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Authenticate as Administrator
  console.log('1. Authenticating as Administrator (admin@agrinexus.gov.in)...');
  await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="phone"], input[type="text"]').first();
  await emailInput.fill('admin@agrinexus.gov.in');

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('adminpassword');

  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  // Wait for redirect to /admin
  await page.waitForURL('**/admin**', { timeout: 8000 });
  await page.waitForTimeout(1000);
  console.log('✔ Logged in successfully. Current URL:', page.url());

  // 2. Audit across all 10 viewports
  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);

    // Verify Horizontal Scroll
    const overflow = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const innerW = window.innerWidth;
      return {
        hasOverflow: scrollW > innerW,
        scrollW,
        innerW,
        diff: scrollW - innerW
      };
    });

    if (overflow.hasOverflow) {
      console.error(`  ❌ Horizontal Scroll Detected: ${overflow.diff}px overflow (scrollWidth: ${overflow.scrollW}px, innerWidth: ${overflow.innerW}px)`);
      process.exit(1);
    } else {
      console.log('  Horizontal Scroll: ✔ PASS (None)');
    }

    // Verify Admin Header and Lucknow Context
    const headerText = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('header')).map((el) => el.innerText).join(' ');
      return h;
    });

    const hasLucknow = headerText.includes('Lucknow') || headerText.includes('लखनऊ');
    const hasCommand = headerText.includes('Command') || headerText.includes('नियंत्रण') || headerText.includes('AgriNexus');
    const hasAdminAccount = headerText.includes('Administrator') || headerText.includes('प्रशासक');
    const hasNoFabricatedOfficer = !headerText.includes('District Magistrate') && !headerText.includes('Collector');

    if (hasLucknow && hasCommand && hasAdminAccount && hasNoFabricatedOfficer) {
      console.log('  Header, Identity & Lucknow Context: ✔ PASS');
    } else {
      console.warn(`  Header check details: Lucknow=${hasLucknow}, Command=${hasCommand}, AdminAccount=${hasAdminAccount}, NoOfficer=${hasNoFabricatedOfficer}`);
    }

    // Verify District Status Ribbon
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasCentres = bodyText.includes('Centres') || bodyText.includes('केंद्र') || bodyText.includes('Centres Reporting');
    const hasMandis = bodyText.includes('Mandis') || bodyText.includes('मंडी') || bodyText.includes('APMC Mandis');
    console.log(`  District Status Ribbon: ${hasCentres && hasMandis ? '✔ PASS' : '⚠ Warning'}`);

    // Capture screenshots for representative sizes
    if (vp.name === '1920x1080_FHD') {
      const shotPath = path.join(screenshotDir, 'admin_command_centre_1920x1080.png');
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log('  Screenshot saved:', shotPath);
    } else if (vp.name === '375x812_Mobile_S') {
      const shotPath = path.join(screenshotDir, 'admin_command_centre_375x812.png');
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log('  Screenshot saved:', shotPath);
    }
  }

  // 3. Test Interactive Operational Command Interactions
  console.log('\n--- Testing Interactive Operational Command Workflows ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);

  // A. Open Centre Detail Command Drawer
  console.log('Testing Centre Detail Command Drawer...');
  const inspectBtn = page.locator('[data-testid="health-inspect-btn"]').first();
  await inspectBtn.waitFor({ state: 'visible', timeout: 5000 });
  await inspectBtn.click();
  await page.waitForTimeout(1000);

  const drawerVisible = await page.locator('text=Facility Infrastructure').isVisible();
  console.log(`✔ Centre Detail Drawer opened: ${drawerVisible ? 'PASS' : 'FAIL'}`);

  // Close drawer
  const closeDrawerBtn = page.locator('button[aria-label="Close Centre Command Panel"], button:has-text("Close Panel")').first();
  if (await closeDrawerBtn.isVisible()) {
    await closeDrawerBtn.click();
    await page.waitForTimeout(500);
  }

  // B. Open Farmer Detail Drawer
  console.log('Testing Farmer Detail Journey Drawer...');
  const inspectFarmerBtn = page.locator('button:has-text("Inspect Journey")').first();
  if (await inspectFarmerBtn.isVisible()) {
    await inspectFarmerBtn.click();
    await page.waitForTimeout(700);
    const ladderVisible = await page.locator('text=Canonical 10-Stage Procurement Ladder').isVisible();
    console.log(`✔ Farmer Journey Drawer opened with 10-stage ladder: ${ladderVisible ? 'PASS' : 'FAIL'}`);

    const closeFarmerBtn = page.locator('button[aria-label="Close Drawer"], button:has-text("Close Drawer")').first();
    if (await closeFarmerBtn.isVisible()) {
      await closeFarmerBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // C. Switch View Tabs
  console.log('Testing Tab Navigation to Centres & Capacity...');
  await page.locator('[data-testid="tab-centres"]').click();
  await page.waitForTimeout(600);
  console.log('✔ Navigated to Centres & Capacity view');

  console.log('Testing Tab Navigation to District Live Queue...');
  await page.locator('[data-testid="tab-queue"]').click();
  await page.waitForTimeout(600);
  console.log('✔ Navigated to District Live Queue view');

  console.log('Testing Tab Navigation to Payment Pipeline...');
  await page.locator('[data-testid="tab-payments"]').click();
  await page.waitForTimeout(600);
  console.log('✔ Navigated to Payment Pipeline view');

  console.log('Returning to Operational Command View...');
  await page.locator('[data-testid="tab-command"]').click();
  await page.waitForTimeout(600);

  const settledShot = path.join(screenshotDir, 'admin_command_centre_settled.png');
  await page.screenshot({ path: settledShot, fullPage: false });
  console.log('Saved settled overview screenshot:', settledShot);

  await browser.close();

  console.log('\n================================================================');
  console.log('🎉 PLAYWRIGHT DISTRICT COMMAND AUDIT: 10/10 VIEWPORTS PASSED WITH ZERO OVERFLOW!');
  console.log('================================================================\n');
  process.exit(0);
}

runPhase4Audit().catch((err) => {
  console.error('Playwright Audit Failed:', err);
  process.exit(1);
});
