import { describe, it, expect } from "vitest";
import {
  signPaymentId,
  verifyPaymentSignature,
  buildCallbackUrl,
} from "../payment-signature";

describe("signPaymentId", () => {
  it("returns a 64-character hex string (sha256)", () => {
    const sig = signPaymentId("payment-123");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", () => {
    expect(signPaymentId("abc")).toBe(signPaymentId("abc"));
  });

  it("differs for different inputs", () => {
    expect(signPaymentId("a")).not.toBe(signPaymentId("b"));
  });
});

describe("verifyPaymentSignature", () => {
  it("returns true for a freshly-signed id", () => {
    const id = "payment-42";
    const sig = signPaymentId(id);
    expect(verifyPaymentSignature(id, sig)).toBe(true);
  });

  it("returns false for a wrong id", () => {
    const sig = signPaymentId("payment-1");
    expect(verifyPaymentSignature("payment-2", sig)).toBe(false);
  });

  it("returns false for an empty signature", () => {
    expect(verifyPaymentSignature("payment-1", "")).toBe(false);
  });

  it("returns false for a tampered signature", () => {
    const id = "payment-1";
    const sig = signPaymentId(id);
    // Flip the first byte — guaranteed to differ from the genuine one.
    const firstByte = sig.slice(0, 2);
    const flipped = firstByte === "00" ? "ff" : "00";
    const tampered = flipped + sig.slice(2);
    expect(verifyPaymentSignature(id, tampered)).toBe(false);
  });

  it("returns false for non-hex signature", () => {
    expect(verifyPaymentSignature("id", "not-hex-zzz")).toBe(false);
  });
});

describe("buildCallbackUrl", () => {
  it("builds a path with paymentId and sig", () => {
    const url = buildCallbackUrl("payment-7");
    expect(url).toMatch(/^\/api\/checkout\/callback\?paymentId=payment-7&sig=[0-9a-f]{64}$/);
  });

  it("produces a URL that verifyPaymentSignature accepts", () => {
    const id = "payment-9";
    const url = buildCallbackUrl(id);
    const sig = new URL(url, "https://x.test").searchParams.get("sig")!;
    expect(verifyPaymentSignature(id, sig)).toBe(true);
  });
});
