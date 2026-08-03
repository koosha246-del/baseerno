/**
 * Structured logger — JSON lines with levels, requestId and redaction.
 *
 * No external dependency (keeps the runtime lean): writes JSON to
 * stdout/stderr so any log shipper (Axiom, Grafana, Vercel Logs) can
 * ingest it. Every log line carries:
 *   - level / time / message
 *   - requestId (from the request, when available)
 *   - arbitrary fields, with sensitive keys redacted
 *
 * Usage:
 *   import { log } from "@/lib/log";
 *   log.info("payment marked paid", { paymentId, userId });
 *   log.error("LLM request failed", { httpStatus: 429 });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

/** Keys whose values must never reach the logs. All lowercase — the
 *  redaction check compares `key.toLowerCase()`, so the set must be
 *  normalized or camelCase keys like `passwordHash` would leak. */
const REDACT_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "authorization",
  "cookie",
  "secret",
  "apikey",
  "api_key",
  "sig",
  "jwt",
  "email", // PII — emails stay out of logs by default
]);

function redactValue(key: string, value: unknown): unknown {
  if (REDACT_KEYS.has(key.toLowerCase())) return "[REDACTED]";
  if (value && typeof value === "object") {
    if (Array.isArray(value)) return value.map((v) => redactValue(key, v));
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.has(k.toLowerCase())
        ? "[REDACTED]"
        : redactValue(k, v);
    }
    return out;
  }
  return value;
}

/** Current request id — set per request by api-middleware. */
let currentRequestId: string | undefined;

export function setRequestId(requestId: string | undefined): void {
  currentRequestId = requestId;
}

export function getRequestId(): string | undefined {
  return currentRequestId;
}

function emit(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
  const line: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    message,
    requestId: currentRequestId,
  };
  if (fields) {
    for (const [k, v] of Object.entries(fields)) {
      line[k] = redactValue(k, v);
    }
  }
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const log = {
  debug: (message: string, fields?: Record<string, unknown>) => emit("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) => emit("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => emit("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => emit("error", message, fields),
};

/** Convenience: redact an object's sensitive fields before logging. */
export function sanitize(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    out[k] = redactValue(k, v);
  }
  return out;
}
