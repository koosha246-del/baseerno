import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitMiddleware,
  tooManyRequestsResponse,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitStoreSize,
  RATE_LIMIT_PRESETS,
} from "../rate-limit";

beforeEach(() => {
  clearAllRateLimits();
});

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const result = checkRateLimit("test-ok", { windowMs: 60_000, max: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    }
  });

  it("returns remaining count decreasing", () => {
    const id = "test-remaining";
    const r1 = checkRateLimit(id, { windowMs: 60_000, max: 5 });
    expect(r1.success).toBe(true);
    if (r1.success) expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit(id, { windowMs: 60_000, max: 5 });
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.remaining).toBe(3);

    const r3 = checkRateLimit(id, { windowMs: 60_000, max: 5 });
    expect(r3.success).toBe(true);
    if (r3.success) expect(r3.remaining).toBe(2);
  });

  it("blocks requests exceeding the limit", () => {
    const id = `test-block-${Date.now()}`;
    const config = { windowMs: 60_000, max: 3 };

    for (let i = 0; i < 3; i++) {
      const r = checkRateLimit(id, config);
      expect(r.success).toBe(true);
    }

    const result = checkRateLimit(id, config);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.retryAfter).toBeGreaterThan(0);
    }
  });

  it("recovers after the window expires", async () => {
    const id = `test-recover-${Date.now()}`;
    const config = { windowMs: 50, max: 2 };

    // Exhaust the limit
    checkRateLimit(id, config);
    checkRateLimit(id, config);

    // Should be blocked
    const blocked = checkRateLimit(id, config);
    expect(blocked.success).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Should recover
    const recovered = checkRateLimit(id, config);
    expect(recovered.success).toBe(true);
  }, 10_000);

  it("uses default config when none provided", () => {
    const id = `test-default-${Date.now()}`;

    // Default is windowMs: 60000, max: 10
    for (let i = 0; i < 10; i++) {
      const r = checkRateLimit(id);
      expect(r.success).toBe(true);
    }

    const blocked = checkRateLimit(id);
    expect(blocked.success).toBe(false);
  });
});

describe("burst support", () => {
  it("allows burst requests within burst window", () => {
    const id = `test-burst-ok-${Date.now()}`;
    const config = { windowMs: 60_000, max: 10, burst: 3, burstWindowMs: 2_000 };

    // Use up the main window + burst
    for (let i = 0; i < 13; i++) {
      const r = checkRateLimit(id, config);
      expect(r.success).toBe(true);
    }

    // Next request should be blocked (burst also exhausted)
    const blocked = checkRateLimit(id, config);
    expect(blocked.success).toBe(false);
  });

  it("burst resets independently of main window", async () => {
    const id = `test-burst-reset-${Date.now()}`;
    const config = {
      windowMs: 60_000,
      max: 10,
      burst: 2,
      burstWindowMs: 100, // Very short burst window
    };

    // Exhaust main window (10 requests)
    for (let i = 0; i < 10; i++) {
      checkRateLimit(id, config);
    }

    let r: ReturnType<typeof checkRateLimit>;

    // Use the 2 burst requests
    r = checkRateLimit(id, config);
    expect(r.success).toBe(true);
    r = checkRateLimit(id, config);
    expect(r.success).toBe(true);

    // Now blocked
    r = checkRateLimit(id, config);
    expect(r.success).toBe(false);

    // Wait for burst window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Burst should have reset, but main window is still full
    r = checkRateLimit(id, config);
    expect(r.success).toBe(false); // Still blocked by main window
  }, 10_000);
});

describe("presets", () => {
  it("AUTH preset allows 5 main window + 2 burst = 7 requests, blocks 8th", () => {
    const id = `test-auth-${Date.now()}`;
    const totalAllowed = RATE_LIMIT_PRESETS.AUTH.max + RATE_LIMIT_PRESETS.AUTH.burst;

    for (let i = 0; i < totalAllowed; i++) {
      const r = checkRateLimit(id, RATE_LIMIT_PRESETS.AUTH);
      expect(r.success).toBe(true);
    }

    // totalAllowed + 1 should be blocked
    const blocked = checkRateLimit(id, RATE_LIMIT_PRESETS.AUTH);
    expect(blocked.success).toBe(false);
  });

  it("SENSITIVE preset limits to 3 main window + 1 burst = 4 requests, blocks 5th", () => {
    const id = `test-sensitive-${Date.now()}`;
    const totalAllowed = RATE_LIMIT_PRESETS.SENSITIVE.max + RATE_LIMIT_PRESETS.SENSITIVE.burst;

    for (let i = 0; i < totalAllowed; i++) {
      const r = checkRateLimit(id, RATE_LIMIT_PRESETS.SENSITIVE);
      expect(r.success).toBe(true);
    }

    const blocked = checkRateLimit(id, RATE_LIMIT_PRESETS.SENSITIVE);
    expect(blocked.success).toBe(false);
  });
});

describe("getClientIdentifier", () => {
  it("returns forwarded IP when available", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIdentifier(req)).toBe("1.2.3.4");
  });

  it("returns x-real-ip when forwarded not available", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "10.0.0.1" },
    });
    expect(getClientIdentifier(req)).toBe("10.0.0.1");
  });

  it("returns cf-connecting-ip when others not available", () => {
    const req = new Request("http://localhost", {
      headers: { "cf-connecting-ip": "203.0.113.5" },
    });
    expect(getClientIdentifier(req)).toBe("203.0.113.5");
  });

  it("returns local when no headers present", () => {
    const req = new Request("http://localhost");
    expect(getClientIdentifier(req)).toBe("local");
  });
});

describe("rateLimitMiddleware", () => {
  it("works as a convenience wrapper", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const r1 = rateLimitMiddleware(req, { windowMs: 60_000, max: 2 });
    expect(r1.success).toBe(true);

    const r2 = rateLimitMiddleware(req, { windowMs: 60_000, max: 2 });
    expect(r2.success).toBe(true);

    const r3 = rateLimitMiddleware(req, { windowMs: 60_000, max: 2 });
    expect(r3.success).toBe(false);
  });
});

describe("tooManyRequestsResponse", () => {
  it("returns 429 with Retry-After header", async () => {
    const res = tooManyRequestsResponse(30);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");

    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.retryAfter).toBe(30);
  });
});

describe("resetRateLimit / clearAllRateLimits", () => {
  it("resets a specific identifier", () => {
    const id = "test-reset";

    checkRateLimit(id, { windowMs: 60_000, max: 1 });
    const blocked = checkRateLimit(id, { windowMs: 60_000, max: 1 });
    expect(blocked.success).toBe(false);

    resetRateLimit(id);

    const allowed = checkRateLimit(id, { windowMs: 60_000, max: 1 });
    expect(allowed.success).toBe(true);
  });

  it("clears all rate limits", () => {
    checkRateLimit("a", { windowMs: 60_000, max: 1 });
    checkRateLimit("b", { windowMs: 60_000, max: 1 });

    expect(getRateLimitStoreSize()).toBeGreaterThan(0);

    clearAllRateLimits();

    expect(getRateLimitStoreSize()).toBe(0);
  });
});
