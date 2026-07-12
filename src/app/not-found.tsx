import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { Home } from "lucide-react";
import Link from "next/link";

/**
 * 404 — branded not-found page.
 */
export default function NotFound() {
  return (
    <Container width="narrow" className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <span className="font-display text-8xl font-black text-brand-gradient-rtl bg-clip-text text-transparent">
        ۴۰۴
      </span>
      <h1 className="font-display text-2xl font-bold text-fg-primary">
        صفحه‌ای که دنبال آن هستید پیدا نشد
      </h1>
      <p className="max-w-md text-base text-fg-secondary">
        ممکن است آدرس اشتباه وارد شده باشد یا صفحه مورد نظر جابجا شده باشد.
      </p>
      <Button asChild variant="brand" size="lg">
        <Link href="/">
          <Home className="size-4" />
          بازگشت به خانه
        </Link>
      </Button>
    </Container>
  );
}
