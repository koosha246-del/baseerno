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

export async function getRedisClient(): Promise<RedisClient | null> {
  const redisUrl = env.REDIS_URL;
  if (!redisUrl) return null;

  if (loadAttempted && cachedClient) {
    if (Date.now() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = Date.now();
      try {
        await cachedClient.ping();
      } catch {
        cachedClient = null;
        loadAttempted = false;
        return getRedisClient();
      }
    }
    return cachedClient;
  }

  if (loadAttempted) return null;
  loadAttempted = true;

  try {
    const redisModule = await import("redis").catch(() => null);
    if (!redisModule) return null;
    const { createClient } = redisModule as { createClient: unknown };
    if (typeof createClient !== "function") return null;

    const client = createClient({ url: redisUrl });
    client.on("error", (err: Error) => {
      console.error("[redis] Connection error:", err.message);
    });

    await client.connect();
    lastHealthCheck = Date.now();
    cachedClient = client as unknown as RedisClient;
    return cachedClient;
  } catch (error) {
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