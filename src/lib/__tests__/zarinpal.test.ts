import { describe, it, expect } from "vitest";
import {
  signPaymentId,
  verifyPaymentSignature,
  buildCallbackUrl,
} from "../payment-signature";
import {
  zarinpalRequestPayment,
  zarinpalVerifyPayment,
  isZarinpalEnabled,
  zarinpalCallbackUrl,
  zarinpalStartPayUrl,
} from "../payment/zarinpal";

describe("payment signatures", () => {
  it("signs a payment ID deterministically", () => {
    const sig1 = signPaymentId("pay_123");
    const sig2 = signPaymentId("pay_123");
    expect(sig1).toBe(sig2);
  });

  it("produces different signatures for different payment IDs", () => {
    const sig1 = signPaymentId("pay_123");
    const sig2 = signPaymentId("pay_456");
    expect(sig1).not.toBe(sig2);
  });

  it("verifies a valid signature", () => {
    const sig = signPaymentId("pay_123");
    expect(verifyPaymentSignature("pay_123", sig)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyPaymentSignature("pay_123", "fakesig")).toBe(false);
  });

  it("builds a callback URL with payment ID", () => {
    const url = buildCallbackUrl("pay_123");
    expect(url).toContain("pay_123");
  });
});

describe("Zarinpal module", () => {
  it("exports expected functions", () => {
    expect(typeof zarinpalRequestPayment).toBe("function");
    expect(typeof zarinpalVerifyPayment).toBe("function");
    expect(typeof isZarinpalEnabled).toBe("function");
    expect(typeof zarinpalCallbackUrl).toBe("function");
    expect(typeof zarinpalStartPayUrl).toBe("function");
  });

  it("isZarinpalEnabled returns boolean", () => {
    expect(typeof isZarinpalEnabled()).toBe("boolean");
  });

  it("zarinpalCallbackUrl returns a URL string", () => {
    const url = zarinpalCallbackUrl();
    expect(url).toContain("http");
  });

  it("zarinpalStartPayUrl builds a payment URL", () => {
    const url = zarinpalStartPayUrl("AUTH_123");
    expect(url).toContain("AUTH_123");
  });
});
