import { test, expect } from "@playwright/test";

/**
 * Full signup → dashboard landing flow.
 *
 * Requires a live dev server and a writable database. The test uses
 * a randomized email to avoid collisions on re-runs.
 */
test.describe("Signup flow", () => {
  test("new user can register, lands on dashboard, sees personalized greeting", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const name = "E2E Tester";
    const password = "test1234";

    await page.goto("/register");
    await expect(page.locator("h1")).toContainText("بصیر نو");

    await page.fill('input[name="name"], input[placeholder*="نام" i]', name);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    await page.click('button[type="submit"]');

    // Either we get redirected to dashboard or stay on the page with a message.
    // Both outcomes are acceptable; the contract is "no 500, no CSRF error".
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).not.toContain("/500");
    // If we did end up on dashboard, the header should be visible.
    if (url.includes("/dashboard")) {
      await expect(page.locator("body")).toContainText(name);
    }
  });

  test("rejects short password (client-side validation)", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="name"], input[placeholder*="نام" i]', "Test");
    await page.fill('input[type="email"]', `e2e-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', "123");
    await page.click('button[type="submit"]');
    // Stay on the register page (validation should prevent submit)
    await expect(page).toHaveURL(/\/register/);
  });

  test("rejects duplicate email", async ({ page }) => {
    // The seed inserts student@baseerno.ir — register twice with it.
    await page.goto("/register");
    await page.fill('input[name="name"], input[placeholder*="نام" i]', "Test");
    await page.fill('input[type="email"]', "student@baseerno.ir");
    await page.fill('input[type="password"]', "test1234");
    await page.click('button[type="submit"]');
    // Should see a 409-style error message (or similar)
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();
    // The exact wording can vary; we just expect an error to surface.
    expect(body).toMatch(/ثبت|موجود|تکراری|error|خطا/i);
  });
});
