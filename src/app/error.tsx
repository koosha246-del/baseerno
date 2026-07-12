"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Global error boundary — branded error UI.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans antialiased">
        <Container width="narrow" className="flex flex-col items-center gap-6 text-center">
          <span className="flex size-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
            <AlertTriangle className="size-10" />
          </span>
          <h1 className="font-display text-3xl font-extrabold text-fg-primary">
            خطایی رخ داده است
          </h1>
          <p className="max-w-md text-base text-fg-secondary">
            متأسفانه در پردازش درخواست شما مشکلی پیش آمد. لطفاً دوباره تلاش کنید.
          </p>
          {error.digest ? (
            <p className="text-xs text-fg-muted">کد خطا: {error.digest}</p>
          ) : null}
          <Button variant="brand" size="lg" onClick={() => reset()}>
            <RotateCcw className="size-4" />
            تلاش دوباره
          </Button>
        </Container>
      </body>
    </html>
  );
}
