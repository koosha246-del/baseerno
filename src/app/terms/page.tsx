import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "شرایط و قوانین",
  description: `شرایط استفاده از خدمات آکادمی ${siteConfig.name}`,
};

export default function TermsPage() {
  return (
    <main className="pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="narrow">
        <h1 className="mb-8 font-display text-3xl font-extrabold tracking-tight text-fg-primary">
          شرایط و قوانین استفاده
        </h1>

        <div className="prose prose-slate max-w-none leading-loose text-fg-secondary">
          <h2 className="font-display text-xl font-bold text-fg-primary">۱. پذیرش شرایط</h2>
          <p>
            با استفاده از وبسایت و خدمات آکادمی {siteConfig.name}، شما این شرایط را می‌پذیرید.
            در صورت عدم موافقت، لطفاً از خدمات ما استفاده نکنید.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۲. ثبت‌نام و حساب کاربری</h2>
          <p>
            برای استفاده از دوره‌ها، ثبت‌نام با اطلاعات صحیح و کامل الزامی است. مسئولیت حفظ
            امنیت حساب کاربری بر عهده شماست.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۳. پرداخت و بازپرداخت</h2>
          <p>
            پرداخت هزینه دوره‌ها از طریق درگاه‌های معتبر بانکی انجام می‌شود. در صورت انصراف
            قبل از شروع دوره، بازپرداخت کامل انجام می‌شود. پس از شروع دوره، بازپرداخت بر
            اساس سیاست‌های داخلی آکادمی خواهد بود.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۴. مالکیت فکری</h2>
          <p>
            تمام محتوای آموزشی شامل ویدیوها، جزوات و تمرین‌ها متعلق به آکادمی {siteConfig.name} است.
            هرگونه کپی‌برداری، توزیع یا بازنشر بدون مجوز کتبی ممنوع است.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۵. رفتار کاربران</h2>
          <p>
            کاربران متعهد به رفتار محترمانه در محیط آکادمی هستند. هرگونه رفتار نامناسب،
            توهین یا سوءاستفاده منجر به تعلیق حساب خواهد شد.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۶. تغییرات</h2>
          <p>
            آکادمی {siteConfig.name} حق تغییر این شرایط را برای خود محفوظ می‌دارد. تغییرات
            از طریق وبسایت اطلاع‌رسانی خواهد شد.
          </p>

          <p className="mt-8 text-sm text-fg-muted">
            آخرین به‌روزرسانی: دی ۱۴۰۳
          </p>
        </div>
      </Container>
    </main>
  );
}
