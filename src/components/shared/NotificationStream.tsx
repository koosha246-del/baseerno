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

    function connect() {
      try {
        eventSource = new EventSource("/api/notifications/stream");

        eventSource.addEventListener("connected", () => {
          logger.info("SSE connected", { module: "notification-stream" });
        });

        eventSource.addEventListener("notification", (e: MessageEvent) => {
          try {
            const _data = JSON.parse(e.data) as SSENotification;
            // Refresh the page data to show new notifications
            router.refresh();
            // Could also show a toast here
          } catch {
            // Ignore parse errors
          }
        });

        eventSource.addEventListener("error", () => {
          eventSource?.close();
          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        });
      } catch {
        // SSE not supported — fall back to polling
        reconnectTimeout = setTimeout(connect, 10_000);
      }
    }

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [router]);

  return null;
}
