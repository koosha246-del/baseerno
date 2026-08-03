"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Global error boundary — branded error UI.
 *
 * IMPORTANT: `app/error.tsx` renders INSIDE the root layout's existing
 * `<html>/<body>` (only `global-error.tsx` may render its own document
 * tags). Rendering nested `<html>/<body>` here produced invalid DOM that
 * browsers collapsed into a blank white page whenever a route threw.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans antialiased">
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
    </div>
  );
}
