"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "../providers/sidebar-provider";

interface DashboardShellProps {
  children: React.ReactNode;
  user: { id: string; name: string; email: string; role: string };
}

function ShellInner({ children, user }: DashboardShellProps) {
  const { sidebarOpen, setSidebarOpen, collapsed, toggleCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-white" dir="rtl">
      {/* Desktop sidebar */}
      <div
        className={cn(
          "relative hidden shrink-0 transition-[width] duration-300 ease-luxury lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <Sidebar
          role={user.role}
          userName={user.name}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
      </div>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="start" className="w-64 border-l border-white/10 bg-slate-950 p-0">
          <Sidebar
            role={user.role}
            userName={user.name}
            collapsed={false}
            onToggle={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content — width animates with sidebar collapse */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-luxury">
        <TopBar
          onMenuToggle={() => setSidebarOpen(true)}
          userName={user.name}
          role={user.role}
          userId={user.id}
        />
        <main className="flex-1 overflow-y-auto p-4 transition-[padding] duration-300 ease-luxury lg:p-6">
          <div
            className={cn(
              "mx-auto w-full transition-all duration-300 ease-luxury",
              collapsed ? "max-w-[1600px]" : "max-w-7xl",
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <ShellInner user={user}>{children}</ShellInner>
    </SidebarProvider>
  );
}
