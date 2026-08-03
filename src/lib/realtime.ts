/**
 * Realtime — in-memory SSE connection registry.
 *
 * Each authenticated `/api/notifications/stream` connection registers a
 * controller keyed by userId. The Event Bus pushes notification events to
 * the user's open connections via `pushToUser`.
 *
 * Constraints:
 *  - Single-instance only (documented): on multi-instance deployments a
 *    shared pub/sub (Redis) is required — the seam is `pushToUser`, which
 *    would publish to a Redis channel instead and each instance would
 *    deliver to its own local connections.
 *  - Bounded: max connections per user + periodic prune of stale sockets.
 */

export type RealtimeEvent =
  | { type: "notification"; title: string; body: string; link?: string | null }
  | { type: "message-sent" }
  | { type: "grade-posted" }
  | { type: "enrollment" }
  | { type: "certificate-issued" };

type StreamWriter = (payload: string) => void;

const connections = new Map<string, Set<StreamWriter>>();

const MAX_CONNECTIONS_PER_USER = 5;

/** Register a connection for a user. Returns an unsubscribe function. */
export function subscribeToUser(userId: string, write: StreamWriter): () => void {
  let set = connections.get(userId);
  if (!set) {
    set = new Set();
    connections.set(userId, set);
  }
  set.add(write);

  // Bound the number of open streams per user (a tab storm must not leak).
  if (set.size > MAX_CONNECTIONS_PER_USER) {
    const oldest = set.values().next().value;
    if (oldest) set.delete(oldest);
  }

  return () => {
    set?.delete(write);
    if (set && set.size === 0) connections.delete(userId);
  };
}

/** Serialize an event to SSE format. */
export function encodeSse(event: RealtimeEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Push an event to all open connections of a user.
 * @returns Number of connections that received the event.
 */
export function pushToUser(userId: string, event: RealtimeEvent): number {
  const set = connections.get(userId);
  if (!set || set.size === 0) return 0;

  const payload = encodeSse(event);
  let delivered = 0;
  for (const write of [...set]) {
    try {
      write(payload);
      delivered++;
    } catch {
      // Broken stream — drop it.
      set.delete(write);
    }
  }
  return delivered;
}

/** Current number of open connections (diagnostics). */
export function connectionCount(): number {
  let n = 0;
  for (const set of connections.values()) n += set.size;
  return n;
}

/** Test helper — clear all connections. */
export function clearRealtimeConnections(): void {
  connections.clear();
}
