import {
  BookOpen,
  GraduationCap,
  BarChart3,
  Award,
  CreditCard,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "./StatCard";

interface DashboardOverviewProps {
  stats: Array<{
    label: string;
    value: string | number;
    accent?: "brand" | "navy" | "green" | "blue" | "amber";
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    subtitle: string;
    status: string;
    statusColor: "green" | "blue" | "amber" | "red";
  }>;
  role: string;
}

const statusClasses = {
  green: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  amber: "bg-amber-500/15 text-amber-400",
  red: "bg-red-500/15 text-red-400",
};

export function DashboardOverview({ stats, recentActivity, role }: DashboardOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          {role === "STUDENT"
            ? "داشبورد شما"
            : role === "TEACHER"
              ? "پنل مدرسی"
              : "پنل مدیریت"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          خلاصه وضعیت حساب کاربری شما
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => {
          const icons: Array<typeof BookOpen> = [BookOpen, GraduationCap, BarChart3, DollarSign, Users, Award, CreditCard, TrendingUp];
          const Icon = icons[i % icons.length]!;
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={Icon}
              accent={stat.accent}
            />
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-white/10 bg-slate-800/50 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">فعالیت اخیر</h2>
        {recentActivity.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">فعالیتی یافت نشد.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{item.title}</span>
                  <span className="text-xs text-slate-400">{item.subtitle}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${
                    statusClasses[item.statusColor]
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
