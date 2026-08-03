import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "شرایط و قوانین",
  description: `شرایط استفاده از خدمات آکادمی ${siteConfig.name}`,
};

const sections = [
  {
    title: "۱. پذیرش شرایط",
    body: "با ثبت‌نام و استفاده از خدمات آکادمی بصیر نو، شما این شرایط را می‌پذیرید. اگر با هر بخشی موافق نیستید، لطفاً از خدمات ما استفاده نکنید.",
  },
  {
    title: "۲. حساب کاربری",
    body: "برای استفاده از خدمات باید یک حساب کاربری ایجاد کنید. مسئولیت حفظ امنیت رمز عبور و تمام فعالیت‌های حساب شما با خودتان است. در صورت مشاهده فعالیت مشکوک، فوراً به ما اطلاع دهید.",
  },
  {
    title: "۳. محتوا و مالکیت معنوی",
    body: "تمام محتوای دوره‌ها (ویدیو، متن، تمرین، صدا) متعلق به آکادمی بصیر نو و اساتید ماست. شما می‌توانید برای استفاده شخصی از محتوا استفاده کنید، اما کپی، پخش مجدد، یا فروش آن‌ها بدون اجازه کتبی ممنوع است.",
  },
  {
    title: "۴. پرداخت و بازگشت وجه",
    body: "هزینه دوره‌ها و کتاب‌ها در زمان ثبت‌نام پرداخت می‌شود. اگر تا ۷ روز بعد از خرید دوره، کمتر از ۲۰٪ محتوا را دیده باشید، می‌توانید درخواست بازگشت وجه کامل بدهید. برای کتاب‌های دانلودی، بازگشت وجه فقط در صورت مشکل در فایل امکان‌پذیر است.",
  },
  {
    title: "۵. رفتار کاربران",
    body: "از ما انتظار داریم: احترام به اساتید و سایر دانش‌آموزان، عدم کپی‌برداری از محتوا، عدم تلاش برای هک یا سوءاستفاده. در صورت نقض، حساب شما بدون بازگشت وجه مسدود می‌شود.",
  },
  {
    title: "۶. دسترسی و آپتایم",
    body: "ما تلاش می‌کنیم ۹۹٪ از زمان خدمات در دسترس باشد. ممکن است گاهی به دلیل نگهداری یا مشکلات فنی، سرویس قطع شود. در این صورت، زمان قطعی به زمان اشتراک شما اضافه می‌شود.",
  },
  {
    title: "۷. تغییرات در شرایط",
    body: "ما حق تغییر این شرایط را داریم. تغییرات مهم حداقل ۳۰ روز قبل از اجرا به شما اطلاع‌رسانی می‌شود. ادامه استفاده به منزله پذیرش تغییرات است.",
  },
  {
    title: "۸. فسخ",
    body: "شما می‌توانید هر زمان حساب خود را ببندید. ما نیز می‌توانیم در صورت نقض شرایط یا عدم فعالیت طولانی، حساب را غیرفعال کنیم. در صورت فسخ توسط ما بدون دلیل موجه، هزینه دوره‌های خریداری‌نشده برگشت داده می‌شود.",
  },
  {
    title: "۹. محدودیت مسئولیت",
    body: "ما مسئول خسارات غیرمستقیم، از دست دادن داده‌ها، یا وقفه‌های خارج از کنترل نیستیم. حداکثر مسئولیت ما محدود به هزینه‌ای است که برای خدمات پرداخت کرده‌اید.",
  },
  {
    title: "۱۰. قانون حاکم",
    body: "این شرایط طبق قوانین جمهوری اسلامی ایران تفسیر و اجرا می‌شود. هر گونه اختلاف از طریق مذاکره حل می‌شود و در غیر این صورت، مراجع قضایی صالح در تهران صلاحیت رسیدگی دارند.",
  },
  {
    title: "۱۱. تماس با ما",
    body: `سوالی درباره شرایط دارید؟ ${siteConfig.contact.email}`,
  },
];

export default function TermsPage() {
  return (
    <main className="bg-background pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="narrow">
        <header className="mb-10 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-pill bg-kid-coral-100 px-4 py-1.5 text-sm font-semibold text-kid-coral-600">
            شرایط و قوانین استفاده
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-4xl">
            شرایط استفاده از خدمات
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
          با ثبت‌نام، این شرایط رو می‌پذیری. سوالی داری؟{" "}
          <a href="/contact" className="text-accent hover:underline">تماس با ما</a>
        </p>
      </Container>
    </main>
  );
}
