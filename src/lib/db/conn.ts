/**
 * PostgreSQL connection-string helper.
 *
 * Prisma serializes `DateTime` values (params AND writes) as naive UTC
 * wall-clock strings — e.g. `2026-08-02 11:21:48.191` with NO timezone
 * offset. Postgres then interprets that string in the **session**
 * timezone. If the session runs in a non-UTC zone (e.g. `Asia/Tehran`,
 * +03:30), every instant is silently shifted by the offset:
 *
 *   - `now()` appears to be in the future (backoff `nextAttemptAt <= now()`
 *     is always true → rows retry immediately, never wait);
 *   - a JS-computed cutoff sent as a param is interpreted as local time
 *     (stuck-row recovery `updatedAt < cutoff` never fires).
 *
 * The same serialization is used on write, so a consistent UTC session
 * makes ALL instants agree. This appends `options=-c timezone=UTC` to the
 * connection string, pinning the session to UTC regardless of the server's
 * configured `TimeZone`. It is a no-op when the server already runs UTC.
 */
export function withUtcSession(databaseUrl: string): string {
  const UTC_OPT = "-c%20timezone%3DUTC";
  // If the operator already set an `options` param (e.g. Railway pooled URLs
  // with statement_timeout), append our timezone flag to it instead of
  // skipping — otherwise the pin would silently no-op.
  const m = databaseUrl.match(/[?&]options=([^&]*)/);
  if (m) {
    const existing = m[1]!;
    if (existing.includes("timezone")) return databaseUrl; // already pinned
    const merged = `${existing}%20${UTC_OPT}`;
    return databaseUrl.replace(/[?&]options=([^&]*)/, `${m[0].startsWith("?") ? "?" : "&"}options=${merged}`);
  }
  const sep = databaseUrl.includes("?") ? "&" : "?";
  return `${databaseUrl}${sep}options=${UTC_OPT}`;
}
