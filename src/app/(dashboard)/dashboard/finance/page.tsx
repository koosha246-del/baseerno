import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits, formatToman } from "@/lib/format";
import { DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { cn } from "@/lib/utils";

export default async function FinancePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const payments = await repository.listPayments({ userId: user.id });
  const paidPayments = payments.filter((p) => p.status === "PAID");
  const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);

  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const totalPending = pendingPayments.reduce((s, p) => s + p.amount, 0);

  if (user.role === "STUDENT") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">پرداخت‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">سابقه پرداخت‌های شما</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="پرداخت‌شده" value={formatToman(totalPaid)} icon={DollarSign} accent="green" />
          <StatCard label="در انتظار" value={formatToman(totalPending)} icon={TrendingUp} accent="amber" />
          <StatCard label="تعداد تراکنش" value={toPersianDigits(payments.length)} icon={DollarSign} accent="blue" />
        </div>

        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/50 px-5 py-4"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{formatToman(p.amount)}</span>
                <span className="text-xs text-slate-400">
                  {p.method} · {new Date(p.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  p.status === "PAID" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                )}
              >
                {p.status === "PAID" ? "موفق" : "در انتظار"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (user.role === "TEACHER") {
    const revenue = await repository.teacherRevenue(user.id);
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">درآمد</h1>
          <p className="mt-1 text-sm text-slate-400">درآمد حاصل از دوره‌های شما</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="کل درآمد" value={formatToman(revenue)} icon={DollarSign} accent="brand" />
          <StatCard label="تعداد تراکنش" value={toPersianDigits(paidPayments.length)} icon={TrendingUp} accent="green" />
        </div>
      </div>
    );
  }

  // ADMIN
  const allPayments = await repository.listPayments();
  const totalRevenue = allPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const allUsers = await repository.listUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">مالی و درآمد</h1>
        <p className="mt-1 text-sm text-slate-400">خلاصه مالی کل پلتفرم</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="درآمد کل" value={formatToman(totalRevenue)} icon={DollarSign} accent="green" />
        <StatCard label="پرداخت موفق" value={toPersianDigits(allPayments.filter((p) => p.status === "PAID").length)} icon={TrendingUp} accent="blue" />
        <StatCard label="پرداخت معلق" value={toPersianDigits(allPayments.filter((p) => p.status === "PENDING").length)} icon={TrendingUp} accent="amber" />
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
            {allPayments.map((p) => {
              const payer = allUsers.find((u) => u.id === p.userId);
              return (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">{payer?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatToman(p.amount)}</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold",
                      p.status === "PAID" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    )}>
                      {p.status === "PAID" ? "موفق" : "معلق"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(p.createdAt).toLocaleDateString("fa-IR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
