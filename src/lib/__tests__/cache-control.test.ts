import { describe, expect, it } from "vitest";
import { publicPageCacheControl, PUBLIC_CACHE_MAX_AGE } from "@/lib/cache-control";

describe("publicPageCacheControl", () => {
  it("returns a public s-maxage header for the homepage (GET, anonymous)", () => {
    expect(publicPageCacheControl("/", "GET", false)).toBe(
      `public, s-maxage=${PUBLIC_CACHE_MAX_AGE}, stale-while-revalidate=${PUBLIC_CACHE_MAX_AGE}`,
    );
  });

  it("covers the catalog and course detail pages", () => {
    expect(publicPageCacheControl("/courses", "GET", false)).toContain("s-maxage");
    expect(publicPageCacheControl("/courses/c_fundamentals", "GET", false)).toContain("s-maxage");
  });

  it("covers other public marketing/legal pages", () => {
    for (const path of ["/library", "/about", "/contact", "/privacy", "/terms", "/offline"]) {
      expect(publicPageCacheControl(path, "GET", false)).toContain("s-maxage");
    }
  });

  it("never caches for logged-in users on public pages", () => {
    expect(publicPageCacheControl("/", "GET", true)).toBe("private, no-store");
    expect(publicPageCacheControl("/courses", "GET", true)).toBe("private, no-store");
  });

  it("returns null for dashboard, API, auth and lesson-player paths", () => {
    for (const path of [
      "/dashboard",
      "/dashboard/reports",
      "/api/health",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/courses/c_fundamentals/learn",
    ]) {
      expect(publicPageCacheControl(path, "GET", false)).toBeNull();
    }
  });

  it("returns null for non-GET methods", () => {
    expect(publicPageCacheControl("/", "POST", false)).toBeNull();
    expect(publicPageCacheControl("/", "HEAD", false)).toBeNull();
  });

  it("returns null for unknown paths", () => {
    expect(publicPageCacheControl("/nope", "GET", false)).toBeNull();
  });
});
