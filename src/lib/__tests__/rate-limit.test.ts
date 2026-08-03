import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  clearAllRateLimits,
  getClientIdentifier,
  RATE_LIMIT_PRESETS,
} from "../rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    clearAllRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearAllRateLimits();
  });

  describe("checkRateLimit with AUTH preset (max:5, burst:2, window:60s)", () => {
    const authConfig = RATE_LIMIT_PRESETS.AUTH;

    it("allows the first request", () => {
      const result = checkRateLimit("test-client", authConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.remaining).toBeGreaterThanOrEqual(0);
      }
    });

    it("enforces the burst sub-window as a hard cap (burst allowed, then blocked)", () => {
      // Contract: no more than `burst` (2) requests within any
      // `burstWindowMs` (10s) sub-window — the 3rd is blocked even
      // though the combined `max + burst` (7) window is far from full.
      for (let i = 1; i <= 2; i++) {
        const result = checkRateLimit("test-client", authConfig);
        expect(result.success).toBe(true);
      }
      const blocked = checkRateLimit("test-client", authConfig);
      expect(blocked.success).toBe(false);
      if (!blocked.success) {
        expect(blocked.retryAfter).toBeGreaterThan(0);
      }
    });

    it("recovers once the burst sub-window elapses", () => {
      checkRateLimit("test-client", authConfig);
      checkRateLimit("test-client", authConfig);
      expect(checkRateLimit("test-client", authConfig).success).toBe(false);

      // Only the 10s burst window needs to pass — not the full 60s.
      vi.advanceTimersByTime(10_001);

      const result = checkRateLimit("test-client", authConfig);
      expect(result.success).toBe(true);
    });

    it("still caps spread-out traffic at max + burst per window, then recovers", () => {
      // Space requests so the burst sub-window never binds: 2 requests,
      // wait out the burst window, 2 more, … until the combined
      // `max + burst` (7) window limit binds.
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          expect(checkRateLimit("test-client", authConfig).success).toBe(true);
        }
        vi.advanceTimersByTime(10_001);
      }
      // 6 requests so far — the 7th (within 60s) is still allowed …
      expect(checkRateLimit("test-client", authConfig).success).toBe(true);
      // … and the 8th hits the combined window cap.
      expect(checkRateLimit("test-client", authConfig).success).toBe(false);

      // Once the full 60s window elapses, everything expires.
      vi.advanceTimersByTime(61_000);
      expect(checkRateLimit("test-client", authConfig).success).toBe(true);
    });
  });

  describe("getClientIdentifier", () => {
    it("extracts from x-forwarded-for header", () => {
      const req = new Request("https://example.com", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });
      expect(getClientIdentifier(req)).toBe("1.2.3.4");
    });

    it("falls back to x-real-ip", () => {
      const req = new Request("https://example.com", {
        headers: { "x-real-ip": "10.0.0.1" },
      });
      expect(getClientIdentifier(req)).toBe("10.0.0.1");
    });

    it("falls back to cf-connecting-ip", () => {
      const req = new Request("https://example.com", {
        headers: { "cf-connecting-ip": "203.0.113.5" },
      });
      expect(getClientIdentifier(req)).toBe("203.0.113.5");
    });

    it("returns 'local' when no IP header is present", () => {
      const req = new Request("https://example.com");
      expect(getClientIdentifier(req)).toBe("local");
    });
  });

  describe("clearAllRateLimits", () => {
    it("clears all stored rate limit entries", () => {
      checkRateLimit("client-a", RATE_LIMIT_PRESETS.API);
      checkRateLimit("client-b", RATE_LIMIT_PRESETS.API);
      clearAllRateLimits();

      // After clear, both should be allowed fresh
      const resultA = checkRateLimit("client-a", RATE_LIMIT_PRESETS.API);
      expect(resultA.success).toBe(true);
      const resultB = checkRateLimit("client-b", RATE_LIMIT_PRESETS.API);
      expect(resultB.success).toBe(true);
    });
  });

  describe("different identifiers have independent limits", () => {
    it("tracks separate counters per client", () => {
      const config = RATE_LIMIT_PRESETS.AUTH;

      // Exhaust client-a (blocked after the 2-request burst cap; the
      // loop keeps the counter exhausted regardless).
      for (let i = 0; i < 7; i++) {
        checkRateLimit("client-a", config);
      }

      // client-a should be blocked
      expect(checkRateLimit("client-a", config).success).toBe(false);

      // client-b should still be allowed
      expect(checkRateLimit("client-b", config).success).toBe(true);
    });
  });
});
