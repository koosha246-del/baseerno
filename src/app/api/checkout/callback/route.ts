import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { prisma } from "@/lib/db/prisma-client";
import { verifyPaymentSignature } from "@/lib/payment-signature";
import { publish } from "@/lib/events";
import {
  isZarinpalEnabled,
  zarinpalVerifyPayment,
} from "@/lib/payment/zarinpal";
import { incr } from "@/lib/metrics";

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

  // Require a valid signature on every simulated callback. The signed
  // callback is a dev-only affordance (checkout.ts refuses to mint one in
  // production), so this path can never redeem a payment in production.
  if (!sig || !verifyPaymentSignature(paymentId, sig)) {
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

    // A previously-FAILED payment must not be flipped to PAID by replaying
    // this callback with a fresh Authority.
    if (payment.status !== "PENDING") {
      await repository.markPaymentFailed(payment.id);
      incr("payment:failed");
      return NextResponse.redirect(
        new URL("/dashboard?error=payment_cancelled", req.url),
      );
    }

    // User cancelled or bank declined
    if (status && status.toUpperCase() !== "OK") {
      await repository.markPaymentFailed(payment.id);
      incr("payment:failed");
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
    incr("payment:success");
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

    // Idempotency + state machine guard: only a PENDING payment may be
    // confirmed. A FAILED (or already-PAID) payment is never re-confirmed,
    // so a previously-declined order cannot be flipped to PAID by replaying
    // this callback.
    if (payment.status !== "PENDING") {
      return NextResponse.redirect(
        new URL("/dashboard/courses?already_paid=true", req.url),
      );
    }

    await repository.markPaymentPaid(paymentId);
    incr("payment:success");
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
  // Atomic upsert: prevents duplicate enrollment from concurrent callbacks.
  // Uses a unique compound key (userId, courseId) so the DB enforces
  // idempotency regardless of race conditions.
  const existing = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });
  if (!existing) {
    try {
      await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          progress: 0,
          status: "ACTIVE",
        },
      });
    } catch (err: unknown) {
      // P2002 = unique constraint violation = another concurrent callback
      // already created the enrollment — safe to ignore.
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
        // Enrollment already exists, continue with notifications
      } else {
        throw err;
      }
    }
  }

  const course = await repository.findCourseById(courseId);

  // Side effects (both notifications + SSE push + confirmation email +
  // cache revalidation + ops metrics) all ride on the domain event —
  // the single source of truth in events.ts. Publishing instead of
  // inlining them here revived the permanently-zero «ثبت‌نام پولی»
  // counter and removed the duplicated logic.
  await publish({
    type: "enrollment:completed",
    userId,
    courseId,
    courseName: course?.title ?? "دوره",
    amount,
  });
}
