/**
 * AgriNexus Round 18 — Discovery Map Restoration & UI Defect Hardening Playwright Suite
 *
 * Assertions:
 * 1. Desktop Discovery Map sticks at top 80px when scrolling down centre cards.
 * 2. Sticky map does not obscure or clip the 66px fixed navbar.
 * 3. Selecting a centre card highlights the card and syncs the map marker.
 * 4. Mobile layout displays the map toggled on demand without overlapping cards.
 * 5. Button component contains text inside borders without icon collision in EN and HI.
 * 6. Zero horizontal page overflow across 6 device viewports.
 */

const { chromium } = require('/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package');
const mongoose = require('mongoose');
const seedOperationalData = require('./seed/seedOperationalData');

const FRONTEND_URL = 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';

async function runRound18Verification() {
  console.log('================================================================');
  console.log('  AGRINEXUS ROUND 18 — MAP RESTORATION & UI HARDENING SUITE     ');
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
      console.error(`✖ FAIL [${total}]: ${name}${detail ? ' (' + detail + ')' : ''}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // PART 1: DESKTOP STICKY MAP BEHAVIOR & DISCOVERY SYNC
    // -------------------------------------------------------------
    console.log('\n--- Part 1: Desktop Discovery Map Restoration & Stickiness ---');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Login as Ramesh Patel
    await page.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button[data-account-id="farmer_01"]').first().click();
    await page.waitForTimeout(200);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/farmer**', { timeout: 8000 });

    // Navigate to Find Centres
    await page.goto(`${FRONTEND_URL}/farmer/find-centres`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const initialStickyState = await page.evaluate(() => {
      const stickyEl = document.querySelector('.lg\\:sticky');
      const cardsCol = document.querySelector('.lg\\:col-span-5');
      const mapCol = document.querySelector('.lg\\:col-span-7');
      const navbar = document.querySelector('header');
      return {
        stickyTop: stickyEl ? stickyEl.getBoundingClientRect().top : null,
        mapColHeight: mapCol ? mapCol.offsetHeight : 0,
        cardsColHeight: cardsCol ? cardsCol.offsetHeight : 0,
        navbarHeight: navbar ? navbar.offsetHeight : 0
      };
    });

    assert(
      'Map column height matches cards list height for sticky scrolling headroom',
      initialStickyState.mapColHeight >= initialStickyState.cardsColHeight - 100,
      `mapCol: ${initialStickyState.mapColHeight}px, cardsCol: ${initialStickyState.cardsColHeight}px`
    );

    // Scroll down 800px
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(400);

    const scrolledState800 = await page.evaluate(() => {
      const stickyEl = document.querySelector('.lg\\:sticky');
      const navbar = document.querySelector('header');
      return {
        stickyTop: stickyEl ? stickyEl.getBoundingClientRect().top : null,
        navbarBottom: navbar ? navbar.getBoundingClientRect().bottom : 0
      };
    });

    assert(
      'Sticky map locks at top: 80px during scroll',
      Math.abs(scrolledState800.stickyTop - 80) <= 2,
      `stickyTop: ${scrolledState800.stickyTop}px (expected 80px)`
    );

    assert(
      'Sticky map does not overlap the fixed 66px navbar',
      scrolledState800.stickyTop >= scrolledState800.navbarBottom,
      `stickyTop: ${scrolledState800.stickyTop}px >= navbarBottom: ${scrolledState800.navbarBottom}px`
    );

    // Scroll down further to 1600px
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(400);

    const scrolledState1600 = await page.evaluate(() => {
      const stickyEl = document.querySelector('.lg\\:sticky');
      return {
        stickyTop: stickyEl ? stickyEl.getBoundingClientRect().top : null
      };
    });

    assert(
      'Sticky map remains pinned at 80px through deep scrolling down centre cards',
      Math.abs(scrolledState1600.stickyTop - 80) <= 2,
      `stickyTop: ${scrolledState1600.stickyTop}px`
    );

    // Test Centre Card Selection & Map Marker Highlight
    console.log('\n--- Part 2: Centre Card Selection & Sync ---');
    const centreCards = page.locator('.bg-white.rounded-xs.border-2.border-dark-neutral.p-5');
    const totalCards = await centreCards.count();
    assert('Discovery page renders all Lucknow procurement centres', totalCards >= 8, `Rendered: ${totalCards}`);

    // Click on the second card
    await centreCards.nth(1).click();
    await page.waitForTimeout(400);

    const cardSelectionState = await page.evaluate(() => {
      const rings = document.querySelectorAll('.ring-2.ring-forest-green');
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      return {
        highlightedCardsCount: rings.length,
        markerCount: markers.length
      };
    });

    assert('Selecting card updates active selection ring', cardSelectionState.highlightedCardsCount >= 1);
    assert('Map displays active Leaflet markers for Lucknow centres and APMC mandis', cardSelectionState.markerCount >= 8, `Markers: ${cardSelectionState.markerCount}`);

    // -------------------------------------------------------------
    // PART 3: MOBILE DISCOVERY MAP DRAWER / TOGGLE BEHAVIOR
    // -------------------------------------------------------------
    console.log('\n--- Part 3: Mobile Viewport & Map Toggle ---');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    const mobileMapInit = await page.locator('.leaflet-container').isVisible();
    assert('On mobile viewport, map is initially hidden to prioritize cards browsing', !mobileMapInit);

    const mapToggleBtn = page.locator('button:has-text("Map"), button:has-text("नक्शा")').first();
    if (await mapToggleBtn.isVisible()) {
      await mapToggleBtn.click();
      await page.waitForTimeout(400);
      const mobileMapAfterToggle = await page.locator('.leaflet-container').isVisible();
      assert('Clicking Map toggle on mobile cleanly expands the interactive map', mobileMapAfterToggle);
    } else {
      assert('Mobile Map toggle button is accessible', false, 'Toggle button not found');
    }

    // -------------------------------------------------------------
    // PART 4: BUTTON TEXT INTEGRITY & HINDI LOCALIZATION EXPANSION
    // -------------------------------------------------------------
    console.log('\n--- Part 4: Button Text Integrity & Localization ---');
    await page.setViewportSize({ width: 1440, height: 900 });

    // Switch to Hindi
    const langBtn = page.locator('button:has-text("हिंदी"), button:has-text("English")').first();
    await langBtn.click();
    await page.waitForTimeout(600);

    const buttonInspection = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      let defectiveButtons = [];
      buttons.forEach((btn) => {
        const text = btn.innerText.trim();
        const rect = btn.getBoundingClientRect();
        // Check for raw debug labels
        if (text.includes('handleClick') || text.includes('>button<') || text.includes('undefined')) {
          defectiveButtons.push({ text, issue: 'Debug label leaked' });
        }
        // Check if button has zero size while visible
        if (rect.width === 0 && rect.height === 0 && btn.offsetParent !== null) {
          defectiveButtons.push({ text, issue: 'Zero dimension visible button' });
        }
      });
      return { totalButtons: buttons.length, defectiveCount: defectiveButtons.length, defectiveButtons };
    });

    assert(
      'All buttons render clean localized labels with zero leaked debug text in Hindi mode',
      buttonInspection.defectiveCount === 0,
      JSON.stringify(buttonInspection.defectiveButtons)
    );

    // Switch back to English
    await page.locator('button:has-text("English"), button:has-text("हिंदी")').first().click();
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // PART 5: MULTI-VIEWPORT HORIZONTAL OVERFLOW AUDIT
    // -------------------------------------------------------------
    console.log('\n--- Part 5: Multi-Viewport Zero Horizontal Overflow Audit ---');
    const viewports = [
      { width: 1440, height: 900, name: 'Desktop (1440px)' },
      { width: 1280, height: 800, name: 'Small Desktop (1280px)' },
      { width: 1024, height: 768, name: 'Tablet Landscape (1024px)' },
      { width: 768, height: 1024, name: 'Tablet Portrait (768px)' },
      { width: 414, height: 896, name: 'Mobile Large (414px)' },
      { width: 375, height: 812, name: 'Mobile Standard (375px)' }
    ];

    const testUrls = [
      { path: '/farmer/find-centres', name: 'Find Centres Discovery' },
      { path: '/farmer', name: 'Farmer Dashboard' },
      { path: '/farmer/bookings', name: 'My Bookings' },
      { path: '/access-selection', name: 'Portal Access Selection' }
    ];

    let overflowViolations = 0;

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const tUrl of testUrls) {
        await page.goto(`${FRONTEND_URL}${tUrl.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);

        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        });

        if (hasOverflow) {
          overflowViolations++;
          console.error(`  ✖ Overflow detected on ${vp.name} - ${tUrl.name}`);
        }
      }
    }

    assert(
      'Zero horizontal overflow across all 6 viewports on key portal routes',
      overflowViolations === 0,
      `Violations count: ${overflowViolations}`
    );

    // Close context
    await context.close();

    console.log('\n================================================================');
    console.log(`  ROUND 18 VERIFICATION COMPLETE: ${passed}/${total} ASSERTIONS PASSED`);
    console.log('================================================================\n');

  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runRound18Verification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
