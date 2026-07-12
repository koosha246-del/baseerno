import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { toPersianDigits } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { GraduationCap, UserCheck, Shield } from "lucide-react";

export default async function UsersPage() {
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

  const counts = await repository.countByRole();
  const allUsers = await repository.listUsers();

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
            {allUsers.map((u) => {
              const roleLabel = u.role === "STUDENT" ? "دانش‌آموز" : u.role === "TEACHER" ? "معلم" : "مدیر";
              const roleColor = u.role === "STUDENT" ? "bg-blue-500/15 text-blue-400" : u.role === "TEACHER" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400";
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" dir="ltr">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge className={roleColor}>{roleLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
