import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { contactFormEmail } from "@/lib/email-templates";
import { siteConfig } from "@/config/site";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد."),
  email: z.string().email("ایمیل معتبر نیست."),
  subject: z.string().min(3, "موضوع باید حداقل ۳ حرف باشد.").max(200),
  message: z.string().min(10, "پیام باید حداقل ۱۰ کاراکتر باشد.").max(2000),
});

async function contactHandler(req: Request) {
  // CSRF: protect the contact form against cross-site spam.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
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

  const { name, email, subject, message } = parsed.data;

  // Send the message to site admin
  const adminEmail = contactFormEmail({ name, email, subject, message });
  const sent = await sendEmail({
    to: siteConfig.contact.email,
    subject: `[تماس با ما] ${subject}`,
    html: adminEmail,
  });

  if (!sent) {
    return NextResponse.json(
      { error: "ارسال پیام با خطا مواجه شد. لطفاً بعداً تلاش کنید." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "پیام شما با موفقیت ارسال شد. به‌زودی پاسخ می‌دهیم.",
  });
}

/** API: max=20, burst=5 per minute. */
export const POST = withRateLimit(contactHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "contact",
});
