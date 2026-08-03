/**
 * SSE (Server-Sent Events) — real-time push notification infrastructure.
 *
 * Manages active SSE connections per userId and provides `pushNotification()`
 * for other modules (like notifications.ts) to push events to connected clients.
 *
 * In production, replace the in-memory Map with Redis Pub/Sub for multi-instance support.
 */

import { logger } from "@/lib/logger";

// ─── Types ─────────────────────────────────────────────────────────

export interface SSENotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  createdAt: string;
}

// ─── Connection Registry ───────────────────────────────────────────

/**
 * In-memory registry of active SSE connections per userId.
 * Map<userId, ReadableStreamDefaultController>
 */
const connections = new Map<string, ReadableStreamDefaultController>();

// ─── Push Notification ─────────────────────────────────────────────

/**
 * Send a notification to all active SSE connections for a given user.
 * Called by notification helpers after creating a DB notification.
 *
 * @param userId - The user to notify
 * @param notification - The notification payload to send
 */
export function pushNotification(
  userId: string,
  notification: SSENotificationPayload,
): void {
  const controller = connections.get(userId);
  if (!controller) return; // User has no active SSE connection

  try {
    const data = JSON.stringify({
      type: "notification",
      payload: notification,
    });
    controller.enqueue(new TextEncoder().encode(`event: notification\ndata: ${data}\n\n`));
  } catch (error) {
    logger.error("SSE push failed", { module: "sse", userId, error });
    connections.delete(userId);
  }
}

// ─── Connection Management ─────────────────────────────────────────

/**
 * Register a new SSE connection for a user.
 * Closes any previous connection for the same user (only one tab at a time).
 */
export function registerConnection(
  userId: string,
  controller: ReadableStreamDefaultController,
): void {
  const existing = connections.get(userId);
  if (existing) {
    try {
      existing.close();
    } catch {
      // Ignore close errors
    }
  }

  connections.set(userId, controller);
  logger.info("SSE connection opened", { module: "sse", userId });
}

/**
 * Unregister a user's SSE connection (called on stream cancel/close).
 */
export function unregisterConnection(userId: string): void {
  connections.delete(userId);
  logger.info("SSE connection closed", { module: "sse", userId });
}
