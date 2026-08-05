import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { env } from "@/lib/env";

import {
  zarinpalCallbackUrl,
  zarinpalStartPayUrl,
  zarinpalRequestPayment,
  zarinpalVerifyPayment,
  isZarinpalEnabled,
} from "../zarinpal";

const fetchMock = vi.fn();

describe("zarinpal payment client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    env.ZARINPAL_MERCHANT_ID = "merchant-123";
    env.ZARINPAL_SANDBOX = false;
    env.NEXT_PUBLIC_SITE_URL = "https://baseerno.ir/";
    env.zarinpalEnabled = true;
  });

  afterEach(() => {
    delete env.ZARINPAL_MERCHANT_ID;
    env.ZARINPAL_SANDBOX = false;
    delete env.NEXT_PUBLIC_SITE_URL;
    env.zarinpalEnabled = false;
    vi.unstubAllGlobals();
  });

  it("isZarinpalEnabled reflects the configured merchant", () => {
    expect(isZarinpalEnabled()).toBe(true);
    env.zarinpalEnabled = false;
    expect(isZarinpalEnabled()).toBe(false);
  });

  it("builds the callback URL without a trailing slash", () => {
    expect(zarinpalCallbackUrl()).toBe("https://baseerno.ir/api/checkout/callback");
  });

  it("builds StartPay URLs in production", () => {
    expect(zarinpalStartPayUrl("AUTH123")).toBe("https://www.zarinpal.com/pg/StartPay/AUTH123");
  });

  it("uses sandbox endpoints when ZARINPAL_SANDBOX is enabled", () => {
    env.ZARINPAL_SANDBOX = true;
    expect(zarinpalStartPayUrl("AUTH9")).toBe("https://sandbox.zarinpal.com/pg/StartPay/AUTH9");
  });

  it("requests a payment authority on code 100", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { code: 100, authority: "AUTH-1", fee: 2500 } }),
    });

    const result = await zarinpalRequestPayment({
      amountToman: 500_000,
      description: "دوره انگلیسی",
    });

    expect(result).toEqual({ authority: "AUTH-1", fee: 2500, feeType: undefined });
    // Amount converted Toman → Rials (×10)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(init?.body as string);
    expect(body.amount).toBe(5_000_000);
    expect(body.merchant_id).toBe("merchant-123");
    expect(body.callback_url).toBe("https://baseerno.ir/api/checkout/callback");
    expect(init?.cache).toBe("no-store");
  });

  it("throws when Zarinpal returns a non-100 code", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { code: -1, message: "Invalid merchant" } }),
    });

    await expect(
      zarinpalRequestPayment({ amountToman: 1000, description: "x" }),
    ).rejects.toThrow("Invalid merchant");
  });

  it("throws when the HTTP response is not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ data: { code: 500 } }),
    });

    await expect(
      zarinpalRequestPayment({ amountToman: 1000, description: "x" }),
    ).rejects.toThrow();
  });

  it("verifies a payment on code 100", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { code: 100, ref_id: 987654, card_pan: "6219****1234", fee: 1000 },
      }),
    });

    const result = await zarinpalVerifyPayment({ authority: "AUTH-1", amountToman: 500_000 });
    expect(result).toEqual({ refId: 987654, cardPan: "6219****1234", fee: 1000 });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(init?.body as string);
    expect(body.authority).toBe("AUTH-1");
  });

  it("accepts code 101 (already verified) as success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { code: 101, ref_id: 111 } }),
    });

    const result = await zarinpalVerifyPayment({ authority: "AUTH-1", amountToman: 1000 });
    expect(result.refId).toBe(111);
  });

  it("throws when verification code is not 100/101", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { code: -22 } }),
    });

    await expect(
      zarinpalVerifyPayment({ authority: "AUTH-1", amountToman: 1000 }),
    ).rejects.toThrow(/verify failed/);
  });
});
