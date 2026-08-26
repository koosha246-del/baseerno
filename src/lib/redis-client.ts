/**
 * Shared Redis client — singleton used by rate limiter, cache, and
 * any future Redis-backed features.
 *
 * Graceful fallback: returns `null` when `REDIS_URL` is not set or
 * the connection fails, so callers always have a fallback path.
 *
 * Only **one** module-level Redis client exists; import this instead
 * of creating ad-hoc connections.
 */

import { env } from "@/lib/env";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RedisClient {
  set(key: string, value: string | number, options?: Record<string, unknown>): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<unknown>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  quit(): Promise<void>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  isOpen: boolean;
  ping(): Promise<string>;
  /**
   * Pattern-scan for key invalidation (e.g. deleting `cache:search:*`
   * without knowing exact keys). Optional — in-memory fallbacks and
   * old mocks may omit it; callers guard with `typeof === "function"`.
   */
  scanIterator?(options: { MATCH: string; COUNT?: number }): AsyncIterable<string>;
}

let cachedClient: RedisClient | null = null;
let loadAttempted = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30_000;
const RECONNECT_COOLDOWN = 10_000;
let lastFailedAt = 0;

export async function getRedisClient(): Promise<RedisClient | null> {
  const redisUrl = env.REDIS_URL;
  if (!redisUrl) return null;

  if (cachedClient) {
    if (Date.now() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = Date.now();
      try {
        await cachedClient.ping();
      } catch {
        cachedClient = null;
        loadAttempted = false;
        lastFailedAt = Date.now();
        return getRedisClient();
      }
    }
    return cachedClient;
  }

  // Allow reconnection after a cooldown period instead of permanently
  // giving up. This handles transient Redis outages at startup.
  if (loadAttempted) {
    if (Date.now() - lastFailedAt < RECONNECT_COOLDOWN) return null;
    loadAttempted = false;
  }

  try {
    const redisModule = await import("redis").catch(() => null);
    if (!redisModule) return null;
    const { createClient } = redisModule as { createClient: unknown };
    if (typeof createClient !== "function") return null;

    const client = (
      createClient as (opts: Record<string, unknown>) => {
        connect(): Promise<unknown>;
        on(event: string, handler: (...args: unknown[]) => void): void;
      }
    )({
      url: redisUrl,
      // Fail fast when Redis is unreachable — node-redis's default
      // reconnectStrategy retries forever, which would hang callers
      // (e.g. page prerendering at build time) until they time out.
      // Instead: short connect timeout + max 3 quick retries, then let
      // connect() reject so callers fall back gracefully.
      socket: {
        connectTimeout: 3_000,
        reconnectStrategy: (retries: number) =>
          retries > 2 ? new Error("Redis unreachable") : retries * 100,
      },
    }) ;
    client.on("error", (err: unknown) => {
      console.error(
        "[redis] Connection error:",
        err instanceof Error ? err.message : String(err),
      );
    });

    await client.connect();
    lastHealthCheck = Date.now();
    cachedClient = client as unknown as RedisClient;
    return cachedClient;
  } catch (error) {
    loadAttempted = true;
    lastFailedAt = Date.now();
    console.warn(
      "[redis] Failed to connect. Falling back.",
      error instanceof Error ? error.message : "",
    );
    return null;
  }
}

export async function closeRedis(): Promise<void> {
  if (cachedClient) {
    try {
      await cachedClient.quit();
    } catch {
      // best-effort
    }
    cachedClient = null;
    loadAttempted = false;
  }
}