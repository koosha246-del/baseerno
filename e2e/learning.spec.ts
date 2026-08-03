import { test, expect } from "@playwright/test";

/**
 * Learning flow (requires seeded DB):
 *   student@baseerno.ir / 123456 is enrolled in course c_fundamentals
 *   (see prisma/seed.ts) which has 3 lessons — the first is free.
 *
 * Prereq: `npm run db:seed` after `npm run db:migrate`, then `npm run test:e2e`.
 */
test.describe("Learning flow (enrolled student)", () => {
  test("student opens an enrolled course and watches the free lesson", async ({ page }) => {
    // 1. Login with the seeded student account
    await page.goto("/login");
    await page.fill('input[type="email"]', "student@baseerno.ir");
    await page.fill('input[type="password"]', "123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page.locator("text=داشبورد")).toBeVisible();

    // 2. Open the learn page of the enrolled course (DB id c_fundamentals)
    await page.goto("/courses/c_fundamentals/learn");
    await expect(page.locator("h2")).toContainText("مبانی فن بیان");

    // 3. The first (free) lesson is auto-selected and its video renders.
    //    Use getByRole so we target the sidebar button (the title also
    //    appears in the active-lesson h1, which would trip strict mode).
    await expect(
      page.getByRole("button", { name: /مقدمه: چرا فن بیان/ }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("h1")).toContainText("مقدمه: چرا فن بیان؟");
    await expect(page.locator("iframe")).toBeVisible();

    // 4. Switching lessons works
    await page.getByRole("button", { name: /تکنیک‌های تنفسی/ }).click();
    await expect(page.locator("h1")).toContainText("تکنیک‌های تنفسی");
  });

  test("learn page redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/courses/c_fundamentals/learn");
    await page.waitForURL("**/login", { timeout: 10000 });
  });
});
