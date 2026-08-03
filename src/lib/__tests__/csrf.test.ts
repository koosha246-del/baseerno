import { describe, it, expect, vi, beforeEach } from "vitest";

import { isSameOriginRequest, csrfRejectedResponse } from "../csrf";

describe("csrf", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default to test environment
    vi.stubEnv("NODE_ENV", "test");
  });

  describe("isSameOriginRequest", () => {
    describe("in production mode", () => {
      beforeEach(() => {
        vi.stubEnv("NODE_ENV", "production");
      });

      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it("returns true when Origin matches the site URL", () => {
        const req = new Request("https://baseerno.ir/api/auth/login", {
          headers: { origin: "https://baseerno.ir" },
        });
        expect(isSameOriginRequest(req)).toBe(true);
      });

      it("returns false when Origin does not match", () => {
        const req = new Request("https://baseerno.ir/api/auth/login", {
          headers: { origin: "https://evil-site.com" },
        });
        expect(isSameOriginRequest(req)).toBe(false);
      });

      it("falls back to Referer when Origin is absent", () => {
        const req = new Request("https://baseerno.ir/api/auth/login", {
          headers: { referer: "https://baseerno.ir/some-page" },
        });
        expect(isSameOriginRequest(req)).toBe(true);
      });

      it("returns false when both Origin and Referer are missing", () => {
        const req = new Request("https://baseerno.ir/api/auth/login");
        expect(isSameOriginRequest(req)).toBe(false);
      });

      it("returns false when Referer is from a different site", () => {
        const req = new Request("https://baseerno.ir/api/auth/login", {
          headers: { referer: "https://evil-site.com/attack" },
        });
        expect(isSameOriginRequest(req)).toBe(false);
      });

      it("handles malformed Origin gracefully", () => {
        const req = new Request("https://baseerno.ir/api/auth/login", {
          headers: { origin: "not-a-valid-url" },
        });
        expect(isSameOriginRequest(req)).toBe(false);
      });
    });

    describe("in development mode", () => {
      beforeEach(() => {
        vi.stubEnv("NODE_ENV", "development");
      });

      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it("always returns true regardless of origin", () => {
        const req = new Request("https://localhost:3000/api/auth/login", {
          headers: { origin: "https://evil-site.com" },
        });
        expect(isSameOriginRequest(req)).toBe(true);
      });

      it("always returns true even without any headers", () => {
        const req = new Request("https://localhost:3000/api/auth/login");
        expect(isSameOriginRequest(req)).toBe(true);
      });
    });
  });

  describe("csrfRejectedResponse", () => {
    it("returns a 403 response", () => {
      const res = csrfRejectedResponse();
      expect(res.status).toBe(403);
    });

    it("includes the default Persian error message", async () => {
      const res = csrfRejectedResponse();
      const body = await res.json();
      expect(body.error).toBe("درخواست از مبدا نامعتبر است.");
    });

    it("accepts a custom error message", async () => {
      const res = csrfRejectedResponse("شما مجاز نیستید.");
      const body = await res.json();
      expect(body.error).toBe("شما مجاز نیستید.");
    });
  });
});
