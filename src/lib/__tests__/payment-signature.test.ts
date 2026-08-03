import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock env to control payment signature secret ────────────────────
vi.mock("@/lib/env", () => ({
  env: {
    paymentSignatureSecret: "test-payment-secret-min-16-chars",
    isProduction: false,
    isDevelopment: true,
    isTest: true,
  },
}));

import { signPaymentId, verifyPaymentSignature, buildCallbackUrl } from "../payment-signature";

describe("payment-signature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signPaymentId", () => {
    it("returns a hex string", () => {
      const sig = signPaymentId("payment-1");
      expect(typeof sig).toBe("string");
      expect(sig).toMatch(/^[0-9a-f]+$/);
    });

    it("returns a 64-character hex string (SHA-256)", () => {
      const sig = signPaymentId("payment-1");
      expect(sig).toHaveLength(64);
    });

    it("is deterministic for the same input", () => {
      const sig1 = signPaymentId("payment-1");
      const sig2 = signPaymentId("payment-1");
      expect(sig1).toBe(sig2);
    });

    it("produces different signatures for different inputs", () => {
      const sig1 = signPaymentId("payment-1");
      const sig2 = signPaymentId("payment-2");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyPaymentSignature", () => {
    it("returns true for a valid signature", () => {
      const sig = signPaymentId("payment-1");
      expect(verifyPaymentSignature("payment-1", sig)).toBe(true);
    });

    it("returns false for a tampered signature", () => {
      const sig = signPaymentId("payment-1");
      const tampered = sig.slice(0, -1) + "0";
      expect(verifyPaymentSignature("payment-1", tampered)).toBe(false);
    });

    it("returns false for an empty signature", () => {
      expect(verifyPaymentSignature("payment-1", "")).toBe(false);
    });

    it("returns false when payment id does not match", () => {
      const sig = signPaymentId("payment-1");
      expect(verifyPaymentSignature("payment-2", sig)).toBe(false);
    });

    it("returns false for a garbage signature", () => {
      expect(verifyPaymentSignature("payment-1", "not-a-hex-string")).toBe(false);
    });
  });

  describe("buildCallbackUrl", () => {
    it("includes the paymentId and sig query parameters", () => {
      const url = buildCallbackUrl("payment-42");
      expect(url).toContain("paymentId=payment-42");
      expect(url).toContain("sig=");
    });

    it("starts with the callback path", () => {
      const url = buildCallbackUrl("payment-1");
      expect(url).toMatch(/^\/api\/checkout\/callback\?/);
    });

    it("contains a valid signature that verifies", () => {
      const url = buildCallbackUrl("payment-1");
      const params = new URLSearchParams(url.split("?")[1]!);
      const paymentId = params.get("paymentId");
      const sig = params.get("sig");
      expect(paymentId).toBe("payment-1");
      expect(sig).toBeDefined();
      expect(verifyPaymentSignature("payment-1", sig!)).toBe(true);
    });
  });
});
