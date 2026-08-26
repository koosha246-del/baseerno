/**
 * Auth constants — zero-dependency so Edge runtime (middleware) can import
 * without pulling in env.ts, jwt libs, or anything Node-specific.
 */

/** Cookie name used for the session JWT. */
export const AUTH_COOKIE = "bn_session";
