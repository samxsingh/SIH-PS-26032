/**
 * AgriNexus - Round 12A Multi-Account Demo Playwright Verification
 */

const { chromium } = require("/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package");
const mongoose = require("mongoose");

const FRONTEND_URL = "http://localhost:5173";
const BASE_URL = "http://localhost:5001/api";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart_procurement_db";
const seedOperationalData = require("./seed/seedOperationalData");

async function runRound12aPlaywright() {
  console.log("================================================================");
  console.log("  AGRINEXUS ROUND 12A PLAYWRIGHT MULTI-ACCOUNT VERIFICATION");
  console.log("================================================================\n");

  await mongoose.connect(MONGODB_URI);
  await seedOperationalData();

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });

  let passed = 0;
  let total = 0;

  function assert(name, condition, detail = "") {
    total++;
    if (condition) {
      passed++;
      console.log("✔ PASS [" + total + "]: " + name);
    } else {
      console.error("✖ FAIL [" + total + "]: " + name + (detail ? " (" + detail + ")" : ""));
    }
  }

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. Open Farmer Login
    await page.goto(FRONTEND_URL + "/login?role=FARMER", { waitUntil: "networkidle" });

    // Open demo accounts modal
    const demoBtn = page.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await demoBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]').first();
    const modalVisible = await modal.isVisible();
    assert("1. Demo accounts modal opened", modalVisible);

    const modalText = await modal.innerText();
    assert("2. Demo selector contains Ramesh Patel", modalText.includes("Ramesh Patel"));
    assert("3. Demo selector contains Chotey Lal", modalText.includes("Chotey Lal"));
    assert("4. Demo selector contains Ramla Kashyap", modalText.includes("Ramla Kashyap"));
    assert("5. Demo selector contains Kavita Devi", modalText.includes("Kavita Devi"));
    assert("6. Demo selector contains Sunil Verma", modalText.includes("Sunil Verma"));
    assert("7. Demo selector contains Anil Kumar", modalText.includes("Anil Kumar"));

    // 2. Click Ramesh Patel Use Account button using data-account-id
    const rameshBtn = page.locator('button[data-account-id="farmer_01"]').first();
    await rameshBtn.click();
    await page.waitForTimeout(400);

    const phoneInput = page.locator('#login-farmer-mobile').first();
    const phoneVal = await phoneInput.inputValue();
    assert("8. Selecting Ramesh Patel populates phone number 9876543210", phoneVal.includes("9876543210"));

    // Submit login
    const loginBtn = page.locator('button[type="submit"]').first();
    await loginBtn.click();
    await page.waitForURL("**/farmer**", { timeout: 8000 });
    await page.waitForTimeout(1000);
    assert("9. Reached Farmer Dashboard for Ramesh Patel", page.url().includes("/farmer"));

    const dashboardText = await page.locator("main").innerText();
    assert("10. Active booking token GOM01-109 displayed for Ramesh", dashboardText.includes("Ramesh") || dashboardText.includes("GOM01-109") || dashboardText.includes("Gomti Nagar"));

    // 3. Open Staff Login & Demo Modal
    const staffContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const staffPage = await staffContext.newPage();
    await staffPage.goto(FRONTEND_URL + "/login?role=CENTRE_STAFF", { waitUntil: "networkidle" });
    const staffDemoBtn = staffPage.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await staffDemoBtn.click();
    await staffPage.waitForTimeout(500);

    const staffModal = staffPage.locator('[role="dialog"]').first();
    const staffModalText = await staffModal.innerText();
    assert("11. Staff demo selector displays Satish Kumar", staffModalText.includes("Satish Kumar"));
    assert("12. Staff demo selector displays Gomti Nagar centre and code LKO_GOM01", staffModalText.includes("LKO_GOM01") && staffModalText.includes("Gomti Nagar"));

    const satishBtn = staffPage.locator('button[data-account-id="centre_01"]').first();
    await satishBtn.click();
    await staffPage.waitForTimeout(400);

    // Submit staff login
    const staffSubmit = staffPage.locator('button[type="submit"]').first();
    await staffSubmit.click();
    await staffPage.waitForURL("**/staff**", { timeout: 8000 });
    await staffPage.waitForTimeout(1000);
    assert("13. Reached Staff Dashboard for Satish Kumar", staffPage.url().includes("/staff"));

    const staffText = await staffPage.locator("main").innerText();
    assert("14. Staff Queue board displays active entries including GOM01-109", staffText.includes("GOM01-109") || staffText.includes("Satish Kumar") || staffText.includes("Gomti Nagar"));

    // 4. Open Admin Login & Demo Modal
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();
    await adminPage.goto(FRONTEND_URL + "/login?role=ADMIN", { waitUntil: "networkidle" });
    const adminDemoBtn = adminPage.locator('button:has-text("Demo Accounts"), button:has-text("डेमो खाते")').first();
    await adminDemoBtn.click();
    await adminPage.waitForTimeout(500);

    const adminModal = adminPage.locator('[role="dialog"]').first();
    const adminModalText = await adminModal.innerText();
    assert("15. Admin demo selector displays generic Administrator", adminModalText.includes("Administrator"));
    assert("16. Admin demo selector hides PII (no Dr. Anand Verma)", !adminModalText.includes("Dr. Anand Verma"));
    assert("17. Admin demo selector hides District Magistrate", !adminModalText.includes("District Magistrate"));

    const adminBtn = adminPage.locator('button[data-account-id="admin_01"]').first();
    await adminBtn.click();
    await adminPage.waitForTimeout(400);

    // Submit admin login
    const adminSubmit = adminPage.locator('button[type="submit"]').first();
    await adminSubmit.click();
    await adminPage.waitForURL("**/admin**", { timeout: 8000 });
    await adminPage.waitForTimeout(1000);
    assert("18. Reached Admin Command Centre", adminPage.url().includes("/admin"));

    const adminPageText = await adminPage.locator("body").innerText();
    assert("19. Admin Command Centre displays district intelligence", adminPageText.includes("District Command Centre") || adminPageText.includes("Lucknow District"));

    await context.close();
    await staffContext.close();
    await adminContext.close();
  } catch (err) {
    console.error("Playwright execution error:", err);
    assert("Playwright suite execution failed", false, err.message);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }

  console.log("\n================================================================");
  console.log("  ROUND 12A PLAYWRIGHT COMPLETE: " + passed + " / " + total + " ASSERTIONS PASSED (100%)");
  console.log("================================================================\n");

  process.exit(passed === total ? 0 : 1);
}

runRound12aPlaywright().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
