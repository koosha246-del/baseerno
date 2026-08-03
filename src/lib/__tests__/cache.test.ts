import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────
// Vitest hoists vi.mock() factories above the const declarations, so
// every mock shared with a factory must be created inside vi.hoisted().
const { redisClient, unstableCacheMock, revalidateTagMock } = vi.hoisted(() => ({
  redisClient: {
    get: vi.fn(),
    // Must return a thenable — cache.ts does client.set(...).catch(...)
    set: vi.fn(async () => "OK"),
    del: vi.fn(),
    ttl: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
    isOpen: true,
    ping: vi.fn(),
  },
  // unstable_cache(fn, [key], opts) returns the cached fn; in tests we
  // collapse it to just the factory so the fallback path behaves like the
  // real one (call fn, get value).
  unstableCacheMock: vi.fn((fn: () => Promise<unknown>) => fn),
  revalidateTagMock: vi.fn(),
}));

vi.mock("@/lib/redis-client", () => ({
  getRedisClient: vi.fn(async () => redisClient),
}));

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  revalidateTag: revalidateTagMock,
}));

import { getOrSet, invalidateCache } from "../cache";
import { getRedisClient } from "../redis-client";

const getRedisClientMock = getRedisClient as unknown as ReturnType<typeof vi.fn>;

describe("getOrSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRedisClientMock.mockResolvedValue(redisClient);
  });

  it("returns the cached value from Redis without calling fn", async () => {
    redisClient.get.mockResolvedValue(JSON.stringify({ id: "c1", title: "دوره" }));
    const fn = vi.fn(async () => ({ id: "c1", title: "دوره" }));

    const value = await getOrSet("courses:published", 300, fn, ["courses"]);

    expect(value).toEqual({ id: "c1", title: "دوره" });
    expect(fn).not.toHaveBeenCalled();
    expect(redisClient.get).toHaveBeenCalledWith("cache:courses:published");
  });

  it("calls fn on a miss and back-fills Redis with the TTL", async () => {
    redisClient.get.mockResolvedValue(null);
    const fn = vi.fn(async () => ({ id: "c2" }));

    const value = await getOrSet("courses:published", 300, fn, ["courses"]);

    expect(value).toEqual({ id: "c2" });
    expect(fn).toHaveBeenCalledOnce();
    expect(redisClient.set).toHaveBeenCalledWith(
      "cache:courses:published",
      JSON.stringify({ id: "c2" }),
      { EX: 300 },
    );
  });

  it("falls back to unstable_cache when Redis is unavailable", async () => {
    getRedisClientMock.mockResolvedValue(null);
    const fn = vi.fn(async () => ({ id: "c3" }));

    const value = await getOrSet("courses:published", 300, fn, ["courses"]);

    expect(value).toEqual({ id: "c3" });
    expect(unstableCacheMock).toHaveBeenCalledWith(
      fn,
      ["courses:published"],
      { revalidate: 300, tags: ["courses"] },
    );
    // No Redis client — nothing back-filled, but value still returned.
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  it("runs fn directly when Redis is missing and no tags are given", async () => {
    getRedisClientMock.mockResolvedValue(null);
    const fn = vi.fn(async () => 42);

    const value = await getOrSet("plain:key", 60, fn);

    expect(value).toBe(42);
    expect(unstableCacheMock).not.toHaveBeenCalled();
  });

  it("swallows Redis get errors and falls through to fn", async () => {
    redisClient.get.mockRejectedValue(new Error("redis down"));
    const fn = vi.fn(async () => ({ id: "c4" }));

    const value = await getOrSet("k", 60, fn);

    expect(value).toEqual({ id: "c4" });
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("invalidateCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRedisClientMock.mockResolvedValue(redisClient);
  });

  it("deletes multiple Redis keys and revalidates all tags", async () => {
    await invalidateCache(
      ["courses:published", "courses:published:8"],
      ["courses", "admin:reports"],
    );

    expect(redisClient.del).toHaveBeenCalledTimes(2);
    expect(redisClient.del).toHaveBeenCalledWith("cache:courses:published");
    expect(redisClient.del).toHaveBeenCalledWith("cache:courses:published:8");
    expect(revalidateTagMock).toHaveBeenCalledWith("courses");
    expect(revalidateTagMock).toHaveBeenCalledWith("admin:reports");
  });

  it("accepts a single key string", async () => {
    await invalidateCache("courses:published", ["courses"]);

    expect(redisClient.del).toHaveBeenCalledOnce();
    expect(redisClient.del).toHaveBeenCalledWith("cache:courses:published");
    expect(revalidateTagMock).toHaveBeenCalledWith("courses");
  });

  it("does nothing when Redis is unavailable (tags still revalidate)", async () => {
    getRedisClientMock.mockResolvedValue(null);
    await invalidateCache("courses:published", ["courses"]);

    expect(redisClient.del).not.toHaveBeenCalled();
    expect(revalidateTagMock).toHaveBeenCalledWith("courses");
  });
});
