import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Library, MessageCircle, Search, GraduationCap, ArrowLeft } from "lucide-react";

/**
 * 404 — branded not-found page.
 * Renders the brand gradient on the "۴۰۴" so it feels intentional,
 * and surfaces a few high-traffic destinations so the visitor has
 * somewhere to go besides back-button.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[85vh] items-center bg-background">
      <Container width="narrow" className="py-12">
        <div className="flex flex-col items-center text-center">
          {/* ۴۰۴ in brand gradient */}
          <span className="font-display text-[8rem] font-black leading-none bg-brand-gradient-rtl bg-clip-text text-transparent sm:text-[10rem]">
            ۴۰۴
          </span>

          <h1 className="mt-4 font-display text-2xl font-extrabold text-fg-primary sm:text-3xl">
            صفحه‌ای که دنبال آن هستید پیدا نشد
          </h1>
          <p className="mt-3 max-w-md text-base leading-loose text-fg-secondary">
            ممکنه آدرس اشتباه وارد شده باشه، صفحه منتقل شده باشه، یا دیگه 
            وجود نداشته باشه. نگران نباشید — راه‌های زیادی برای ادامه دارید.
          </p>

          {/* Primary actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="brand" size="lg">
              <Link href="/">
                <Home className="size-4" />
                بازگشت به خانه
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                <MessageCircle className="size-4" />
                گزارش مشکل
              </Link>
            </Button>
          </div>

          {/* Quick links */}
          <div className="mt-12 w-full max-w-2xl">
            <p className="mb-4 text-sm font-semibold text-fg-secondary">
              یا این صفحات رو امتحان کن:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickLink
                href="/courses"
                icon={BookOpen}
                title="دوره‌ها"
                description="بیش از ۴۰ دوره فعال"
                color="bg-kid-sky-50 text-kid-sky-600"
              />
              <QuickLink
                href="/library"
                icon={Library}
                title="کتابخانه"
                description="منابع آموزشی"
                color="bg-kid-coral-50 text-kid-coral-600"
              />
              <QuickLink
                href="/about"
                icon={GraduationCap}
                title="درباره ما"
                description="با تیم ما آشنا شو"
                color="bg-kid-mint-50 text-kid-mint-600"
              />
            </div>
          </div>

          <div className="mt-10 flex items-center gap-2 text-xs text-fg-muted">
            <Search className="size-3.5" />
            می‌تونی از جستجوی بالای صفحه هم استفاده کنی
          </div>
        </div>
      </Container>
    </main>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2 rounded-2xl border border-app-border-subtle bg-surface p-4 text-right transition-all hover:-translate-y-0.5 hover:border-kid-coral-200 hover:shadow-sm"
    >
      <span className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="size-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-bold text-fg-primary">{title}</p>
        <p className="text-xs text-fg-secondary">{description}</p>
      </div>
      <ArrowLeft className="size-4 text-fg-muted transition-transform group-hover:-translate-x-0.5" />
    </Link>
  );
}
