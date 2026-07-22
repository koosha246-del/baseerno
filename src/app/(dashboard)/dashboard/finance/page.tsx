import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits, formatToman, formatDate } from "@/lib/format";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { getCachedCountPayments, getCachedPaymentsList, getCachedTotalRevenue } from "@/lib/db/queries";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function FinancePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  // Student view: their own payments, paginated
  if (user.role === "STUDENT") {
    const [payments, total, paidSum, pendingSum] = await Promise.all([
      getCachedPaymentsList(skip, PAGE_SIZE, user.id),
      getCachedCountPayments(user.id),
      repository.sumPaymentsByUser({ userId: user.id, status: "PAID" }),
      repository.sumPaymentsByUser({ userId: user.id, status: "PENDING" }),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">پرداخت‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">سابقه پرداخت‌های شما</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="پرداخت‌شده (کل)" value={formatToman(paidSum)} icon={DollarSign} accent="green" />
          <StatCard label="در انتظار (کل)" value={formatToman(pendingSum)} icon={TrendingUp} accent="amber" />
          <StatCard label="تعداد کل" value={toPersianDigits(total)} icon={DollarSign} accent="blue" />
        </div>

        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/50 px-5 py-4 transition-colors hover:border-white/20 hover:bg-slate-800"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{formatToman(p.amount)}</span>
                <span className="text-xs text-slate-400">
                  {p.method} · {formatDate(p.createdAt)}
                </span>
              </div>
              <StatusBadge status={p.status}>
                {p.status === "PAID" ? "موفق" : p.status === "FAILED" ? "ناموفق" : "در انتظار"}
              </StatusBadge>
            </div>
          ))}
          {payments.length === 0 && (
            <EmptyState
              icon={Wallet}
              title="پرداختی نداری"
              description="وقتی در دوره‌ای ثبت‌نام کنی، سابقه پرداخت اینجا می‌آید."
            />
          )}
        </div>

        <Pagination total={total} pageSize={PAGE_SIZE} currentPage={currentPage} />
      </div>
    );
  }

  if (user.role === "TEACHER") {
    const courses = await repository.listCourses({ mentorId: user.id });
    const courseIds = courses.map((c) => c.id);
    const [revenue, paidCount, pendingCount] = await Promise.all([
      repository.teacherRevenue(user.id),
      repository.countPaymentsForCourses(courseIds, "PAID"),
      repository.countPaymentsForCourses(courseIds, "PENDING"),
    ]);
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">درآمد</h1>
          <p className="mt-1 text-sm text-slate-400">درآمد حاصل از دوره‌های شما</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="کل درآمد" value={formatToman(revenue)} icon={DollarSign} accent="brand" />
          <StatCard
            label="پرداخت موفق"
            value={toPersianDigits(paidCount)}
            icon={TrendingUp}
            accent="green"
          />
          <StatCard
            label="در انتظار"
            value={toPersianDigits(pendingCount)}
            icon={TrendingUp}
            accent="amber"
          />
        </div>
        <div className="text-xs text-slate-500">
          فقط تراکنش‌های دوره‌های شما نمایش داده می‌شود. از {toPersianDigits(courses.length)} دوره شما.
        </div>
      </div>
    );
  }

  // ADMIN: global view with pagination.
  // Everything in parallel: page rows + count + total + paid/pending counts.
  const [
    allPayments,
    totalPayments,
    totalRevenue,
    paidCount,
    pendingCount,
  ] = await Promise.all([
    getCachedPaymentsList(skip, PAGE_SIZE),
    getCachedCountPayments(),
    getCachedTotalRevenue(),
    repository.countPayments({ status: "PAID" }),
    repository.countPayments({ status: "PENDING" }),
  ]);

  // Build a user-name map from the payment user IDs using targeted
  // ID-based lookup (avoids fetching unnecessary users).
  const neededUserIds = Array.from(new Set(allPayments.map((p) => p.userId)));
  const usersById = new Map<string, { id: string; name: string; email: string }>();
  if (neededUserIds.length > 0) {
    const batch = await repository.listUsers({ ids: neededUserIds });
    for (const u of batch) {
      usersById.set(u.id, { id: u.id, name: u.name, email: u.email });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">مالی و درآمد</h1>
        <p className="mt-1 text-sm text-slate-400">خلاصه مالی کل پلتفرم</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="درآمد کل" value={formatToman(totalRevenue)} icon={DollarSign} accent="green" />
        <StatCard label="پرداخت موفق" value={toPersianDigits(paidCount)} icon={TrendingUp} accent="blue" />
        <StatCard label="پرداخت معلق" value={toPersianDigits(pendingCount)} icon={TrendingUp} accent="amber" />
        <StatCard
          label="میانگین پرداخت"
          value={
            paidCount > 0
              ? formatToman(Math.round(totalRevenue / paidCount))
              : "—"
          }
          icon={DollarSign}
          accent="brand"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
        <table className="w-full text-sm text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3 text-right">کاربر</th>
              <th className="px-4 py-3 text-right">مبلغ</th>
              <th className="px-4 py-3 text-right">روش</th>
              <th className="px-4 py-3 text-right">وضعیت</th>
              <th className="px-4 py-3 text-right">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {allPayments.map((p) => (
              <tr
                key={p.id}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.06]"
              >
                <td className="px-4 py-3 font-medium text-white">
                  {usersById.get(p.userId)?.name ?? "—"}
                </td>
                <td className="px-4 py-3">{formatToman(p.amount)}</td>
                <td className="px-4 py-3 text-xs">{p.method}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status}>
                    {p.status === "PAID" ? "موفق" : p.status === "FAILED" ? "ناموفق" : "در انتظار"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 text-xs">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
            {allPayments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <EmptyState
                    size="sm"
                    icon={Wallet}
                    title="پرداختی نیست"
                    description="هنوز تراکنشی ثبت نشده."
                    className="border-0 bg-transparent"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={totalPayments} pageSize={PAGE_SIZE} currentPage={currentPage} />
    </div>
  );
}
