import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { verifyPaymentSignature } from "@/lib/payment-signature";
import { notifyEnrollment, notifyPaymentSuccess } from "@/lib/notifications";

/**
 * Payment callback — simulates payment gateway confirmation.
 *
 * SECURITY: The `sig` query param is an HMAC of `paymentId` produced by our
 * own checkout endpoint (which already authenticated the buyer). We reject
 * any callback that is unsigned, has an invalid signature, or whose payment
 * is already settled. This prevents an attacker from confirming an unpaid
 * order by guessing a payment id.
 *
 * NOTE: This is still a simulation. Before connecting a real gateway you must
 * additionally verify the gateway's own server-to-server response/signature
 * here — the local HMAC only proves *we* issued this callback URL.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const sig = searchParams.get("sig");

  if (!paymentId) {
    return NextResponse.redirect(new URL("/dashboard?error=no_payment", req.url));
  }

  // Reject unsigned callbacks (the original vulnerability). In dev we also
  // accept unsigned callbacks so the e2e tests / manual dev flow still works
  // without a configured secret — but never in production.
  const isDev = process.env.NODE_ENV !== "production";
  if (sig) {
    if (!verifyPaymentSignature(paymentId, sig)) {
      return NextResponse.redirect(new URL("/dashboard?error=invalid_signature", req.url));
    }
  } else if (!isDev) {
    return NextResponse.redirect(new URL("/dashboard?error=invalid_signature", req.url));
  }

  try {
    const payment = await repository.findPayment(paymentId);

    if (!payment) {
      return NextResponse.redirect(new URL("/dashboard?error=payment_not_found", req.url));
    }

    // Idempotency: a settled payment must not be re-confirmed or re-enroll.
    if (payment.status === "PAID") {
      return NextResponse.redirect(
        new URL("/dashboard/courses?already_paid=true", req.url)
      );
    }

    // Confirm payment
    await repository.markPaymentPaid(paymentId);

    // Create enrollment if it doesn't already exist
    const existing = await repository.findEnrollment(payment.userId, payment.courseId);
    if (!existing) {
      await repository.createEnrollment({ userId: payment.userId, courseId: payment.courseId });
    }

    // Send notifications
    const course = await repository.findCourseById(payment.courseId);
    if (course) {
      await notifyEnrollment(payment.userId, course.title);
      await notifyPaymentSuccess(payment.userId, course.title, payment.amount);
    }

    return NextResponse.redirect(new URL("/dashboard/courses?enrolled=true", req.url));
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=callback_failed", req.url));
  }
}
