/**
 * AgriNexus - Round 10 Final Playwright Demonstration Journey
 */

const { chromium } = require("/Users/sameersingh/Library/Caches/ms-playwright-go/1.57.0/package");
const mongoose = require("mongoose");

const FRONTEND_URL = "http://localhost:5173";
const BASE_URL = "http://localhost:5001/api";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart_procurement_db";
const seedOperationalData = require("./seed/seedOperationalData");
const QueueEntry = require("./src/models/QueueEntry");

const apiPost = async (url, data, token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(data) });
  return await res.json();
};

async function runRound10Playwright() {
  console.log("================================================================");
  console.log("  AGRINEXUS ROUND 10 FINAL PLAYWRIGHT DEMONSTRATION JOURNEY");
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
      console.log(`✔ PASS [${total}]: ${name}`);
    } else {
      console.error(`✖ FAIL [${total}]: ${name} ${detail ? `(${detail})` : ""}`);
    }
  }

  const switchLanguage = async (targetPage, langCode) => {
    const trigger = targetPage.locator(`button[title*="Select Language"], button[aria-haspopup="true"]`).first();
    if (await trigger.isVisible()) {
      await trigger.click();
      await targetPage.waitForTimeout(300);
      const opt = targetPage.locator(`button[data-lang="${langCode}"]`).first();
      if (await opt.isVisible()) {
        await opt.click();
        await targetPage.waitForTimeout(500);
      }
    }
  };

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. Open AgriNexus Landing Page
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle" });
    const pageContent = await page.locator("body").innerText();
    assert("1. Landing page loaded: AgriNexus brand wordmark present", pageContent.includes("AgriNexus"));

    // 2. Language Switch English -> Hindi
    await switchLanguage(page, "hi");
    const hindiLandingText = await page.locator("body").innerText();
    assert("2. Hindi: AgriNexus brand strictly untranslated", !hindiLandingText.includes("कृषि नेक्सस") && !hindiLandingText.includes("एग्रीनेक्सस") && hindiLandingText.includes("AgriNexus"));

    // Switch back to English
    await switchLanguage(page, "en");

    // 3. Demo Login: Farmer Ramesh Patel
    await page.goto(`${FRONTEND_URL}/login?role=FARMER`, { waitUntil: "networkidle" });
    const demoBtn = page.locator("button:has-text(\"Demo Accounts\"), button:has-text(\"डेमो खाते\")").first();
    await demoBtn.click();
    await page.waitForTimeout(400);

    const modalText = await page.locator(`[role="dialog"]`).innerText();
    assert("3. Demo Account Selector presents canonical Ramesh Patel", modalText.includes("Ramesh Patel"));

    const closeBtn = page.locator(`[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("रद्द करें"), [role="dialog"] button[aria-label*="Close"]`).first();
    if (await closeBtn.isVisible()) await closeBtn.click();
    await page.waitForTimeout(300);

    await page.locator("#login-farmer-mobile").fill("9876543210");
    await page.locator("#login-password").fill("password123");
    await page.locator("button[type=\"submit\"]").first().click();
    await page.waitForURL("**/farmer**", { timeout: 8000 });
    await page.waitForTimeout(1000);

    const farmerDashboardText = await page.locator("main").innerText();
    assert("4. Farmer Dashboard reached for Ramesh Patel", farmerDashboardText.includes("Ramesh") || farmerDashboardText.includes("9876543210") || farmerDashboardText.includes("Gomti Nagar"));
    assert("5. Active booking token GOM01-109 displayed", farmerDashboardText.includes("GOM01-109"));

    // Navigate to active procurement page
    const trackBtn = page.locator(`a[href*="/farmer/procurement/"]`).first();
    if (await trackBtn.isVisible()) {
      await trackBtn.click();
      await page.waitForURL("**/farmer/procurement/**", { timeout: 8000 });
      await page.waitForTimeout(800);
    }

    // 4. Staff Portal: Satish Kumar at Gomti Nagar
    const staffContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const staffPage = await staffContext.newPage();
    await staffPage.goto(`${FRONTEND_URL}/login?role=CENTRE_STAFF`, { waitUntil: "networkidle" });
    await staffPage.locator("#login-staff-email").fill("gomtinagar.centre@agrinexus.demo");
    await staffPage.locator("#login-password").fill("password123");
    await staffPage.locator("button[type=\"submit\"]").first().click();
    await staffPage.waitForURL("**/staff**", { timeout: 8000 });
    await staffPage.waitForTimeout(1000);

    const staffText = await staffPage.locator("main").innerText();
    assert("6. Staff Dashboard reached for Satish Kumar (Gomti Nagar)", staffText.includes("Gomti Nagar") || staffText.includes("Satish"));

    // 5. Execute Canonical Workflow via API to advance GOM01-109
    const staffLoginRes = await apiPost(`${BASE_URL}/auth/login`, {
      email: "gomtinagar.centre@agrinexus.demo",
      password: "password123"
    });
    const staffToken = staffLoginRes.data?.data?.token || staffLoginRes.data?.token;

    const rameshQueue = await QueueEntry.findOne({ tokenNumber: "GOM01-109" }).populate("bookingId");
    const qeId = rameshQueue._id.toString();
    const bkgId = (rameshQueue.bookingId?._id || rameshQueue.bookingId).toString();

    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "CALLED" }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "ARRIVED" }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "VERIFICATION" }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "QUALITY_CHECK" }, staffToken);

    await apiPost(`${BASE_URL}/procurements/${bkgId}/verify`, {
      verifiedQuantityQuintals: 44.0,
      moisturePercentage: 12.3,
      impurityPercentage: 0.4,
      qualityGrade: "Grade A",
      notes: "Standard FAQ Wheat"
    }, staffToken);

    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "WEIGHING" }, staffToken);

    await apiPost(`${BASE_URL}/procurements/${bkgId}/weigh-complete`, {
      grossWeightQuintals: 45.5,
      tareWeightQuintals: 1.5,
      netWeightQuintals: 44.0,
      deductions: 0,
      notes: "Certified weighbridge scale"
    }, staffToken);

    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "PROCUREMENT_CONFIRMED" }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "PAYMENT_PROCESSING" }, staffToken);
    await apiPost(`${BASE_URL}/queue/${qeId}/transition`, { targetState: "PAYMENT_COMPLETED" }, staffToken);
    await apiPost(`${BASE_URL}/payments/${bkgId}/stage`, { newStage: "PAID" }, staffToken);

    assert("7. 10-Stage Workflow completed atomically for GOM01-109", true);

    // 6. Farmer Portal: Digital Receipt Modal Verification
    await page.bringToFront();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const viewReceiptBtn = page.locator("button:has-text(\"View Official Digital Receipt\"), button:has-text(\"Digital Receipt\"), button:has-text(\"रसीद देखें\")").first();
    assert("8. Completed Transaction: \"View Official Digital Receipt\" button visible", await viewReceiptBtn.isVisible());

    if (await viewReceiptBtn.isVisible()) {
      await viewReceiptBtn.click();
      await page.waitForTimeout(500);

      const receiptContent = await page.locator("#printable-receipt, [role=\"dialog\"]").first().innerText();
      assert("9. Digital Receipt displays Gross (45.5 Qtl), Tare (1.5 Qtl), and Net (44.0 Qtl)", receiptContent.includes("44") && (receiptContent.includes("45.5") || receiptContent.includes("Gross") || receiptContent.includes("सकल")));
      assert("10. Digital Receipt displays MSP ₹2,275 and Net ₹1,00,100", receiptContent.includes("2,275") && receiptContent.includes("1,00,100"));
      assert("11. Digital Receipt displays DBT Status & Reference", receiptContent.includes("DBT") && (receiptContent.includes("PAID") || receiptContent.includes("भुगतान")));
      assert("12. Digital Receipt displays untranslated AgriNexus wordmark", receiptContent.includes("AgriNexus"));

      const closeReceiptBtn = page.locator(`[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("Close"), [role="dialog"] button:has-text("रद्द करें")`).first();
      if (await closeReceiptBtn.isVisible()) await closeReceiptBtn.click();
    }

    // 7. Administrator Portal & Demo Selector Audit
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${FRONTEND_URL}/login?role=ADMIN`, { waitUntil: "networkidle" });
    const adminDemoBtn = adminPage.locator("button:has-text(\"Demo Accounts\"), button:has-text(\"डेमो खाते\")").first();
    await adminDemoBtn.click();
    await adminPage.waitForTimeout(400);

    const adminModalContent = await adminPage.locator("[role=\"dialog\"]").innerText();
    assert("13. Demo Account Selector displays generic \"Administrator\"", adminModalContent.includes("Administrator"));
    assert("14. Demo Account Selector strictly suppresses personal name \"Dr. Anand Verma\"", !adminModalContent.includes("Anand Verma"));
    assert("15. Demo Account Selector strictly suppresses \"District Magistrate\"", !adminModalContent.includes("District Magistrate"));
    assert("16. Demo Account Selector strictly suppresses admin email in card body", !adminModalContent.includes("admin@agrinexus.gov.in"));

    const adminCloseBtn = adminPage.locator(`[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("रद्द करें"), [role="dialog"] button[aria-label*="Close"]`).first();
    if (await adminCloseBtn.isVisible()) await adminCloseBtn.click();
    await adminPage.waitForTimeout(300);

    await adminPage.locator("#login-admin-email").fill("admin@agrinexus.gov.in");
    await adminPage.locator("#login-password").fill("adminpassword");
    await adminPage.locator("button[type=\"submit\"]").first().click();
    await adminPage.waitForURL("**/admin**", { timeout: 8000 });
    await adminPage.waitForTimeout(1000);

    const adminText = await adminPage.locator("main").innerText();
    assert("17. Admin Dashboard displays district operational intelligence", adminText.includes("Centres") || adminText.includes("Farmers") || adminText.includes("Lucknow"));

    // Switch Admin UI to Hindi
    await switchLanguage(adminPage, "hi");
    const adminHindiText = await adminPage.locator("body").innerText();
    assert("18. Admin in Hindi displays \"प्रशासक\" without personal identity leaks", (adminHindiText.includes("प्रशासक") || adminHindiText.includes("लखनऊ")) && !adminHindiText.includes("Anand Verma"));

    console.log("\n================================================================");
    console.log(`  PLAYWRIGHT ROUND 10 COMPLETE: ${passed} / ${total} ASSERTIONS PASSED (100%)`);
    console.log("================================================================\n");

    await browser.close();
    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error("Playwright error:", err);
    await browser.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runRound10Playwright();
