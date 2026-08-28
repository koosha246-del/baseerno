/**
 * Distributed tracing — OpenTelemetry integration with graceful fallback.
 *
 * When `OTEL_EXPORTER_OTLP_ENDPOINT` is set, spans are exported via OTLP.
 * When unset, tracing calls are no-ops (zero overhead, no dependency on
 * the OpenTelemetry SDK packages — keep the bundle lean).
 *
 * Usage:
 * ```ts
 * import { trace, traced } from "@/lib/tracing";
 *
 * // Manual span
 * const span = trace.startSpan("checkout.process", {
 *   attributes: { "checkout.amount": amount },
 * });
 * try {
 *   await processPayment();
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (err) {
 *   span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
 *   span.recordException(err as Error);
 *   throw err;
 * } finally {
 *   span.end();
 * }
 *
 * // Decorator-style (wraps an async function)
 * const fetchCourses = traced("db.courses.findMany", async (filters) => {
 *   return await prisma.course.findMany(filters);
 * }, { attributes: { "db.system": "postgresql" } });
 * ```
 *
 * Integration points (already instrumented):
 *   - src/middleware.ts → HTTP request spans
 *   - src/lib/db/prisma-client.ts → DB query spans (via observe)
 *   - src/lib/cache.ts → Cache hit/miss spans
 *   - src/lib/payment/zarinpal.ts → Payment gateway spans
 */

import { observe, incr } from "@/lib/metrics";

const OTEL_ENABLED = Boolean(
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT && process.env.OTEL_SERVICE_NAME,
);

export const SpanStatusCode = {
  UNSET: 0,
  OK: 1,
  ERROR: 2,
} as const;
export type SpanStatusCode = (typeof SpanStatusCode)[keyof typeof SpanStatusCode];

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

export interface SpanOptions {
  attributes?: Record<string, string | number | boolean>;
}

export interface Span {
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(status: SpanStatus): void;
  recordException(error: Error): void;
  end(): void;
}

class NoOpSpan implements Span {
  setAttribute(): void {}
  setStatus(): void {}
  recordException(): void {}
  end() {
    // no-op
  }
}

interface TraceInterface {
  startSpan(name: string, options?: SpanOptions): Span;
  traced<T>(
    name: string,
    fn: (...args: unknown[]) => Promise<T>,
    options?: SpanOptions,
  ): (...args: unknown[]) => Promise<T>;
  isEnabled(): boolean;
}

function createNoOpTrace(): TraceInterface {
  return {
    startSpan: () => new NoOpSpan(),
    traced: (_name, fn) => fn,
    isEnabled: () => false,
  };
}

function createOtelTrace(): TraceInterface {
  let otelApi: typeof import("@opentelemetry/api") | null = null;
  let otelLoadPromise: Promise<typeof import("@opentelemetry/api") | null> | null = null;

  async function loadOtel() {
    if (otelApi) return otelApi;
    if (!otelLoadPromise) {
      otelLoadPromise = import("@opentelemetry/api")
        .then((api) => {
          otelApi = api;
          return api;
        })
        .catch(() => null);
    }
    return otelLoadPromise;
  }

  // Eagerly start loading OTel in the background so future calls
  // may already have the module available.
  if (typeof window === "undefined") {
    void loadOtel();
  }

  return {
    startSpan(name: string, options?: SpanOptions): Span {
      const noop = new NoOpSpan();

      if (!otelApi) {
        // Fire-and-forget preload for next call; return noop for this one.
        void loadOtel();
        return noop;
      }

      try {
        const tracer = otelApi.trace.getTracer("baseerno", "1.0.0");
        const span = tracer.startSpan(name, {
          attributes: options?.attributes,
        });

        return {
          setAttribute(key: string, value: string | number | boolean) {
            span.setAttribute(key, value);
          },
          setStatus(status: SpanStatus) {
            span.setStatus({
              code: status.code,
              message: status.message,
            });
          },
          recordException(error: Error) {
            span.recordException(error);
          },
          end() {
            span.end();
          },
        };
      } catch {
        return noop;
      }
    },

    traced<T>(
      name: string,
      fn: (...args: unknown[]) => Promise<T>,
      options?: SpanOptions,
    ): (...args: unknown[]) => Promise<T> {
      return async (...args: unknown[]): Promise<T> => {
        const span = this.startSpan(name, options);
        const start = performance.now();
        try {
          const result = await fn(...args);
          span.setStatus({ code: SpanStatusCode.OK });
          observe(`trace:${name}`, performance.now() - start);
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: String(error),
          });
          span.recordException(error as Error);
          incr(`trace:${name}:error`);
          observe(`trace:${name}:error`, performance.now() - start);
          throw error;
        } finally {
          span.end();
        }
      };
    },

    isEnabled() {
      return true;
    },
  };
}

export const trace: TraceInterface = OTEL_ENABLED
  ? createOtelTrace()
  : createNoOpTrace();

export function isTracingEnabled(): boolean {
  return trace.isEnabled();
}
