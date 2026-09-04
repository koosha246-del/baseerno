"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSidebarForRole } from "../config/sidebar";
import type { Role } from "@/lib/db/types";

interface SidebarProps {
  role: string;
  userName: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ role, userName, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = getSidebarForRole(role as Role);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Network failure — still leave the UI; the cookie/session check
      // on the next page load is the source of truth.
    }
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-l border-white/10 bg-slate-950 transition-all duration-300 ease-luxury",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed ? (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-bold text-white">بصیر نو</span>
            <span className="truncate text-[0.65rem] text-slate-400">پنل مدیریت</span>
          </div>
        ) : null}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.id + item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-3">
        {!collapsed ? (
          <div className="mb-2 flex items-center gap-3 px-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {userName.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-white">{userName}</span>
              <span className="truncate text-[0.65rem] text-slate-400">
                {role === "STUDENT" ? "دانش‌آموز" : role === "TEACHER" ? "معلم" : "مدیر"}
              </span>
            </div>
          </div>
        ) : null}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center"
          )}
          title={collapsed ? "خروج" : undefined}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed ? <span>خروج</span> : null}
        </button>
      </div>

      {/* Toggle collapse */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-20 hidden -translate-x-1/2 rounded-full border border-white/10 bg-slate-800 p-1.5 text-slate-400 hover:text-white lg:block"
        style={{ right: "-12px", left: collapsed ? "auto" : "0" }}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>
    </aside>
  );
}
