import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: `سیاست حفظ حریم خصوصی آکادمی ${siteConfig.name}`,
};

const sections = [
  {
    title: "۱. اطلاعاتی که جمع‌آوری می‌کنیم",
    body: "برای ارائه خدمات بهتر، این اطلاعات رو ذخیره می‌کنیم: نام، ایمیل، شماره تماس (اختیاری)، عکس پروفایل (اختیاری)، اطلاعات پرداخت (از طریق درگاه امن)، پیشرفت تحصیلی و نمرات شما. هیچ اطلاعاتی خارج از این موارد جمع‌آوری نمی‌شود.",
  },
  {
    title: "۲. نحوه استفاده از اطلاعات",
    body: "از اطلاعات شما فقط برای ارائه خدمات آموزشی، صدور گواهی‌نامه، بهبود محتوا، و اطلاع‌رسانی دوره‌های جدید استفاده می‌شود. ما هرگز اطلاعات شخصی شما را به شخص ثالث نمی‌فروشیم یا اجاره نمی‌دهیم.",
  },
  {
    title: "۳. امنیت اطلاعات",
    body: "رمز عبور شما با الگوریتم bcrypt و ۱۲ دور هش می‌شود. ارتباطات از طریق HTTPS رمزگذاری شده‌اند. داده‌های حساس مثل اطلاعات پرداخت، مستقیماً توسط درگاه بانکی پردازش می‌شوند و هرگز روی سرورهای ما ذخیره نمی‌شوند.",
  },
  {
    title: "۴. کوکی‌ها",
    body: "ما از کوکی‌های ضروری برای احراز هویت استفاده می‌کنیم. هیچ کوکی تبلیغاتی یا ردیابی شخص ثالث نداریم. می‌توانید کوکی‌ها را در تنظیمات مرورگر غیرفعال کنید، اما ممکن است برخی قابلیت‌ها کار نکنند.",
  },
  {
    title: "۵. حقوق شما",
    body: "شما حق دارید: (الف) تمام اطلاعات خود را ببینید، (ب) آن‌ها را ویرایش کنید، (پ) حساب کاربری خود را حذف کنید، (ت) از خبرنامه انصراف دهید. برای هر کدام، به پشتیبانی پیام دهید.",
  },
  {
    title: "۶. نگهداری داده‌ها",
    body: "اگر ۲ سال از آخرین فعالیت شما بگذرد، حساب شما غیرفعال می‌شود. پس از ۵ سال عدم فعالیت، حساب و داده‌های شما به طور کامل حذف می‌شوند. در هر زمان می‌توانید درخواست حذف فوری بدهید.",
  },
  {
    title: "۷. تغییرات در سیاست حریم خصوصی",
    body: "اگر تغییر مهمی در سیاست بدهیم، از طریق ایمیل به شما اطلاع می‌دهیم. ادامه استفاده از خدمات به منزله پذیرش تغییرات است.",
  },
  {
    title: "۸. تماس با ما",
    body: `برای هر سوال درباره حریم خصوصی، با ما تماس بگیرید: ${siteConfig.contact.email}`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-background pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="narrow">
        <header className="mb-10 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-pill bg-kid-sky-100 px-4 py-1.5 text-sm font-semibold text-kid-sky-600">
            سیاست حفظ حریم خصوصی
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-4xl">
            حریم خصوصی شما برای ما مهمه
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-fg-secondary">
            آخرین به‌روزرسانی: فروردین ۱۴۰۳
          </p>
        </header>

        <div className="rounded-3xl border border-app-border-subtle bg-surface p-6 sm:p-8">
          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="font-display text-lg font-bold text-fg-primary">
                  {s.title}
                </h2>
                <p className="mt-3 text-sm leading-loose text-fg-secondary">
                  {s.body}
                </p>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-fg-muted">
          سوالی داری؟ <a href="/contact" className="text-accent hover:underline">تماس با ما</a>
        </p>
      </Container>
    </main>
  );
}
