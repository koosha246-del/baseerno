import { describe, it, expect, beforeEach } from "vitest";
import { incr, observe, snapshotMetrics, resetMetrics } from "../metrics";

describe("metrics", () => {
  beforeEach(() => resetMetrics());

  it("counts increments", () => {
    incr("auth:login");
    incr("auth:login");
    incr("auth:failed", 2);
    const snap = snapshotMetrics();
    expect(snap.counters["auth:login"]).toBe(2);
    expect(snap.counters["auth:failed"]).toBe(2);
  });

  it("records histograms with avg/approxP95/max", () => {
    observe("prisma:Course.findMany", 10);
    observe("prisma:Course.findMany", 30);
    const snap = snapshotMetrics();
    const h = snap.histograms["prisma:Course.findMany"];
    expect(h).toBeDefined();
    expect(h!.count).toBe(2);
    expect(h!.avgMs).toBe(20);
    expect(h!.maxMs).toBe(30);
    expect(h!.approxP95Ms).toBeGreaterThanOrEqual(h!.avgMs);
    expect(h!.approxP95Ms).toBeLessThanOrEqual(h!.maxMs);
  });

  it("reset=true clears counters after snapshot", () => {
    incr("a");
    snapshotMetrics(true);
    const snap = snapshotMetrics();
    expect(snap.counters["a"]).toBeUndefined();
  });

  it("resetMetrics clears everything", () => {
    incr("a");
    observe("b", 5);
    resetMetrics();
    const snap = snapshotMetrics();
    expect(Object.keys(snap.counters)).toHaveLength(0);
    expect(Object.keys(snap.histograms)).toHaveLength(0);
  });
});
