import { test, expect } from "@playwright/test";

/**
 * Public catalog flow: homepage → courses → course detail.
 * Verifies the new DB-driven PopularCoursesSection (Phase B) renders
 * without throwing, and the course detail page is reachable.
 */
test.describe("Catalog (public)", () => {
  test("homepage renders the courses section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText("دوره");
  });

  test("courses list has at least one card link", async ({ page }) => {
    await page.goto("/");
    const courseLink = page.locator('a[href^="/courses/"]').first();
    await expect(courseLink).toBeVisible({ timeout: 10000 });
  });

  test("course detail page loads", async ({ page }) => {
    // First seeded course slug
    await page.goto("/courses/fundamentals");
    await expect(page.locator("body")).toContainText("انگلیسی");
  });

  test("library page is accessible without login", async ({ page }) => {
    await page.goto("/library");
    await expect(page.locator("h1")).toContainText("کتاب");
  });
});
