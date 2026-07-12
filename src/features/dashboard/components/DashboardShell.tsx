"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardShellProps {
  children: React.ReactNode;
  user: { id: string; name: string; email: string; role: string };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-white" dir="rtl">
      {/* Desktop sidebar */}
      <div className="relative hidden lg:block">
        <Sidebar
          role={user.role}
          userName={user.name}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="start" className="w-64 p-0 bg-slate-950 border-l border-white/10">
          <Sidebar
            role={user.role}
            userName={user.name}
            collapsed={false}
            onToggle={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onMenuToggle={() => setSidebarOpen(true)}
          userName={user.name}
          role={user.role}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
