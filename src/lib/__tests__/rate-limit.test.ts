import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIdentifier } from "../rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const result = checkRateLimit("test-ok", { windowMs: 60_000, max: 5 });
    expect(result.success).toBe(true);
  });

  it("blocks requests exceeding limit", () => {
    const id = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(id, { windowMs: 60_000, max: 3 });
    }
    const result = checkRateLimit(id, { windowMs: 60_000, max: 3 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.retryAfter).toBeGreaterThan(0);
    }
  });
});

describe("getClientIdentifier", () => {
  it("returns forwarded IP when available", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIdentifier(req)).toBe("1.2.3.4");
  });

  it("returns local when no forwarded header", () => {
    const req = new Request("http://localhost");
    expect(getClientIdentifier(req)).toBe("local");
  });
});
