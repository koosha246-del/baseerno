import { toPersianDigits } from "@/lib/format";
import type { SloBucketReport } from "@/lib/slo";

interface Props {
  buckets: SloBucketReport[];
  /** Hours to display (rows are aggregated per hour). */
  hours: number;
}

const HOUR_MS = 3_600_000;

/** Cell background by hourly error rate (%) — green → amber → red. */
function cellClass(rate: number | null): string {
  if (rate === null) return "bg-slate-800/40";
  if (rate === 0) return "bg-green-500/20";
  if (rate <= 2) return "bg-lime-500/20";
  if (rate <= 5) return "bg-amber-500/25";
  return "bg-red-500/30";
}

function cellTitle(
  group: string,
  cell: { requests: number; errors: number } | null,
  hourStart: number,
): string {
  const when = new Date(hourStart).toLocaleString("fa-IR");
  if (!cell) return `${group} — ${when}: بدون ترافیک`;
  const rate = cell.requests > 0 ? ((cell.errors / cell.requests) * 100).toFixed(1) : "0";
  return `${group} — ${when}: ${cell.requests} درخواست، ${cell.errors} خطا (${rate}٪)`;
}

/**
 * Hourly API error-rate heatmap for the last `hours` (default 24).
 * Rows = SLO groups (api route segments), columns = hours; cell color
 * reflects the error rate (green=0 → red=5%+). Tooltips carry details.
 */
export function SloHeatmap({ buckets, hours }: Props) {
  if (buckets.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        هنوز دادهای ثبت نشده — با اولین درخواست به API های rate-limited این بخش فعال
        میشود.
      </p>
    );
  }

  const groups = [...new Set(buckets.flatMap((b) => Object.keys(b.perGroup)))];

  // Complete hourly grid (including empty hours) so the heatmap reads as
  // a proper 24-hour strip.
  const now = Date.now();
  const grid: {
    hourStart: number;
    perGroup: Record<string, { requests: number; errors: number } | null>;
  }[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const hourStart = Math.floor(now / HOUR_MS) * HOUR_MS - i * HOUR_MS;
    const perGroup: Record<string, { requests: number; errors: number } | null> = {};
    for (const g of groups) perGroup[g] = null;
    grid.push({ hourStart, perGroup });
  }
  for (const bucket of buckets) {
    const hourStart = Math.floor(bucket.bucketStart / HOUR_MS) * HOUR_MS;
    const row = grid.find((h) => h.hourStart === hourStart);
    if (!row) continue;
    for (const [group, stats] of Object.entries(bucket.perGroup)) {
      const cur = row.perGroup[group];
      if (cur) {
        cur.requests += stats.requests;
        cur.errors += stats.errors;
      } else {
        row.perGroup[group] = { requests: stats.requests, errors: stats.errors };
      }
    }
  }

  return (
    <div className="flex flex-col gap-2" dir="ltr">
      {/* Hour labels */}
      <div className="flex items-center gap-1 ps-20">
        {grid.map((h) => {
          const dt = new Date(h.hourStart);
          return (
            <div
              key={h.hourStart}
              className="flex-1 text-center text-[0.6rem] text-slate-500"
            >
              {dt.getHours() % 3 === 0 ? `${dt.getHours()}:00` : ""}
            </div>
          );
        })}
      </div>
      {groups.map((group) => (
        <div key={group} className="flex items-center gap-1">
          <div className="w-20 shrink-0 text-end text-xs text-slate-400" dir="rtl">
            {group}
          </div>
          {grid.map((h) => {
            const cell = h.perGroup[group];
            const rate = cell && cell.requests > 0 ? (cell.errors / cell.requests) * 100 : null;
            return (
              <div
                key={h.hourStart}
                title={cellTitle(group, cell ?? null, h.hourStart)}
                className={`h-6 flex-1 rounded-[3px] transition-colors hover:outline hover:outline-1 hover:outline-white/30 ${cellClass(rate)}`}
              />
            );
          })}
        </div>
      ))}
      {/* Legend */}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 ps-20 text-[0.6rem] text-slate-500" dir="rtl">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-green-500/20" />
          بدون خطا
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-lime-500/20" />
          &lt; {toPersianDigits(2)}٪
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-amber-500/25" />
          {toPersianDigits(2)}–{toPersianDigits(5)}٪
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-red-500/30" />
          &gt; {toPersianDigits(5)}٪
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-slate-800/40" />
          بدون ترافیک
        </span>
      </div>
    </div>
  );
}
