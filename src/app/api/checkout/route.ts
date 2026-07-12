import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { buildCallbackUrl } from "@/lib/payment-signature";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

const schema = z.object({
  courseId: z.string().min(1),
  studentName: z.string().min(3),
  studentEmail: z.string().email(),
  studentPhone: z.string().optional(),
  paymentMethod: z.enum(["zarinpal", "saman", "wallet"]).default("zarinpal"),
});

export async function POST(req: Request) {
  // CSRF: enrollment creates a payment record using the logged-in session.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  const { courseId, paymentMethod } = parsed.data;

  const course = await repository.findCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  // Check if already enrolled
  const existingEnrollment = await repository.findEnrollment(user.id, courseId);
  if (existingEnrollment) {
    return NextResponse.json(
      { error: "شما قبلاً در این دوره ثبت‌نام کرده‌اید." },
      { status: 409 }
    );
  }

  // For free courses, enroll directly
  if (!course.price || course.price === 0) {
    const enrollment = await repository.createEnrollment({ userId: user.id, courseId });

    return NextResponse.json({
      enrollment,
      message: "ثبت‌نام رایگان با موفقیت انجام شد.",
      free: true,
    });
  }

  // For paid courses, create a pending payment and simulate gateway
  const methodLabel =
    paymentMethod === "zarinpal"
      ? "زرین‌پال"
      : paymentMethod === "saman"
        ? "بانک سامان"
        : "کیف پول";

  const payment = await repository.createPayment({
    userId: user.id,
    courseId,
    amount: course.price,
    status: "PENDING",
    method: methodLabel,
  });

  // Build a signed callback URL. The HMAC proves this URL was minted by us
  // for this specific payment — the callback will reject anything unsigned
  // or tampered with, so an attacker can't confirm an order out of band.
  const callbackUrl = buildCallbackUrl(payment.id);

  return NextResponse.json({
    payment,
    callbackUrl,
    message: "در حال انتقال به درگاه پرداخت (شبیه‌سازی)...",
    simulated: true,
  });
}
