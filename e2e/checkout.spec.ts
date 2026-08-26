import { test, expect } from "@playwright/test";

test.describe("Course checkout flow", () => {
  test("homepage shows courses section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#courses")).toBeVisible();
    // New landing: age-groups section (id="courses") carries the courses copy.
    await expect(page.locator("#courses-title")).toBeVisible();
  });

  test("course cards are listed on the catalog page", async ({ page }) => {
    await page.goto("/courses");
    const courseCards = page.locator('a[href^="/courses/"]');
    await expect(courseCards.first()).toBeVisible({ timeout: 5000 });
  });

  test("course detail page loads", async ({ page }) => {
    await page.goto("/courses/fundamentals");
    await expect(page.locator("h1")).toContainText("مبانی فن بیان");
    await expect(page.locator("text=ثبت‌نام")).toBeVisible();
  });

  test("header search finds a course from the landing page", async ({ page }) => {
    await page.goto("/");
    // PublicSearch lives in the desktop header (hidden below lg).
    await page.getByRole("button", { name: "جستجو" }).click();
    const searchInput = page.locator('input[placeholder="جستجوی دوره..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("صدا");
    // Debounced public autocomplete → result link to a course detail page.
    await expect(
      page.locator('a[href^="/courses/"]').first(),
    ).toBeVisible({ timeout: 10_000 });
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
