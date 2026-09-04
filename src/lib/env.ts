/**
 * Central environment validation — fail-fast in production, soft defaults in dev/test.
 *
 * Import `env` instead of reading `process.env` directly in server code so
 * missing/invalid secrets surface at startup (or first import) rather than
 * mid-request with opaque 500s.
 */

import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,

  /** PostgreSQL connection string — required whenever the DB client is used. */
  DATABASE_URL: z.string().optional(),

  /**
   * Direct (non-pooled) PostgreSQL connection string. When set, the app
   * connects through `DATABASE_URL` (pooled) and Prisma migrations use
   * `DIRECT_URL` — the standard Supabase/Neon pooling pattern.
   */
  DIRECT_URL: z.string().optional(),

  /**
   * Read-replica connection string (optional). When set, read-only
   * dashboard/report queries run against the replica with automatic
   * fallback to the primary.
   */
  REPLICA_URL: z.string().optional(),

  /** JWT signing secret — min 32 chars in production. */
  JWT_SECRET: z.string().optional(),

  /**
   * Previous JWT secret — enabled during key rotation. Tokens signed
   * with the old secret stay valid until expiry (dual-key verify).
   */
  JWT_SECRET_OLD: z.string().optional(),

  /** HMAC secret for simulated payment callbacks. */
  PAYMENT_SIGNATURE_SECRET: z.string().optional(),

  /** Previous payment signature secret — accepted during rotation. */
  PAYMENT_SIGNATURE_SECRET_OLD: z.string().optional(),

  /** Zarinpal merchant UUID. When set, real gateway is used for paid checkouts. */
  ZARINPAL_MERCHANT_ID: z.string().optional(),

  /** Use Zarinpal sandbox endpoints when "true". */
  ZARINPAL_SANDBOX: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),

  /**
   * Demo mode — login works against built-in demo accounts even when
   * PostgreSQL is unreachable, so the app can be explored without a DB.
   * Never enable in production (checked at startup).
   */
  DEMO_MODE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),

  RESEND_API_KEY: z.string().optional(),

  /**
   * Optional LLM API key (AI tutor). When absent the AI endpoints return
   * a canned Persian mock response so development works offline.
   */
  AI_API_KEY: z.string().optional(),
  /** Optional LLM base URL — defaults to the OpenAI-compatible endpoint. */
  AI_BASE_URL: z.string().url().optional(),
  /** Optional model name — defaults to "gpt-4o-mini". */
  AI_MODEL: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  /** Redis URL for multi-instance rate limiting. Falls back to in-memory when unset. */
  REDIS_URL: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  /** Dedicated search engine (Meilisearch/Typesense-compatible REST). */
  SEARCH_HOST: z.string().url().optional(),
  SEARCH_API_KEY: z.string().optional(),

  /** Google reCAPTCHA v3 secret — when unset, captcha verification auto-passes (dev/test). */
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  /** Public site origin (used for payment callbacks / absolute URLs). */
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  NEXT_PUBLIC_GA_ID: z.string().optional(),

  /**
   * Load-test regression severity (%) above which admins are paged by
   * email (in-app notifications always fire). Default 50.
   */
  LOAD_REGRESSION_EMAIL_THRESHOLD: z.coerce.number().min(0).max(100).optional(),

  /**
   * Secret for /api/cron/* — sent as `Authorization: Bearer <CRON_SECRET>`
   * (Vercel managed cron) or `x-cron-secret: <CRON_SECRET>` (external
   * schedulers). When unset the cron endpoints fail closed (401).
   */
  CRON_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema> & {
  /** Resolved secrets with safe dev fallbacks applied. */
  jwtSecret: string;
  paymentSignatureSecret: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  /** True when a real Zarinpal merchant id is configured. */
  zarinpalEnabled: boolean;
  /** True when a reCAPTCHA secret is configured (so verification is enforced). */
  captchaConfigured: boolean;
  /** True when demo mode is enabled (auth works without a database). */
  demoMode: boolean;
};

const DEV_JWT_FALLBACK = "dev-only-insecure-secret-do-not-use-in-production";
const DEV_PAYMENT_FALLBACK = "dev-only-insecure-payment-secret";

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

/** Convert empty strings to undefined so Zod .optional() works correctly. */
function emptyToUndef(v: string | undefined): string | undefined {
  return v && v.length > 0 ? v : undefined;
}

/** Prepend https:// if the URL has no protocol. */
function normalizeUrl(v: string | undefined): string | undefined {
  if (!v) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

function loadEnv(): Env {
  // Detect build time early — during `next build` route modules are evaluated
  // but runtime env vars are not injected yet.  We skip Zod errors so
  // `docker build` (Railway) doesn't crash.
  // process.argv may not exist in Edge runtime (middleware), so guard it.
  const argv: string[] =
    typeof process !== "undefined" && Array.isArray(process.argv)
      ? process.argv
      : [];
  const isBuildTime =
    (argv.length > 1 && argv[1] !== undefined && argv[1].includes("next")) ||
    argv.some((a) => a.includes("next/dist/bin/next")) ||
    process.env?.NEXT_PHASE === "phase-production-build";

  // In Edge runtime (middleware), skip heavy validation entirely.
  // NEXT_RUNTIME is the variable Next.js actually sets ("edge" | "nodejs");
  // the previous __NEXT_PRIVATE_RENDER_RUNTIME check never matched, making
  // this branch dead code.
  if (process.env?.NEXT_RUNTIME === "edge") {
    return {
      NODE_ENV: "production",
      DATABASE_URL: undefined,
      DIRECT_URL: undefined,
      REPLICA_URL: undefined,
      JWT_SECRET: undefined,
      JWT_SECRET_OLD: undefined,
      PAYMENT_SIGNATURE_SECRET: undefined,
      PAYMENT_SIGNATURE_SECRET_OLD: undefined,
      ZARINPAL_MERCHANT_ID: undefined,
      ZARINPAL_SANDBOX: false,
      DEMO_MODE: false,
      RESEND_API_KEY: undefined,
      AI_API_KEY: undefined,
      AI_BASE_URL: undefined,
      AI_MODEL: undefined,
      CLOUDINARY_CLOUD_NAME: undefined,
      CLOUDINARY_API_KEY: undefined,
      CLOUDINARY_API_SECRET: undefined,
      REDIS_URL: undefined,
      SENTRY_DSN: undefined,
      SEARCH_HOST: undefined,
      SEARCH_API_KEY: undefined,
      RECAPTCHA_SECRET_KEY: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_GA_ID: undefined,
      LOAD_REGRESSION_EMAIL_THRESHOLD: undefined,
      CRON_SECRET: undefined,
      jwtSecret: process.env?.JWT_SECRET || "",
      paymentSignatureSecret: process.env?.PAYMENT_SIGNATURE_SECRET || "",
      isProduction: true,
      isDevelopment: false,
      isTest: false,
      zarinpalEnabled: false,
      captchaConfigured: false,
      demoMode: false,
    };
  }

  const raw: Record<string, unknown> = {
    NODE_ENV: process.env.NODE_ENV || (isBuildTime ? "production" : "development"),
    DATABASE_URL: emptyToUndef(process.env.DATABASE_URL),
    DIRECT_URL: emptyToUndef(process.env.DIRECT_URL),
    REPLICA_URL: emptyToUndef(process.env.REPLICA_URL),
    JWT_SECRET: emptyToUndef(process.env.JWT_SECRET),
    JWT_SECRET_OLD: emptyToUndef(process.env.JWT_SECRET_OLD),
    PAYMENT_SIGNATURE_SECRET: emptyToUndef(process.env.PAYMENT_SIGNATURE_SECRET),
    PAYMENT_SIGNATURE_SECRET_OLD: emptyToUndef(process.env.PAYMENT_SIGNATURE_SECRET_OLD),
    ZARINPAL_MERCHANT_ID: emptyToUndef(process.env.ZARINPAL_MERCHANT_ID),
    ZARINPAL_SANDBOX: emptyToUndef(process.env.ZARINPAL_SANDBOX),
    DEMO_MODE: emptyToUndef(process.env.DEMO_MODE),
    RESEND_API_KEY: emptyToUndef(process.env.RESEND_API_KEY),
    CLOUDINARY_CLOUD_NAME: emptyToUndef(process.env.CLOUDINARY_CLOUD_NAME),
    CLOUDINARY_API_KEY: emptyToUndef(process.env.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: emptyToUndef(process.env.CLOUDINARY_API_SECRET),
    REDIS_URL: emptyToUndef(process.env.REDIS_URL),
    SENTRY_DSN: emptyToUndef(process.env.SENTRY_DSN),
    RECAPTCHA_SECRET_KEY: emptyToUndef(process.env.RECAPTCHA_SECRET_KEY),
    SEARCH_HOST: emptyToUndef(process.env.SEARCH_HOST),
    SEARCH_API_KEY: emptyToUndef(process.env.SEARCH_API_KEY),
    NEXT_PUBLIC_SITE_URL: normalizeUrl(emptyToUndef(process.env.NEXT_PUBLIC_SITE_URL)),
    NEXT_PUBLIC_GA_ID: emptyToUndef(process.env.NEXT_PUBLIC_GA_ID),
    LOAD_REGRESSION_EMAIL_THRESHOLD: process.env.LOAD_REGRESSION_EMAIL_THRESHOLD,
    CRON_SECRET: emptyToUndef(process.env.CRON_SECRET),
  };

  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    if (isBuildTime) {
      // During `next build` in Docker, route modules are evaluated but runtime
      // env vars may be empty/missing. Return a safe dummy object so the build
      // succeeds — the real values are injected at runtime by Railway.
      console.warn("⚠️ Build-time env validation skipped (vars will be set at runtime)");
      return {
        NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || "production",
        DATABASE_URL: undefined,
        DIRECT_URL: undefined,
        REPLICA_URL: undefined,
        JWT_SECRET: undefined,
        JWT_SECRET_OLD: undefined,
        PAYMENT_SIGNATURE_SECRET: undefined,
        PAYMENT_SIGNATURE_SECRET_OLD: undefined,
        ZARINPAL_MERCHANT_ID: undefined,
        ZARINPAL_SANDBOX: false,
        DEMO_MODE: false,
        RESEND_API_KEY: undefined,
        AI_API_KEY: undefined,
        AI_BASE_URL: undefined,
        AI_MODEL: undefined,
        CLOUDINARY_CLOUD_NAME: undefined,
        CLOUDINARY_API_KEY: undefined,
        CLOUDINARY_API_SECRET: undefined,
        REDIS_URL: undefined,
        SENTRY_DSN: undefined,
        SEARCH_HOST: undefined,
        SEARCH_API_KEY: undefined,
        RECAPTCHA_SECRET_KEY: undefined,
        NEXT_PUBLIC_SITE_URL: undefined,
        NEXT_PUBLIC_GA_ID: undefined,
        LOAD_REGRESSION_EMAIL_THRESHOLD: undefined,
        jwtSecret: "",
        paymentSignatureSecret: "",
        isProduction: true,
        isDevelopment: false,
        isTest: false,
        zarinpalEnabled: false,
        captchaConfigured: false,
        demoMode: false,
      };
    }
    const msg = `Invalid environment variables:\n${formatZodError(parsed.error)}`;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }

  const data = parsed.data;
  const isProduction = data.NODE_ENV === "production";
  const isDevelopment = data.NODE_ENV === "development";
  const isTest = data.NODE_ENV === "test";

  // Production hard requirements
  // During `next build` (Docker build), route modules are evaluated at build
  // time but the runtime env vars may not yet be injected.  We skip the hard
  // validation when we detect a build process so that `docker build` doesn't
  // crash — the real values will be present when the runner starts.
  if (isProduction && !isBuildTime) {
    const productionErrors: string[] = [];

    if (!data.DATABASE_URL) {
      productionErrors.push("DATABASE_URL is required in production");
    }
    if (!data.JWT_SECRET || data.JWT_SECRET.length < 32) {
      productionErrors.push(
        "JWT_SECRET is required in production and must be at least 32 characters",
      );
    }
    if (!data.PAYMENT_SIGNATURE_SECRET || data.PAYMENT_SIGNATURE_SECRET.length < 16) {
      productionErrors.push(
        "PAYMENT_SIGNATURE_SECRET is required in production (min 16 characters)",
      );
    }
    if (data.DEMO_MODE) {
      productionErrors.push("DEMO_MODE must never be enabled in production");
    }

    if (productionErrors.length > 0) {
      const msg = `Invalid production environment:\n  • ${productionErrors.join("\n  • ")}`;
      console.error(`❌ ${msg}`);
      throw new Error(msg);
    }
  }

  const jwtSecret = data.JWT_SECRET || (isProduction ? "" : DEV_JWT_FALLBACK);
  const paymentSignatureSecret =
    data.PAYMENT_SIGNATURE_SECRET || (isProduction ? "" : DEV_PAYMENT_FALLBACK);

  return {
    ...data,
    jwtSecret,
    paymentSignatureSecret,
    isProduction,
    isDevelopment,
    isTest,
    zarinpalEnabled: Boolean(data.ZARINPAL_MERCHANT_ID?.trim()),
    captchaConfigured: Boolean(data.RECAPTCHA_SECRET_KEY?.trim()),
    demoMode: data.DEMO_MODE ?? false,
  };
}

/** Validated environment — throws on import in production if required vars are missing. */
export const env: Env = loadEnv();
