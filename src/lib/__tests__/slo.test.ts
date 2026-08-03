import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bucketStartOf,
  sloGroupOf,
  recordSloRequest,
  sloReport,
  resetSlo,
} from "@/lib/slo";

beforeEach(() => {
  resetSlo();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  resetSlo();
});

describe("bucketStartOf", () => {
  it("aligns timestamps to 5-minute buckets", () => {
    const B = 5 * 60 * 1000;
    expect(bucketStartOf(0)).toBe(0);
    expect(bucketStartOf(B - 1)).toBe(0);
    expect(bucketStartOf(B)).toBe(B);
    expect(bucketStartOf(B + 1)).toBe(B);
  });
});

describe("sloGroupOf", () => {
  it("maps api routes to their segment group", () => {
    expect(sloGroupOf("/api/auth/login")).toBe("auth");
    expect(sloGroupOf("/api/courses")).toBe("courses");
    expect(sloGroupOf("/api/ai/conversations/abc/messages")).toBe("ai");
  });

  it("falls back for pages", () => {
    expect(sloGroupOf("/dashboard/ops")).toBe("dashboard");
    expect(sloGroupOf("/")).toBe("public");
    expect(sloGroupOf("/courses")).toBe("public");
  });
});

describe("recordSloRequest / sloReport", () => {
  it("computes error rate per bucket", () => {
    vi.setSystemTime(new Date("2026-07-31T10:00:00Z"));
    for (let i = 0; i < 4; i++) recordSloRequest("auth", true, 10);
    recordSloRequest("auth", false, 200);

    const report = sloReport(1);
    expect(report).toHaveLength(1);
    const stats = report[0]!.perGroup["auth"]!;
    expect(stats.requests).toBe(5);
    expect(stats.errors).toBe(1);
    expect(stats.errorRate).toBeCloseTo(20);
  });

  it("separates buckets by time and group", () => {
    vi.setSystemTime(new Date("2026-07-31T10:00:00Z"));
    recordSloRequest("auth", true);
    recordSloRequest("search", true);
    vi.setSystemTime(new Date("2026-07-31T10:05:00Z"));
    recordSloRequest("auth", false);

    const report = sloReport(1);
    expect(report).toHaveLength(2);
    expect(report[0]!.perGroup["auth"]!.requests).toBe(1);
    expect(report[0]!.perGroup["auth"]!.errors).toBe(0);
    expect(report[1]!.perGroup["auth"]!.requests).toBe(1);
    expect(report[1]!.perGroup["auth"]!.errors).toBe(1);
    expect(report[0]!.perGroup["search"]!.requests).toBe(1);
  });

  it("computes p95 and average latency from samples", () => {
    vi.setSystemTime(new Date("2026-07-31T10:00:00Z"));
    for (let i = 1; i <= 20; i++) recordSloRequest("courses", true, i);

    const report = sloReport(1);
    const stats = report[0]!.perGroup["courses"]!;
    expect(stats.avgLatencyMs).toBeCloseTo(10.5);
    expect(stats.p95LatencyMs).toBe(20); // sorted[floor(20*0.95)] = sorted[19]
  });

  it("respects the hours window", () => {
    vi.setSystemTime(new Date("2026-07-30T08:00:00Z")); // 26h before the window
    recordSloRequest("auth", false);
    vi.setSystemTime(new Date("2026-07-31T10:00:00Z"));
    recordSloRequest("auth", true);

    const report = sloReport(24);
    expect(report).toHaveLength(1);
    expect(report[0]!.perGroup["auth"]!.requests).toBe(1);
    expect(report[0]!.perGroup["auth"]!.errors).toBe(0);
  });
});
