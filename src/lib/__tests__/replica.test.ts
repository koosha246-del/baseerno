import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────
// Vitest hoists vi.mock() factories above const declarations — shared
// mocks must be created inside vi.hoisted().
const { envState, primaryDb } = vi.hoisted(() => ({
  // env is mutable so tests can toggle REPLICA_URL at runtime.
  envState: { REPLICA_URL: undefined } as Record<string, string | undefined>,
  // prisma-client is mocked so the primary is a known sentinel and no real
  // DB connection is ever attempted (the replica client is created lazily).
  primaryDb: { __tag: "primary" } as const,
}));

vi.mock("@/lib/env", () => ({ env: envState }));

vi.mock("@/lib/db/prisma-client", () => ({
  prisma: primaryDb,
  extendWithSoftDelete: (base: unknown) => base,
}));

// Import AFTER mocking so the module sees the mocks.
import { getReplicaClient, runOnReplica } from "@/lib/db/replica";

describe("read replica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envState.REPLICA_URL = undefined;
  });

  it("getReplicaClient returns null when REPLICA_URL is unset", () => {
    expect(getReplicaClient()).toBeNull();
  });

  it("runOnReplica uses the primary when no replica is configured", async () => {
    const received: unknown[] = [];
    await runOnReplica(async (db) => {
      received.push(db);
      return 1;
    });
    expect(received[0]).toBe(primaryDb);
  });

  it("uses the replica client when REPLICA_URL is set", async () => {
    envState.REPLICA_URL = "postgresql://user:pass@localhost:5433/replica";

    const received: unknown[] = [];
    await runOnReplica(async (db) => {
      received.push(db);
      return 1;
    });

    expect(getReplicaClient()).not.toBeNull();
    expect(received[0]).not.toBe(primaryDb);
  });

  it("falls back to the primary when the replica query throws", async () => {
    envState.REPLICA_URL = "postgresql://user:pass@localhost:5433/replica";

    const calls: unknown[] = [];
    const result = await runOnReplica(async (db) => {
      calls.push(db);
      if (calls.length === 1) throw new Error("replica down");
      return "primary-result";
    });

    expect(result).toBe("primary-result");
    expect(calls[0]).not.toBe(primaryDb); // first tried replica
    expect(calls[1]).toBe(primaryDb); // then fell back to primary
  });
});
