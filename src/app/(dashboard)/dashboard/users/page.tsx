import { getCurrentUser } from "@/lib/auth/session";
import { toPersianDigits, formatDate } from "@/lib/format";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  getCachedRoleCounts,
  getCachedCountUsers,
  getCachedUsersList,
} from "@/lib/db/queries";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import { GraduationCap, UserCheck, Shield, Users } from "lucide-react";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <Shield className="size-12 text-slate-600" />
        <p className="text-slate-400">این صفحه فقط برای مدیران قابل دسترسی است.</p>
      </div>
    );
  }

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  // All three queries fire in parallel; counts hit the cached query
  // layer (30s TTL) so a flurry of admin clicks doesn't re-aggregate.
  const [counts, total, users] = await Promise.all([
    getCachedRoleCounts(),
    getCachedCountUsers(),
    getCachedUsersList(skip, PAGE_SIZE),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">مدیریت کاربران</h1>
        <p className="mt-1 text-sm text-slate-400">لیست تمام کاربران پلتفرم</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="دانش‌آموزان" value={toPersianDigits(counts.STUDENT)} icon={GraduationCap} accent="brand" />
        <StatCard label="معلمان" value={toPersianDigits(counts.TEACHER)} icon={UserCheck} accent="blue" />
        <StatCard label="مدیران" value={toPersianDigits(counts.ADMIN)} icon={Shield} accent="green" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
        <table className="w-full text-sm text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3 text-right">نام</th>
              <th className="px-4 py-3 text-right">ایمیل</th>
              <th className="px-4 py-3 text-right">نقش</th>
              <th className="px-4 py-3 text-right">تاریخ عضویت</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleLabel =
                u.role === "STUDENT" ? "دانش‌آموز" : u.role === "TEACHER" ? "معلم" : "مدیر";
              return (
                <tr
                  key={u.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.06]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.role}>{roleLabel}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(u.createdAt)}</td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10">
                  <EmptyState
                    size="sm"
                    icon={Users}
                    title="کاربری نیست"
                    description="هنوز کاربری ثبت نشده."
                    className="border-0 bg-transparent"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        total={total}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
      />
    </div>
  );
}
