"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";

export interface LoadTrendPoint {
  /** Display label (time of the run). */
  label: string;
  browseP95: number | null;
  searchP95: number | null;
  dashboardP95: number | null;
  pass: boolean;
}

interface Props {
  data: LoadTrendPoint[];
  /** Show the zoom/pan brush below the chart (archive page). */
  brush?: boolean;
}

/**
 * p95 latency trend across load-test runs — one line per scenario.
 * `dir="ltr"` keeps recharts axis math in a natural direction; labels are
 * already localized Persian digits by the caller.
 */
export function LoadTrendChart({ data, brush = false }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        هنوز load test ی ثبت نشده — بعد از اولین اجرا این نمودار فعال می‌شود.
      </div>
    );
  }

  return (
    <div className="h-64" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={11} unit="ms" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value, name) => [
              value === null || value === undefined ? "—" : `${value} ms`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
          <Line
            type="monotone"
            dataKey="browseP95"
            name="browse"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="searchP95"
            name="search"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: "#8b5cf6", r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="dashboardP95"
            name="dashboard"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 3 }}
            connectNulls
          />
          {brush && <Brush dataKey="label" height={24} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
