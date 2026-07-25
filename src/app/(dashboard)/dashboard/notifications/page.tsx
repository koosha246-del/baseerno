"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { timeAgo } from "@/lib/time";
import { EmptyState } from "@/components/shared/EmptyState";
import { toPersianDigits } from "@/lib/format";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  async function fetchNotifications() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: "50" });
      if (filter === "unread") params.set("unread", "true");
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // fetchNotifications is intentionally redefined on every render (it
    // closes over the current `filter`), so depending on it would loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  async function markAllAsRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">اعلامیه‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">
            {unreadCount > 0
              ? `${toPersianDigits(unreadCount)} اعلامیه خوانده‌نشده`
              : "همه اعلامیه‌ها خوانده شده"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "all" ? "bg-accent text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              همه
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "unread" ? "bg-accent text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              خوانده‌نشده
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              <CheckCheck className="size-3.5" />
              خواندن همه
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={filter === "unread" ? Bell : Inbox}
          title={filter === "unread" ? "اعلامیه خوانده‌نشده‌ای نیست" : "اعلامیه‌ای نیست"}
          description={
            filter === "unread"
              ? "همه اعلامیه‌ها را خوانده‌ای. عالی!"
              : "وقتی خبری از دوره، نمره یا پیام باشد اینجا می‌بینی."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-colors hover:bg-white/[0.04] ${
                n.read
                  ? "border-white/5 bg-white/[0.02]"
                  : "border-accent/20 bg-accent/5"
              }`}
            >
              {!n.read && (
                <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">{n.title}</h3>
                  <span className="shrink-0 text-[0.65rem] text-slate-500">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{n.body}</p>
                {n.link && (
                  <a
                    href={n.link}
                    className="mt-2 inline-block text-xs text-accent hover:underline"
                  >
                    مشاهده ←
                  </a>
                )}
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markAsRead(n.id)}
                  className="shrink-0 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400 transition-colors hover:text-white"
                >
                  خواندم
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
