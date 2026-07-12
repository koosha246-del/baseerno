import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("بصیر نو");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@test.com");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=ایمیل یا رمز عبور اشتباه")).toBeVisible({
      timeout: 10000,
    });
  });

  test("login with demo account and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "student@baseerno.ir");
    await page.fill('input[type="password"]', "123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page.locator("text=داشبورد")).toBeVisible();
  });

  test("register page loads correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1")).toContainText("بصیر نو");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("forgot password page loads correctly", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("h1")).toContainText("بازیابی رمز عبور");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
