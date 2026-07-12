import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: `سیاست حفظ حریم خصوصی آکادمی ${siteConfig.name}`,
};

export default function PrivacyPage() {
  return (
    <main className="pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="narrow">
        <h1 className="mb-8 font-display text-3xl font-extrabold tracking-tight text-fg-primary">
          سیاست حفظ حریم خصوصی
        </h1>

        <div className="prose prose-slate max-w-none leading-loose text-fg-secondary">
          <h2 className="font-display text-xl font-bold text-fg-primary">۱. اطلاعات جمع‌آوری‌شده</h2>
          <p>
            ما اطلاعات شخصی شامل نام، ایمیل، شماره تماس و اطلاعات پرداخت را هنگام ثبت‌نام
            و استفاده از خدمات جمع‌آوری می‌کنیم.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۲. استفاده از اطلاعات</h2>
          <p>اطلاعات شما برای موارد زیر استفاده می‌شود:</p>
          <ul>
            <li>ارائه خدمات آموزشی</li>
            <li>مدیریت حساب کاربری و پرداخت‌ها</li>
            <li>ارتباط درباره دوره‌ها و به‌روزرسانی‌ها</li>
            <li>بهبود کیفیت خدمات</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-fg-primary">۳. حفاظت از اطلاعات</h2>
          <p>
            ما از رمزنگاری، دسترسی محدود و پروتکل‌های امنیتی استاندارد برای حفاظت از
            اطلاعات شما استفاده می‌کنیم. رمزهای عبور با الگوریتم bcrypt رمزنگاری می‌شوند.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۴. اشتراک‌گذاری اطلاعات</h2>
          <p>
            اطلاعات شما بدون رضایت صریح، به اشخاص ثالث فروخته یا اشتراک‌گذاری نمی‌شود.
            استثنا: ارائه‌دهندگان خدمات پرداخت که برای تراکنش‌ها ضروری هستند.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۵. کوکی‌ها</h2>
          <p>
            ما از کوکی‌های ضروری برای احراز هویت و مدیریت نشست استفاده می‌کنیم. این کوکی‌ها
            httpOnly و secure هستند.
          </p>

          <h2 className="font-display text-xl font-bold text-fg-primary">۶. حقوق شما</h2>
          <p>
            شما حق دسترسی، اصلاح و حذف اطلاعات شخصی خود را دارید. برای اعمال این حقوق،
            از طریق بخش تماس با ما اقدام کنید.
          </p>

          <p className="mt-8 text-sm text-fg-muted">
            آخرین به‌روزرسانی: دی ۱۴۰۳
          </p>
        </div>
      </Container>
    </main>
  );
}
