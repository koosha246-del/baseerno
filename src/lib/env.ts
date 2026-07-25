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
  DATABASE_URL: z.string().min(1).optional(),

  /** JWT signing secret — min 32 chars in production. */
  JWT_SECRET: z.string().optional(),

  /** HMAC secret for simulated payment callbacks. */
  PAYMENT_SIGNATURE_SECRET: z.string().optional(),

  /** Zarinpal merchant UUID. When set, real gateway is used for paid checkouts. */
  ZARINPAL_MERCHANT_ID: z.string().optional(),

  /** Use Zarinpal sandbox endpoints when "true". */
  ZARINPAL_SANDBOX: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),

  RESEND_API_KEY: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  /** Redis URL for multi-instance rate limiting. Falls back to in-memory when unset. */
  REDIS_URL: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  /** Public site origin (used for payment callbacks / absolute URLs). */
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  NEXT_PUBLIC_GA_ID: z.string().optional(),
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
};

const DEV_JWT_FALLBACK = "dev-only-insecure-secret-do-not-use-in-production";
const DEV_PAYMENT_FALLBACK = "dev-only-insecure-payment-secret";

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    PAYMENT_SIGNATURE_SECRET: process.env.PAYMENT_SIGNATURE_SECRET,
    ZARINPAL_MERCHANT_ID: process.env.ZARINPAL_MERCHANT_ID,
    ZARINPAL_SANDBOX: process.env.ZARINPAL_SANDBOX,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  });

  if (!parsed.success) {
    const msg = `Invalid environment variables:\n${formatZodError(parsed.error)}`;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }

  const data = parsed.data;
  const isProduction = data.NODE_ENV === "production";
  const isDevelopment = data.NODE_ENV === "development";
  const isTest = data.NODE_ENV === "test";

  // Production hard requirements
  if (isProduction) {
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
  };
}

/** Validated environment — throws on import in production if required vars are missing. */
export const env: Env = loadEnv();
