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

interface RegisteredConnection {
  write: StreamWriter;
  /** Terminates the underlying stream — invoked when evicted. */
  close?: () => void;
}

const connections = new Map<string, Set<RegisteredConnection>>();

const MAX_CONNECTIONS_PER_USER = 5;

/** Register a connection for a user. Returns an unsubscribe function. */
export function subscribeToUser(
  userId: string,
  write: StreamWriter,
  close?: () => void,
): () => void {
  const conn: RegisteredConnection = { write, close };
  let set = connections.get(userId);
  if (!set) {
    set = new Set();
    connections.set(userId, set);
  }
  set.add(conn);

  // Bound the number of open streams per user (a tab storm must not leak).
  // The evicted connection must be TOLD it was dropped: write a reconnect
  // hint and close its stream so EventSource fires an error and reconnects.
  // Without this the old tab stays open as a "zombie" — heartbeat pinging
  // but deaf to every future event.
  if (set.size > MAX_CONNECTIONS_PER_USER) {
    const oldest = set.values().next().value;
    if (oldest && oldest !== conn) {
      set.delete(oldest);
      try {
        oldest.write("event: reconnect\ndata: {}\n\nretry: 1000\n\n");
      } catch {
        // Stream already gone.
      }
      try {
        oldest.close?.();
      } catch {
        // Already closed.
      }
    }
  }

  return () => {
    set?.delete(conn);
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
  for (const conn of [...set]) {
    try {
      conn.write(payload);
      delivered++;
    } catch {
      // Broken stream — drop it.
      set.delete(conn);
    }
  }
  // Don't leave an empty Set behind in the registry (matches the
  // unsubscribe cleanup) — otherwise every user whose streams ever broke
  // leaks a map entry for the lifetime of the process.
  if (set.size === 0) connections.delete(userId);
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
