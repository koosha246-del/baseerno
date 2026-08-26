/**
 * UseCase: Checkout — paid course enrollment.
 *
 * Validates the course, guards against duplicate enrollment, creates a
 * PENDING payment, publishes the `payment:created` event (cache
 * invalidation), then starts the real Zarinpal gateway (when configured)
 * or falls back to the signed simulated gateway.  Free courses delegate to
 * the `freeEnroll` use case.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { buildCallbackUrl } from "@/lib/payment-signature";
import {
  isZarinpalEnabled,
  zarinpalRequestPayment,
  zarinpalStartPayUrl,
} from "@/lib/payment/zarinpal";
import { publish } from "@/lib/events";
import { incr } from "@/lib/metrics";
import { env } from "@/lib/env";
import { freeEnroll, type FreeEnrollResult } from "./freeEnroll";

export const checkoutSchema = z.object({
  courseId: z.string().min(1),
  studentName: z.string().min(3),
  studentEmail: z.string().email(),
  studentPhone: z.string().optional(),
  paymentMethod: z.enum(["zarinpal", "saman", "wallet"]).default("zarinpal"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export interface CheckoutContext {
  userId: string;
  /** Fallback for the gateway metadata when studentEmail is absent. */
  userEmail: string;
}

export interface CheckoutError {
  ok: false;
  error: string;
  status: number;
}

export interface PaidCheckoutResult {
  ok: true;
  payment: Record<string, unknown>;
  redirectUrl: string;
  gateway?: string;
  message: string;
  simulated?: boolean;
  callbackUrl?: string;
}

export type CheckoutResponse = FreeEnrollResult | PaidCheckoutResult | CheckoutError;

export async function checkout(
  input: CheckoutInput & CheckoutContext,
): Promise<CheckoutResponse> {
  const course = await repository.findCourseById(input.courseId);
  if (!course) {
    return { ok: false, error: "دوره یافت نشد.", status: 404 };
  }

  // Check if already enrolled
  const existingEnrollment = await repository.findEnrollment(input.userId, input.courseId);
  if (existingEnrollment) {
    return { ok: false, error: "شما قبلاً در این دوره ثبت‌نام کرده‌اید.", status: 409 };
  }

  // For free courses, enroll directly via the freeEnroll use case.
  if (!course.price || course.price === 0) {
    return freeEnroll({
      userId: input.userId,
      courseId: input.courseId,
      courseName: course.title,
    });
  }

  // For paid courses, create a pending payment
  const methodLabel =
    input.paymentMethod === "zarinpal"
      ? "زرین‌پال"
      : input.paymentMethod === "saman"
        ? "بانک سامان"
        : "کیف پول";

  const payment = await repository.createPayment({
    userId: input.userId,
    courseId: input.courseId,
    amount: course.price,
    status: "PENDING",
    method: methodLabel,
  });

  // Event bus: revalidates the payments cache tag.
  await publish({
    type: "payment:created",
    userId: input.userId,
    courseId: input.courseId,
    amount: course.price,
  });

  // ── Real Zarinpal gateway ──────────────────────────────────────
  if (isZarinpalEnabled() && input.paymentMethod === "zarinpal") {
    try {
      const { authority } = await zarinpalRequestPayment({
        amountToman: course.price,
        description: `ثبت‌نام دوره: ${course.title}`,
        email: input.studentEmail || input.userEmail,
        mobile: input.studentPhone,
        orderId: payment.id,
      });

      await repository.setPaymentAuthority(payment.id, authority);

      return {
        ok: true,
        payment: { ...payment, gatewayAuthority: authority },
        redirectUrl: zarinpalStartPayUrl(authority),
        gateway: "zarinpal",
        message: "در حال انتقال به درگاه زرین‌پال...",
      };
    } catch (err) {
      console.error("[checkout] Zarinpal request failed:", err);
      await repository.markPaymentFailed(payment.id);
      incr("payment:failed");
      return {
        ok: false,
        error: "خطا در اتصال به درگاه پرداخت. لطفاً بعداً تلاش کنید.",
        status: 502,
      };
    }
  }

  // ── Paid course, but no real gateway available ────────────────
  // The simulated gateway is a DEV-ONLY affordance: in production a
  // self-signed callback URL would let the same client that requested it
  // redeem it and gain enrollment without paying. If we cannot talk to
  // Zarinpal in production, the checkout must fail — never mint a
  // signature that grants access.
  if (env.isProduction) {
    await repository.markPaymentFailed(payment.id);
    incr("payment:failed");
    return {
      ok: false,
      error: "درگاه پرداخت در دسترس نیست. لطفاً بعداً تلاش کنید.",
      status: 503,
    };
  }

  // ── Simulated gateway (dev / no merchant id) ───────────────────
  // Build a signed callback URL. The HMAC proves this URL was minted by us
  // for this specific payment — the callback will reject anything unsigned
  // or tampered with, so an attacker can't confirm an order out of band.
  const callbackUrl = buildCallbackUrl(payment.id);

  return {
    ok: true,
    payment,
    callbackUrl,
    redirectUrl: callbackUrl,
    message: "در حال انتقال به درگاه پرداخت (شبیه‌سازی)...",
    simulated: true,
  };
}

/** Convert a UseCase response to a NextResponse. */
export function buildUseCaseResponse(result: CheckoutResponse): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if ("free" in result) {
    // Free course — delegated to the freeEnroll use case.
    return NextResponse.json({
      enrollment: result.enrollment,
      message: result.message,
      free: true,
    });
  }
  return NextResponse.json({
    payment: result.payment,
    redirectUrl: result.redirectUrl,
    ...(result.gateway ? { gateway: result.gateway } : {}),
    message: result.message,
    ...(result.simulated ? { simulated: true, callbackUrl: result.callbackUrl } : {}),
  });
}
