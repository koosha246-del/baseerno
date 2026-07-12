"use client";

import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuToggle: () => void;
  userName: string;
  role: string;
}

export function TopBar({ onMenuToggle, userName, role }: TopBarProps) {
  const roleLabel =
    role === "STUDENT"
      ? "دانش‌آموز"
      : role === "TEACHER"
        ? "معلم"
        : "مدیر";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-slate-900 px-4 lg:px-6">
      {/* Right side: menu toggle + search */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:bg-white/5 hover:text-white lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="size-5" />
        </Button>

        <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 sm:flex">
          <Search className="size-4" />
          <span>جستجو...</span>
        </div>
      </div>

      {/* Left side: role badge + bell + user */}
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-accent px-3 py-1 text-[0.7rem] font-bold text-white">
          {roleLabel}
        </span>

        <button className="relative size-9 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white">
          <Bell className="mx-auto size-4" />
          <span className="absolute -top-0.5 left-1 size-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {userName.charAt(0)}
          </div>
          <span className="hidden text-sm font-medium text-white sm:block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
