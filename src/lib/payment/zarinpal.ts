/**
 * Zarinpal payment gateway client (v4 REST API).
 *
 * When `ZARINPAL_MERCHANT_ID` is set, checkout uses the real gateway.
 * Sandbox endpoints are used when `ZARINPAL_SANDBOX=true`.
 *
 * Docs: https://docs.zarinpal.com/paymentGateway/
 */

import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";

const PRODUCTION_BASE = "https://api.zarinpal.com/pg/v4/payment";
const SANDBOX_BASE = "https://sandbox.zarinpal.com/pg/v4/payment";
const PRODUCTION_START = "https://www.zarinpal.com/pg/StartPay";
const SANDBOX_START = "https://sandbox.zarinpal.com/pg/StartPay";

function apiBase(): string {
  return env.ZARINPAL_SANDBOX ? SANDBOX_BASE : PRODUCTION_BASE;
}

function startPayBase(): string {
  return env.ZARINPAL_SANDBOX ? SANDBOX_START : PRODUCTION_START;
}

function merchantId(): string {
  const id = env.ZARINPAL_MERCHANT_ID?.trim();
  if (!id) {
    throw new Error("ZARINPAL_MERCHANT_ID is not configured");
  }
  return id;
}

/** Absolute callback URL for Zarinpal to hit after payment. */
export function zarinpalCallbackUrl(): string {
  const origin =
    env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteConfig.url.replace(/\/$/, "");
  return `${origin}/api/checkout/callback`;
}

export function zarinpalStartPayUrl(authority: string): string {
  return `${startPayBase()}/${authority}`;
}

export interface ZarinpalRequestInput {
  /** Amount in Toman (Zarinpal expects Rials in some docs — we use Toman × 10). */
  amountToman: number;
  description: string;
  callbackUrl?: string;
  email?: string;
  mobile?: string;
  /** Optional metadata for correlation (payment id). */
  orderId?: string;
}

export interface ZarinpalRequestResult {
  authority: string;
  fee?: number;
  feeType?: string;
}

export interface ZarinpalVerifyResult {
  refId: number | null;
  cardPan?: string;
  fee?: number;
}

interface ZarinpalEnvelope<T> {
  data?: T & { code?: number; message?: string };
  errors?: unknown[] | Record<string, unknown>;
}

/**
 * Convert Toman (site prices) to Rials for Zarinpal API.
 * Zarinpal amount unit is Rials.
 */
function toRials(amountToman: number): number {
  return Math.round(amountToman) * 10;
}

/**
 * Request a payment authority from Zarinpal.
 * On success, redirect the user to `zarinpalStartPayUrl(authority)`.
 */
export async function zarinpalRequestPayment(
  input: ZarinpalRequestInput,
): Promise<ZarinpalRequestResult> {
  const body = {
    merchant_id: merchantId(),
    amount: toRials(input.amountToman),
    description: input.description.slice(0, 255),
    callback_url: input.callbackUrl ?? zarinpalCallbackUrl(),
    metadata: {
      email: input.email,
      mobile: input.mobile,
      order_id: input.orderId,
    },
  };

  const res = await fetch(`${apiBase()}/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = (await res.json()) as ZarinpalEnvelope<{
    authority?: string;
    fee?: number;
    fee_type?: string;
    code?: number;
    message?: string;
  }>;

  const code = json.data?.code;
  const authority = json.data?.authority;

  // code 100 = success on request
  if (!res.ok || code !== 100 || !authority) {
    const errMsg =
      (typeof json.data?.message === "string" && json.data.message) ||
      `Zarinpal request failed (code=${code ?? "unknown"})`;
    throw new Error(errMsg);
  }

  return {
    authority,
    fee: json.data?.fee,
    feeType: json.data?.fee_type,
  };
}

/**
 * Verify a completed payment with Zarinpal after the user returns.
 * Status OK + code 100 (or 101 already verified) means success.
 */
export async function zarinpalVerifyPayment(input: {
  authority: string;
  amountToman: number;
}): Promise<ZarinpalVerifyResult> {
  const body = {
    merchant_id: merchantId(),
    amount: toRials(input.amountToman),
    authority: input.authority,
  };

  const res = await fetch(`${apiBase()}/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = (await res.json()) as ZarinpalEnvelope<{
    code?: number;
    message?: string;
    ref_id?: number;
    card_pan?: string;
    fee?: number;
  }>;

  const code = json.data?.code;
  // 100 = verified, 101 = already verified (idempotent success)
  if (code !== 100 && code !== 101) {
    const errMsg =
      (typeof json.data?.message === "string" && json.data.message) ||
      `Zarinpal verify failed (code=${code ?? "unknown"})`;
    throw new Error(errMsg);
  }

  return {
    refId: json.data?.ref_id ?? null,
    cardPan: json.data?.card_pan,
    fee: json.data?.fee,
  };
}

/** Whether the live gateway is configured for this deployment. */
export function isZarinpalEnabled(): boolean {
  return env.zarinpalEnabled;
}
