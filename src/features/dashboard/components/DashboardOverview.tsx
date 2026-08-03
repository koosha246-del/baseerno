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
        <h1 className="text-2xl font-extrabold text-fg-primary">
          {role === "STUDENT"
            ? "داشبورد شما"
            : role === "TEACHER"
              ? "پنل مدرسی"
              : "پنل مدیریت"}
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">
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
      <div className="rounded-xl border border-app-border-subtle bg-surface-muted p-5">
        <h2 className="mb-4 text-lg font-bold text-fg-primary">فعالیت اخیر</h2>
        {recentActivity.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-secondary">فعالیتی یافت نشد.</p>
        ) : (
          <div role="list" className="flex flex-col gap-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                role="listitem"
                className="flex items-center justify-between rounded-lg border border-app-border-subtle bg-surface px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-fg-primary">{item.title}</span>
                  <span className="text-xs text-fg-secondary">{item.subtitle}</span>
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
