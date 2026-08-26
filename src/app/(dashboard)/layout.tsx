import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";

/**
 * Dashboard is a private, authenticated area — keep it out of search engines.
 * This noindex applies to every /dashboard/* route via this parent layout.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

/**
 * Dashboard layout — protects all /dashboard/* routes.
 *
 * Reads the session cookie, redirects to /login when unauthenticated.
 * Passes the safe user to the client DashboardShell for role-based rendering.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}
