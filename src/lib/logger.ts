/**
 * Structured logger — severity levels, request context, Sentry integration.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("User registered", { userId: "u-1" });
 *   logger.error("Payment failed", { paymentId, error: err.message });
 *
 * In development: pretty-print with colors and stack traces.
 * In production: structured JSON + send errors/warnings to Sentry.
 *
 * Tests: This module is NOT mocked in tests. Tests that call logger.*
 * will write to `console.*` via the fallback only — Sentry is never
 * called in test mode because `NODE_ENV !== "production"`.
 */
import { env } from "@/lib/env";

type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  /** Request correlation id (set by the caller or middleware). */
  requestId?: string;
  /** Authenticated user id when available. */
  userId?: string;
  /** Request path. */
  path?: string;
  /** HTTP method. */
  method?: string;
  /** Additional structured fields. */
  [key: string]: unknown;
}

let sentryCapture: ((error: Error, meta?: Record<string, unknown>) => void) | null = null;

/**
 * Lazy-load Sentry client for error capturing.
 * Avoids importing Sentry at module level (which has side-effects).
 */
async function ensureSentry() {
  if (sentryCapture) return;
  if (!env.SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    sentryCapture = (error: Error, meta?: Record<string, unknown>) => {
      Sentry.captureException(error, { extra: meta });
    };
  } catch {
    // Sentry not configured or not available
  }
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatDevLog(level: LogLevel, message: string, meta?: LogMeta) {
  const ts = formatTimestamp();
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
  const metaStr = meta && Object.keys(meta).length > 0
    ? ` ${JSON.stringify(meta, null, env.isDevelopment ? 2 : 0)}`
    : "";
  return `${prefix} [${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function writeToConsole(level: LogLevel, message: string, meta?: LogMeta) {
  const output = formatDevLog(level, message, meta);
  switch (level) {
    case "error":
      console.error(output);
      if (meta?.error instanceof Error && env.isDevelopment) {
        console.error(meta.error.stack);
      }
      break;
    case "warn":
      console.warn(output);
      break;
    case "info":
    default:
      console.log(output);
      break;
  }
}

async function captureToSentry(level: LogLevel, message: string, meta?: LogMeta) {
  if (level !== "error" && level !== "warn") return;
  if (!env.SENTRY_DSN) return;
  await ensureSentry();
  if (sentryCapture && meta?.error instanceof Error) {
    sentryCapture(meta.error, { message, ...meta });
  }
}

function log(level: LogLevel, message: string, meta?: LogMeta) {
  writeToConsole(level, message, meta);

  // In production, also send errors/warnings to Sentry
  if (env.isProduction) {
    captureToSentry(level, message, meta).catch(() => {
      /* Sentry capture failure must not break the app */
    });
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => log("info", message, meta),
  warn: (message: string, meta?: LogMeta) => log("warn", message, meta),
  error: (message: string, meta?: LogMeta) => log("error", message, meta),
};
