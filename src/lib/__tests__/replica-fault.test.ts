import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────
// Vitest hoists vi.mock() factories above const declarations — shared
// mocks must be created inside vi.hoisted().
const { envState, adapterState, primaryDb } = vi.hoisted(() => ({
  // env is mutable so tests can toggle REPLICA_URL at runtime.
  envState: {
    REPLICA_URL: "postgresql://user:pass@localhost:5433/replica",
  } as Record<string, string | undefined>,
  // Simulate the replica being entirely unreachable: PrismaPg throws at
  // construction (e.g. bad host / connection refused).
  adapterState: { throwOnConstruct: false },
  primaryDb: { __tag: "primary" } as const,
}));

vi.mock("@/lib/env", () => ({ env: envState }));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor() {
      if (adapterState.throwOnConstruct) {
        throw new Error("simulated: replica unreachable");
      }
    }
  },
}));

vi.mock("@/lib/db/prisma-client", () => ({
  prisma: primaryDb,
  extendWithSoftDelete: (base: unknown) => base,
}));

// Import AFTER mocking so the module sees the mocks.
import { getReplicaClient, runOnReplica } from "@/lib/db/replica";

describe("replica fault injection (adapter throws at construction)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adapterState.throwOnConstruct = false;
    envState.REPLICA_URL = "postgresql://user:pass@localhost:5433/replica";
  });

  it("getReplicaClient returns null when the replica adapter cannot be built", () => {
    adapterState.throwOnConstruct = true;
    expect(getReplicaClient()).toBeNull();
  });

  it("runOnReplica falls back to the primary when the replica client is unavailable", async () => {
    adapterState.throwOnConstruct = true;

    const received: unknown[] = [];
    const result = await runOnReplica(async (db) => {
      received.push(db);
      return 42;
    });

    expect(result).toBe(42);
    expect(received).toEqual([primaryDb]);
  });
});
