import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyAdmins } from "@/lib/notifications";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

/** تبدیل ارقام فارسی/عربی به لاتین */
function normalizeDigits(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const fi = fa.indexOf(d);
    if (fi > -1) return String(fi);
    return String(ar.indexOf(d));
  });
}

const registrationSchema = z.object({
  parentName: z
    .string()
    .trim()
    .min(3, "نام خانوادگی/والد باید حداقل ۳ حرف باشد.")
    .max(60, "نام واردشده بیش از حد طولانی است."),
  studentName: z
    .string()
    .trim()
    .min(2, "نام زبان‌آموز باید حداقل ۲ حرف باشد.")
    .max(60, "نام واردشده بیش از حد طولانی است."),
  ageGroup: z.enum(["kids", "teens"], {
    message: "یک گروه سنی را انتخاب کنید.",
  }),
  phone: z
    .string()
    .trim()
    .transform(normalizeDigits)
    .pipe(
      z
        .string()
        .regex(/^09\d{9}$/, "شماره تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.")
    ),
  note: z.string().trim().max(500, "توضیحات بیش از حد طولانی است.").optional().or(z.literal("")),
});

/** SENSITIVE preset — public lead form, spam-attractive. */
export const POST = withRateLimit(registerHandler, RATE_LIMIT_PRESETS.SENSITIVE, {
  keyPrefix: "register",
});

async function registerHandler(request: Request) {
  try {
    // CSRF: same spam-amplification rationale as the contact route —
    // this is the only mutating public route without an origin check,
    // so any third-party site could cross-site post the lead form.
    if (!isSameOriginRequest(request)) {
      return csrfRejectedResponse();
    }

    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      // The landing form reads `message` — include a flattened summary so
      // real field errors reach the user instead of the generic toast.
      const firstError = Object.values(fieldErrors).flat()[0];
      return NextResponse.json(
        {
          ok: false,
          errors: fieldErrors,
          message: firstError ?? "ورودی نامعتبر است.",
        },
        { status: 422 }
      );
    }

    // Persist the lead where staff actually looks: an in-app notification
    // for every admin (bell + notifications page). notifyAdmins never
    // throws, so a notification failure can't fail the signup itself.
    const ageLabel = parsed.data.ageGroup === "kids" ? "کودکان" : "نوجوانان";
    await notifyAdmins(
      "درخواست ثبت‌نام جدید",
      `${parsed.data.parentName} (والد ${parsed.data.studentName}) — گروه سنی ${ageLabel} — تلفن: ${parsed.data.phone}${parsed.data.note ? ` — یادداشت: ${parsed.data.note}` : ""}`,
      "/dashboard/notifications",
    );
    console.log("[register] New registration:", parsed.data);

    return NextResponse.json({
      ok: true,
      message: "ثبت‌نام با موفقیت انجام شد. به زودی با شما تماس خواهیم گرفت.",
    });
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json(
      { ok: false, message: "خطای سرور. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
