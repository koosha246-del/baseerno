import { describe, it, expect } from "vitest";

describe("Rate Limiter", () => {
  it("should allow requests within limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = checkRateLimit("test-user-1", { windowMs: 60000, max: 5 });
    expect(result.success).toBe(true);
  });

  it("should block requests exceeding limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const id = "test-user-" + Date.now();
    
    for (let i = 0; i < 5; i++) {
      checkRateLimit(id, { windowMs: 60000, max: 5 });
    }
    
    const result = checkRateLimit(id, { windowMs: 60000, max: 5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.retryAfter).toBeGreaterThan(0);
    }
  });

  it("should extract client identifier from request", async () => {
    const { getClientIdentifier } = await import("@/lib/rate-limit");
    
    const req1 = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIdentifier(req1)).toBe("1.2.3.4");
    
    const req2 = new Request("http://localhost");
    expect(getClientIdentifier(req2)).toBe("local");
  });
});
