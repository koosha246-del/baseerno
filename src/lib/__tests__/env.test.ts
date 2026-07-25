import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * env.ts validates on import. We re-import with a fresh module graph per case
 * by resetting modules and setting process.env first.
 *
 * The `// @ts-expect-error` directives on `process.env.NODE_ENV` assignments
 * work around Next.js' global type augmentation that marks `NODE_ENV` as
 * readonly. The runtime behaviour is fine — Node's process.env is mutable.
 */
describe("env validation", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Start from a clean slate for the vars we care about
    delete process.env.JWT_SECRET;
    delete process.env.PAYMENT_SIGNATURE_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.ZARINPAL_MERCHANT_ID;
    delete process.env.REDIS_URL;
    // @ts-expect-error -- Next.js types NODE_ENV as readonly
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it("loads in test/dev without hard-required secrets", async () => {
    // @ts-expect-error -- Next.js types NODE_ENV as readonly
    process.env.NODE_ENV = "test";
    const { env } = await import("../env");
    expect(env.isTest).toBe(true);
    expect(env.jwtSecret.length).toBeGreaterThan(0);
    expect(env.paymentSignatureSecret.length).toBeGreaterThan(0);
    expect(env.zarinpalEnabled).toBe(false);
  });

  it("uses provided JWT_SECRET when set", async () => {
    // @ts-expect-error -- Next.js types NODE_ENV as readonly
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET = "my-custom-dev-secret-key-32chars!!";
    const { env } = await import("../env");
    expect(env.jwtSecret).toBe("my-custom-dev-secret-key-32chars!!");
  });

  it("fails in production without JWT_SECRET", async () => {
    // @ts-expect-error -- Next.js types NODE_ENV as readonly
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.PAYMENT_SIGNATURE_SECRET = "payment-secret-16+";
    // no JWT_SECRET
    await expect(import("../env")).rejects.toThrow(/JWT_SECRET/);
  });

  it("fails in production when JWT_SECRET is too short", async () => {
    // @ts-expect-error -- Next.js types NODE_ENV as readonly
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.JWT_SECRET = "short";
    process.env.PAYMENT_SIGNATURE_SECRET = "payment-secret-16+";
    await expect(import("../env")).rejects.toThrow(/JWT_SECRET/);
  });

  it("accepts a valid production config", async () => {
    // @ts-expect-error -- Next.js types NODE_ENV as readonly
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.JWT_SECRET = "a".repeat(32);
    process.env.PAYMENT_SIGNATURE_SECRET = "payment-secret-16+";
    process.env.ZARINPAL_MERCHANT_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const { env } = await import("../env");
    expect(env.isProduction).toBe(true);
    expect(env.zarinpalEnabled).toBe(true);
    expect(env.jwtSecret).toHaveLength(32);
  });
});
