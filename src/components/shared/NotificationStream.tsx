/**
 * NotificationStream — client component that listens to the SSE endpoint
 * and triggers toast notifications when new notifications arrive.
 *
 * Renders nothing visible. Place once in the app layout or providers.
 *
 * Usage:
 * ```tsx
 * // In layout.tsx or Providers.tsx:
 * <NotificationStream />
 * ```
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface SSENotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  createdAt: string;
}

export function NotificationStream() {
  const router = useRouter();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    // Exponential backoff — caps at 60s so a long outage doesn't hot-loop.
    let retryDelayMs = 5000;
    // Anonymous visitors: the stream endpoint returns 401. Retrying forever
    // would hammer getCurrentUser() every few seconds per tab — stop instead,
    // and re-arm when the user actually logs in (visibility/focus probe).
    let stopped = false;

    function scheduleRetry() {
      if (stopped) return;
      reconnectTimeout = setTimeout(connect, retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, 60_000);
    }

    async function isAuthed(): Promise<boolean> {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        return res.ok;
      } catch {
        return false;
      }
    }

    async function connect() {
      if (stopped) return;
      if (!(await isAuthed())) {
        // Not logged in — check again on next tab focus instead of looping.
        const onFocus = () => {
          if (!stopped) void connect();
        };
        window.addEventListener("focus", onFocus, { once: true });
        return;
      }

      try {
        eventSource = new EventSource("/api/notifications/stream");

        eventSource.addEventListener("connected", () => {
          logger.info("SSE connected", { module: "notification-stream" });
          retryDelayMs = 5000; // reset backoff on success
        });

        eventSource.addEventListener("notification", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as SSENotification;
            toast(data.title, {
              description: data.body,
              action: data.link
                ? {
                    label: "مشاهده",
                    onClick: () => {
                      router.push(data.link!);
                    },
                  }
                : undefined,
            });
            router.refresh();
          } catch {
            // Ignore parse errors
          }
        });

        eventSource.addEventListener("error", () => {
          eventSource?.close();
          scheduleRetry();
        });
      } catch {
        scheduleRetry();
      }
    }

    void connect();

    return () => {
      stopped = true;
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [router]);

  return null;
}
