import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { repository } from "@/lib/db/repository";
import { verifyPaymentSignature } from "@/lib/payment-signature";
import { notifyEnrollment, notifyPaymentSuccess } from "@/lib/notifications";
import {
  isZarinpalEnabled,
  zarinpalVerifyPayment,
} from "@/lib/payment/zarinpal";
import { env } from "@/lib/env";
import { enrollmentCacheTags } from "@/lib/cache-tags";

/**
 * Payment callback — Zarinpal return URL + simulated gateway confirmation.
 *
 * Zarinpal query params: `Authority`, `Status` (OK | NOK)
 * Simulated query params: `paymentId`, `sig` (HMAC)
 *
 * SECURITY:
 *  - Live: server-to-server verify with Zarinpal before marking PAID.
 *  - Simulated: HMAC of paymentId must match (required in production).
 *  - Idempotent: already-PAID payments just redirect to dashboard.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ── Zarinpal callback ──────────────────────────────────────────
  const authority = searchParams.get("Authority") ?? searchParams.get("authority");
  const zarinpalStatus = searchParams.get("Status") ?? searchParams.get("status");

  if (authority && isZarinpalEnabled()) {
    return handleZarinpalCallback(req, authority, zarinpalStatus);
  }

  // ── Simulated / HMAC callback ──────────────────────────────────
  const paymentId = searchParams.get("paymentId");
  const sig = searchParams.get("sig");

  if (!paymentId) {
    return NextResponse.redirect(new URL("/dashboard?error=no_payment", req.url));
  }

  // Reject unsigned callbacks in production.
  if (sig) {
    if (!verifyPaymentSignature(paymentId, sig)) {
      return NextResponse.redirect(new URL("/dashboard?error=invalid_signature", req.url));
    }
  } else if (env.isProduction) {
    return NextResponse.redirect(new URL("/dashboard?error=invalid_signature", req.url));
  }

  return finalizePayment(req, paymentId);
}

async function handleZarinpalCallback(
  req: Request,
  authority: string,
  status: string | null,
) {
  try {
    const payment = await repository.findPaymentByAuthority(authority);

    if (!payment) {
      return NextResponse.redirect(new URL("/dashboard?error=payment_not_found", req.url));
    }

    if (payment.status === "PAID") {
      return NextResponse.redirect(
        new URL("/dashboard/courses?already_paid=true", req.url),
      );
    }

    // User cancelled or bank declined
    if (status && status.toUpperCase() !== "OK") {
      await repository.markPaymentFailed(payment.id);
      return NextResponse.redirect(
        new URL("/dashboard?error=payment_cancelled", req.url),
      );
    }

    // Server-to-server verify with Zarinpal
    const verified = await zarinpalVerifyPayment({
      authority,
      amountToman: payment.amount,
    });

    await repository.markPaymentPaid(payment.id, { gatewayRefId: verified.refId });
    await ensureEnrollmentAndNotify(payment.userId, payment.courseId, payment.amount);

    return NextResponse.redirect(new URL("/dashboard/courses?enrolled=true", req.url));
  } catch (error) {
    console.error("Zarinpal callback error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=callback_failed", req.url));
  }
}

async function finalizePayment(req: Request, paymentId: string) {
  try {
    const payment = await repository.findPayment(paymentId);

    if (!payment) {
      return NextResponse.redirect(new URL("/dashboard?error=payment_not_found", req.url));
    }

    // Idempotency: a settled payment must not be re-confirmed or re-enroll.
    if (payment.status === "PAID") {
      return NextResponse.redirect(
        new URL("/dashboard/courses?already_paid=true", req.url),
      );
    }

    await repository.markPaymentPaid(paymentId);
    await ensureEnrollmentAndNotify(payment.userId, payment.courseId, payment.amount);

    return NextResponse.redirect(new URL("/dashboard/courses?enrolled=true", req.url));
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=callback_failed", req.url));
  }
}

async function ensureEnrollmentAndNotify(
  userId: string,
  courseId: string,
  amount: number,
) {
  const existing = await repository.findEnrollment(userId, courseId);
  if (!existing) {
    await repository.createEnrollment({ userId, courseId });
  }

  const course = await repository.findCourseById(courseId);
  if (course) {
    await notifyEnrollment(userId, course.title);
    await notifyPaymentSuccess(userId, course.title, amount);
  }

  for (const tag of enrollmentCacheTags(userId, courseId)) {
    revalidateTag(tag);
  }
}
