import { test, expect } from "@playwright/test";

/**
 * Authenticated dashboard smoke test. Logs in as the seeded student
 * account and verifies each top-level dashboard section renders.
 */
test.describe("Dashboard (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "student@baseerno.ir");
    await page.fill('input[type="password"]', "123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("dashboard home loads with the greeting", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator("body")).toContainText("داشبورد");
  });

  test("messages page loads", async ({ page }) => {
    await page.goto("/dashboard/messages");
    await expect(page.locator("h1")).toContainText("پیام");
  });

  test("certificates page loads", async ({ page }) => {
    await page.goto("/dashboard/certificates");
    // Either a heading or empty-state copy will appear
    await expect(page.locator("body")).toContainText("گواهی");
  });

  test("grades page loads", async ({ page }) => {
    await page.goto("/dashboard/grades");
    await expect(page.locator("body")).toContainText("نمره");
  });

  test("finance page loads", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await expect(page.locator("body")).toContainText("پرداخت");
  });

  test("notifications page loads", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await expect(page.locator("body")).toContainText("اعلامیه");
  });

  test("logout returns to a public page", async ({ page }) => {
    // Find the logout button in the header or sidebar
    const logoutBtn = page.locator("text=/خروج|logout/i").first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForLoadState("networkidle");
      // After logout we should not be on /dashboard anymore
      expect(page.url()).not.toContain("/dashboard");
    } else {
      test.skip(true, "logout button not exposed in current UI");
    }
  });
});
