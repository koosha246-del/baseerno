"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { timeAgo } from "@/lib/time";
import { EmptyState } from "@/components/shared/EmptyState";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface Props {
  /** Current user id — used as effect dependency so a session switch refetches. */
  userId: string;
}

export function NotificationDropdown({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?take=10");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative size-9 rounded-lg bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="اعلامیه‌ها"
      >
        <Bell className="mx-auto size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 left-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[0.55rem] font-bold text-white ring-2 ring-slate-900">
            {unreadCount > 9 ? "۹+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-lg border border-white/10 bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-bold text-white">اعلامیه‌ها</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-white"
                >
                  <CheckCheck className="size-3.5" />
                  خواندن همه
                </button>
              )}
            </div>

            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                در حال بارگذاری...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={Inbox}
                  title="اعلامیه‌ای نیست"
                  description="وقتی خبری باشد اینجا می‌بینی."
                  size="sm"
                  className="border-0 bg-transparent p-4"
                />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5 ${
                      !n.read ? "bg-accent/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!n.read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{n.body}</p>
                        <span className="mt-1 block text-[0.65rem] text-slate-500">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="shrink-0 text-xs text-slate-500 transition-colors hover:text-white"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-white/10 px-4 py-2.5 text-center text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              مشاهده همه اعلامیه‌ها
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
