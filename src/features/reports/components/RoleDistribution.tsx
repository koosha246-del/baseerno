"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataPoint {
  name: string;
  value: number;
}

interface Props {
  data: DataPoint[];
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b"];

export function RoleDistribution({ data }: Props) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        داده‌ای موجود نیست
      </div>
    );
  }

  return (
    <div className="h-64" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
