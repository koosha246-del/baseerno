import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Container width="narrow">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-surface-subtle">
            <WifiOff className="size-10 text-fg-muted" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-fg-primary">
            اتصال اینترنت قطع است
          </h1>
          <p className="max-w-md text-lg text-fg-secondary">
            برای دسترسی به تمام امکانات سایت، لطفاً اتصال اینترنت خود را بررسی کنید.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-hover"
          >
            تلاش مجدد
          </Link>
        </div>
      </Container>
    </main>
  );
}
