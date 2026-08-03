import { describe, it, expect } from "vitest";
import { generateSecret, generateCode, verifyCode, buildOtpauthUri } from "../totp";

describe("totp", () => {
  it("generates a 32-char base32 secret", () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  });

  it("generateCode produces a 6-digit code", () => {
    const secret = generateSecret();
    const code = generateCode(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("verifyCode accepts the correct code", () => {
    const secret = generateSecret();
    const code = generateCode(secret);
    expect(verifyCode(secret, code)).toBe(true);
  });

  it("verifyCode rejects wrong or malformed codes", () => {
    const secret = generateSecret();
    expect(verifyCode(secret, "000000")).toBe(false);
    expect(verifyCode(secret, "12345")).toBe(false);
    expect(verifyCode(secret, "abcdef")).toBe(false);
  });

  it("accepts ±1 step drift (clock skew tolerance)", () => {
    const secret = generateSecret();
    // 20s in the past is always within one 30s step (never 2 steps back),
    // so the test is deterministic regardless of wall-clock remainder.
    const past = Date.now() - 20_000;
    const code = generateCode(secret, past);
    expect(verifyCode(secret, code)).toBe(true);
  });

  it("buildOtpauthUri includes secret and issuer", () => {
    const uri = buildOtpauthUri("ABC234", "user@example.com", "بصیر نو");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=ABC234");
    expect(uri).toContain("issuer=");
  });
});
