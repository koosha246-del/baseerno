"use client";

import { useMemo, useState } from "react";
import {
  Download,
  GitCompareArrows,
  ArrowDownUp,
  Search,
  Activity,
  Loader2,
} from "lucide-react";
import { formatDate, toPersianDigits } from "@/lib/format";
import type { LoadResult } from "@/lib/load-analysis";
import { LoadTrendChart, type LoadTrendPoint } from "./LoadTrendChart";

/** Serialized load-run row (JSON-safe, sent from the server page). */
export interface ArchiveRun {
  id: string;
  createdAt: string;
  baseUrl: string;
  vus: number;
  durationSeconds: number;
  pass: boolean;
  cacheHits: number;
  scenarios: Partial<LoadResult> | null;
}

interface Props {
  /** Initial page (newest first) — older pages load via the API. */
  runs: ArchiveRun[];
}

const SCENARIOS = ["browse", "search", "dashboard"] as const;
type Scenario = (typeof SCENARIOS)[number];

/** Rows fetched per "load more" request. */
const PAGE_SIZE = 50;

function p95Of(run: ArchiveRun, scenario: Scenario): number | null {
  return run.scenarios?.[scenario]?.p95 ?? null;
}

function errorsOf(run: ArchiveRun, scenario: Scenario): number | null {
  return run.scenarios?.[scenario]?.errors ?? null;
}

export function LoadRunsArchive({ runs: initialRuns }: Props) {
  const [runs, setRuns] = useState(initialRuns);
  const [query, setQuery] = useState("");
  const [passFilter, setPassFilter] = useState<"all" | "pass" | "fail">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialRuns.length >= PAGE_SIZE);

  // Chronological (oldest → newest) for the trend chart.
  const trendData: LoadTrendPoint[] = useMemo(
    () =>
      [...runs]
        .reverse()
        .map((run) => ({
          label: formatDate(run.createdAt, "short"),
          browseP95: p95Of(run, "browse"),
          searchP95: p95Of(run, "search"),
          dashboardP95: p95Of(run, "dashboard"),
          pass: run.pass,
        })),
    [runs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((run) => {
      if (passFilter === "pass" && !run.pass) return false;
      if (passFilter === "fail" && run.pass) return false;
      if (q && !run.baseUrl.toLowerCase().includes(q) && !formatDate(run.createdAt).includes(q)) {
        return false;
      }
      return true;
    });
  }, [runs, query, passFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2),
    );
  };

  /** Append the next page of older runs (offset = current loaded count). */
  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/ops/load-runs?limit=${PAGE_SIZE}&offset=${runs.length}`);
      if (!res.ok) return;
      const data = (await res.json()) as { runs: ArchiveRun[] };
      setRuns((prev) => [...prev, ...data.runs]);
      setHasMore(data.runs.length === PAGE_SIZE);
    } catch {
      // Best-effort — the button remains for a retry.
    } finally {
      setLoadingMore(false);
    }
  };

  const downloadCsv = () => {
    const header = [
      "createdAt",
      "baseUrl",
      "vus",
      "durationSeconds",
      "pass",
      "cacheHits",
      ...SCENARIOS.flatMap((s) => [`${s}P95`, `${s}Errors`]),
    ];
    const rows = filtered.map((run) => [
      run.createdAt,
      run.baseUrl,
      run.vus,
      run.durationSeconds,
      run.pass ? "pass" : "fail",
      run.cacheHits,
      ...SCENARIOS.flatMap((s) => [p95Of(run, s) ?? "", errorsOf(run, s) ?? ""]),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "load-runs-archive.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compare mode: exactly two selected runs → side-by-side diff.
  const compareRuns = selected.map((id) => runs.find((r) => r.id === id)!).filter(Boolean);
  const comparing = compareRuns.length === 2;

  return (
    <div className="flex flex-col gap-4">
      {/* Trend chart — all loaded runs, oldest → newest */}
      <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Activity className="size-4 text-accent" />
          روند p95 در همه اجراها
        </h3>
        <LoadTrendChart data={trendData} brush />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در آدرس / تاریخ…"
            className="w-64 rounded-lg border border-white/10 bg-slate-800/50 py-2 ps-3 pe-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={passFilter}
          onChange={(e) => setPassFilter(e.target.value as typeof passFilter)}
          className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:outline-none"
        >
          <option value="all">همه نتایج</option>
          <option value="pass">فقط پاس</option>
          <option value="fail">فقط رد</option>
        </select>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5"
        >
          <Download className="size-4" />
          دانلود CSV
        </button>
        <span className="ms-auto text-xs text-slate-500">
          {toPersianDigits(runs.length)} اجرا بارگذاری شد · برای مقایسه دو ردیف را انتخاب کن
        </span>
      </div>

      {/* Comparison panel */}
      {comparing && compareRuns[0] && compareRuns[1] && (
        <ComparePanel a={compareRuns[0]} b={compareRuns[1]} />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
        <table className="w-full text-sm text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3 text-right">مقایسه</th>
              <th className="px-4 py-3 text-right">تاریخ</th>
              <th className="px-4 py-3 text-right">VU</th>
              <th className="px-4 py-3 text-right">مدت</th>
              <th className="px-4 py-3 text-right">نتیجه</th>
              {SCENARIOS.map((s) => (
                <th key={s} className="px-4 py-3 text-right" dir="ltr">
                  {s} p95
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                {/* 5 fixed columns + one per scenario */}
                <td colSpan={5 + SCENARIOS.length} className="px-4 py-8 text-center text-slate-500">
                  اجرایی یافت نشد.
                </td>
              </tr>
            )}
            {filtered.map((run) => {
              const isSelected = selected.includes(run.id);
              return (
                <tr
                  key={run.id}
                  onClick={() => toggleSelect(run.id)}
                  className={`cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.06] ${
                    isSelected ? "bg-accent/10" : ""
                  }`}
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(run.id)}
                      className="size-4 accent-[#3b82f6]"
                    />
                  </td>
                  <td className="px-4 py-3">{formatDate(run.createdAt, "datetime")}</td>
                  <td className="px-4 py-3">{toPersianDigits(run.vus)}</td>
                  <td className="px-4 py-3">{toPersianDigits(run.durationSeconds)} ثانیه</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${
                        run.pass ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {run.pass ? "پاس" : "رد"}
                    </span>
                  </td>
                  {SCENARIOS.map((s) => (
                    <td key={s} className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {p95Of(run, s) === null ? "—" : `${p95Of(run, s)} ms`}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Load older runs */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          {loadingMore ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              در حال بارگذاری…
            </>
          ) : (
            "بارگذاری اجراهای قدیمیتر"
          )}
        </button>
      )}
    </div>
  );
}

/** Side-by-side latency/error diff of two selected runs. */
function ComparePanel({ a, b }: { a: ArchiveRun; b: ArchiveRun }) {
  const delta = (av: number | null, bv: number | null) => {
    if (av === null || bv === null) return null;
    return bv - av;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <GitCompareArrows className="size-4 text-accent" />
        مقایسه اجراها
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="px-3 py-2 text-right">سناریو</th>
              <th className="px-3 py-2 text-right" dir="ltr">
                {formatDate(a.createdAt, "short")}
              </th>
              <th className="px-3 py-2 text-right" dir="ltr">
                {formatDate(b.createdAt, "short")}
              </th>
              <th className="px-3 py-2 text-right">تغییر</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => {
              const ap = p95Of(a, s);
              const bp = p95Of(b, s);
              const d = delta(ap, bp);
              return (
                <tr key={s} className="border-b border-white/5">
                  <td className="px-3 py-2 font-medium" dir="ltr">
                    {s} p95
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                    {ap === null ? "—" : `${ap} ms`}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                    {bp === null ? "—" : `${bp} ms`}
                  </td>
                  <td className="px-3 py-2">
                    {d === null ? (
                      <span className="text-slate-500">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-xs ${
                          d > 0 ? "text-red-400" : d < 0 ? "text-green-400" : "text-slate-400"
                        }`}
                        dir="ltr"
                      >
                        <ArrowDownUp className="size-3" />
                        {d > 0 ? "+" : ""}
                        {toPersianDigits(d)} ms
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td className="px-3 py-2 font-medium">نتیجه</td>
              <td className="px-3 py-2">
                <Badge pass={a.pass} />
              </td>
              <td className="px-3 py-2">
                <Badge pass={b.pass} />
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {a.pass === b.pass ? "یکسان" : "تغییر وضعیت"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ pass }: { pass: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${
        pass ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {pass ? "پاس" : "رد"}
    </span>
  );
}
