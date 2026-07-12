import { test, expect } from "@playwright/test";

test.describe("Course checkout flow", () => {
  test("homepage shows courses section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#courses")).toBeVisible();
    await expect(page.locator("text=دوره‌های محبوب")).toBeVisible();
  });

  test("course cards are visible", async ({ page }) => {
    await page.goto("/");
    const courseCards = page.locator('[id="courses"] a[href^="/courses/"]');
    await expect(courseCards.first()).toBeVisible({ timeout: 5000 });
  });

  test("course detail page loads", async ({ page }) => {
    await page.goto("/courses/fundamentals");
    await expect(page.locator("h1")).toContainText("مبانی فن بیان");
    await expect(page.locator("text=ثبت‌نام")).toBeVisible();
  });

  test("course search filters results", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.locator('input[placeholder="جستجوی دوره..."]');
    await searchInput.fill("صدا");
    await page.waitForTimeout(300);
    // Should show voice training course
    await expect(page.locator("text=آواسازی")).toBeVisible();
  });

  test("protected dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 5000 });
  });

  test("static pages load correctly", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toContainText("بصیر نو");

    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText("تماس با ما");

    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText("شرایط و قوانین");

    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText("حریم خصوصی");
  });
});
