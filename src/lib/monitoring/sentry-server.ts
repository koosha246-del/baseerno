/**
 * Sentry — server-side error tracking.
 * Lazy-loaded so the SDK is only pulled when SENTRY_DSN is set.
 * Use `captureServerError(err, context?)` from API routes / server actions
 * to report exceptions with extra context.
 */

interface SentryContext {
  tags?: Record<string, string>;
  user?: { id?: string; email?: string };
  extra?: Record<string, unknown>;
}

interface SentryScopeLike {
  setTag: (k: string, v: string) => void;
  setUser: (u: unknown) => void;
  setExtra: (k: string, v: unknown) => void;
}

interface SentryLike {
  captureException: (err: unknown) => void;
  withScope: (cb: (scope: SentryScopeLike) => void) => void;
  setTag: (k: string, v: string) => void;
}

let cached: SentryLike | null = null;
let loadAttempted = false;

async function getSentry(): Promise<SentryLike | null> {
  if (loadAttempted) return cached;
  loadAttempted = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  try {
    // Dynamic import so Sentry is only loaded in production with a DSN.
    const moduleName = "@sentry/node";
    const mod = await import(/* webpackIgnore: true */ moduleName).catch(
      () => null
    );
    if (mod && typeof (mod as SentryLike).captureException === "function") {
      const sentry = mod as unknown as SentryLike;
      sentry.setTag("app", "bayan-bartar");
      cached = sentry;
    }
  } catch {
    // @sentry/node not installed — silently fall back to console.
  }
  return cached;
}

export async function captureServerError(
  err: unknown,
  context?: SentryContext
): Promise<void> {
  const sentry = await getSentry();
  if (!sentry) {
    // Fallback: log to stderr for visibility.
    // eslint-disable-next-line no-console
    console.error("[server-error]", err, context);
    return;
  }
  sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [k, v] of Object.entries(context.tags)) scope.setTag(k, v);
    }
    if (context?.user) scope.setUser(context.user);
    if (context?.extra) {
      for (const [k, v] of Object.entries(context.extra)) scope.setExtra(k, v);
    }
    sentry.captureException(err);
  });
}
