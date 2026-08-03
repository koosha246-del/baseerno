/**
 * Email templates — Persian HTML emails for transactional messages.
 */

import { siteConfig } from "@/config/site";

const baseStyle = `
  font-family: Vazirmatn, Tahoma, sans-serif;
  direction: rtl;
  text-align: right;
  max-width: 600px;
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e6e3f0;
`;

const headerHtml = `
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(90deg, #1E3A5F, #2563EB, #D4A017, #F5C518); border-radius: 12px; color: white; font-size: 20px; font-weight: bold;">
      ${siteConfig.name}
    </div>
  </div>
`;

const footerHtml = `
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e6e3f0; text-align: center; color: #6b7280; font-size: 12px;">
    <p>آکادمی ${siteConfig.name} — ${siteConfig.tagline}</p>
    <p>${siteConfig.contact.email} | ${siteConfig.contact.phone}</p>
  </div>
`;

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: `خوش آمدید به ${siteConfig.name}`,
    html: `
      <div style="${baseStyle}">
        ${headerHtml}
        <h2 style="color: #0f172a; font-size: 22px;">سلام ${name} عزیز!</h2>
        <p style="color: #4b5563; line-height: 1.8; font-size: 15px;">
          ثبت‌نام شما در آکادمی ${siteConfig.name} با موفقیت انجام شد.
          اکنون می‌توانید وارد پنل کاربری خود شوید و از دوره‌های آموزشی استفاده کنید.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${siteConfig.url}/dashboard"
             style="display: inline-block; padding: 12px 32px; background: linear-gradient(90deg, #1E3A5F, #2563EB); color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
            ورود به پنل کاربری
          </a>
        </div>
        ${footerHtml}
      </div>
    `,
  };
}

export function paymentConfirmationEmail(
  name: string,
  courseTitle: string,
  amount: number
): { subject: string; html: string } {
  const formattedAmount = new Intl.NumberFormat("fa-IR").format(amount);
  return {
    subject: `تأیید پرداخت — ${courseTitle}`,
    html: `
      <div style="${baseStyle}">
        ${headerHtml}
        <h2 style="color: #0f172a; font-size: 22px;">پرداخت شما تأیید شد!</h2>
        <p style="color: #4b5563; line-height: 1.8; font-size: 15px;">
          ${name} عزیز، پرداخت شما برای دوره <strong>${courseTitle}</strong> با موفقیت انجام شد.
        </p>
        <div style="background: #f5f3fa; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #4b5563; font-size: 14px;">
            <strong>دوره:</strong> ${courseTitle}<br/>
            <strong>مبلغ:</strong> ${formattedAmount} تومان<br/>
            <strong>وضعیت:</strong> <span style="color: #15803d;">پرداخت موفق</span>
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${siteConfig.url}/dashboard/courses"
             style="display: inline-block; padding: 12px 32px; background: linear-gradient(90deg, #1E3A5F, #2563EB); color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
            مشاهده دوره
          </a>
        </div>
        ${footerHtml}
      </div>
    `,
  };
}

export function passwordResetEmail(
  name: string,
  resetUrl: string
): { subject: string; html: string } {
  return {
    subject: `بازیابی رمز عبور — ${siteConfig.name}`,
    html: `
      <div style="${baseStyle}">
        ${headerHtml}
        <h2 style="color: #0f172a; font-size: 22px;">بازیابی رمز عبور</h2>
        <p style="color: #4b5563; line-height: 1.8; font-size: 15px;">
          ${name} عزیز، درخواست بازیابی رمز عبور برای حساب شما ثبت شده است.
          روی دکمه زیر کلیک کنید تا رمز عبور جدید تنظیم کنید.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 32px; background: linear-gradient(90deg, #1E3A5F, #2563EB); color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
            تغییر رمز عبور
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">
          اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.
          این لینک تا یک ساعت معتبر است.
        </p>
        ${footerHtml}
      </div>
    `,
  };
}

export function contactFormEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return `
    <div style="${baseStyle}">
      ${headerHtml}
      <h2 style="color: #0f172a; font-size: 22px;">پیام جدید از فرم تماس</h2>
      <div style="background: #f5f3fa; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
          <strong>نام:</strong> ${escapeHtml(name)}
        </p>
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
          <strong>ایمیل:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #2563EB;">${escapeHtml(email)}</a>
        </p>
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
          <strong>موضوع:</strong> ${escapeHtml(subject)}
        </p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e6e3f0; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <p style="margin: 0; color: #1f2937; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="mailto:${escapeHtml(email)}?subject=Re: ${encodeURIComponent(subject)}"
           style="display: inline-block; padding: 12px 32px; background: linear-gradient(90deg, #1E3A5F, #2563EB); color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
          پاسخ به ${escapeHtml(name)}
        </a>
      </div>
      ${footerHtml}
    </div>
  `;
}

export function loadRegressionAlertEmail(
  scenario: string,
  currentP95: number,
  previousAvgP95: number,
  diffPercent: number,
): { subject: string; html: string } {
  const fmt = (n: number) => Math.round(n).toLocaleString("fa-IR");
  const diff = Math.round(diffPercent).toLocaleString("fa-IR");
  return {
    subject: `⚠️ رگرسیون عملکرد — ${scenario} p95`,
    html: `
      <div style="${baseStyle}">
        ${headerHtml}
        <h2 style="color: #0f172a; font-size: 22px;">هشدار: افت عملکرد در load test</h2>
        <p style="color: #4b5563; line-height: 1.8; font-size: 15px;">
          سناریوی <strong dir="ltr">${scenario}</strong> نسبت به میانگین اجراهای قبلی دچار رگرسیون شده است:
        </p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #991b1b; font-size: 14px;">
            <strong>p95 فعلی:</strong> ${fmt(currentP95)} ms
          </p>
          <p style="margin: 4px 0; color: #991b1b; font-size: 14px;">
            <strong>میانگین p95 قبلی:</strong> ${fmt(previousAvgP95)} ms
          </p>
          <p style="margin: 4px 0; color: #991b1b; font-size: 14px;">
            <strong>تغییر:</strong> +${diff}٪
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${siteConfig.url}/dashboard/ops/archive"
             style="display: inline-block; padding: 12px 32px; background: linear-gradient(90deg, #1E3A5F, #2563EB); color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
            مشاهده آرشیو اجراها
          </a>
        </div>
        ${footerHtml}
      </div>
    `,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
