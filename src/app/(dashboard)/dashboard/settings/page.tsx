import { getCurrentUser } from "@/lib/auth/session";
import { SettingsForm } from "./SettingsForm";
import { PasswordForm } from "./PasswordForm";
import { TwoFactorForm } from "./TwoFactorForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">تنظیمات</h1>
        <p className="mt-1 text-sm text-slate-400">مدیریت حساب کاربری</p>
      </div>

      <SettingsForm user={user} />
      <TwoFactorForm />
      <PasswordForm />
    </div>
  );
}
