import { getCurrentUser } from "@/lib/auth/session";
import { subscribeToUser } from "@/lib/realtime";

/**
 * GET /api/notifications/stream — Server-Sent Events for live
 * notifications.
 *
 * Auth: the session cookie is read server-side; unauthenticated requests
 * get 401 (the stream itself carries no secret payload — it only forwards
 * events the user is entitled to).
 *
 * Client usage (see NotificationDropdown):
 *   const es = new EventSource("/api/notifications/stream");
 *   es.addEventListener("notification", (e) => ...);
 *
 * Note: SSE requires a streaming-friendly host. Vercel supports streaming
 * within the function duration; on platforms without it the client falls
 * back to polling (already implemented).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = user.id;

  const encoder = new TextEncoder();

  // Hoisted so both the abort signal and cancel() can trigger the same
  // cleanup (interval + unsubscribe) without leaking timers.
  let cleanupRef: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (payload: string) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed — ignore.
        }
      };

      // Send an initial comment so proxies keep the connection open.
      write(": connected\n\n");

      // Heartbeat every 25s keeps the connection alive through proxies.
      const heartbeat = setInterval(() => write(": ping\n\n"), 25_000);

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };
      cleanupRef = cleanup;

      const unsubscribe = subscribeToUser(userId, write);

      // Standard Next.js abort pattern: the platform aborts the request
      // when the client disconnects.
      req.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      // Some runtimes cancel the stream without aborting req.signal —
      // trigger the same cleanup so no timer/connection leaks.
      cleanupRef?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
