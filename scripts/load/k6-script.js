/**
 * k6 load test for Baseer No (بصیر نو) — Large-scale validation.
 *
 * Usage:
 *   k6 run -e K6_BASE_URL=https://<your-domain> \
 *          -e K6_EMAIL=<test-user@example.com> \
 *          -e K6_PASSWORD=<password> \
 *          -e LOAD_VUS=50 \
 *          scripts/load/k6-script.js
 *
 * IMPORTANT: pass tuning values with `-e` (script env), NOT as shell env
 * vars. Shell env vars named K6_VUS / K6_DURATION collide with k6's own
 * config options (`vus` / `duration`) and silently override the whole
 * scenarios block, so only the default `browse` scenario would run.
 * `-e` values land in `__ENV` and keep `options.scenarios` intact.
 *
 * K6_ORIGIN: the app's login route rejects cross-origin POSTs in
 * production (CSRF), matching against siteConfig.url (baseerno.ir). When
 * load-testing a local/staging build that isn't served from the canonical
 * domain, pass -e K6_ORIGIN=https://baseerno.ir (or your real origin) so
 * the login requests pass the origin check.
 *
 * Session cookies: the app's session cookie is flagged `Secure`, and k6
 * never sends Secure cookies to http:// hosts. The login() helper reads
 * the Set-Cookie header, keeps the token in per-VU module state, and
 * forces it into the per-VU jar via cookieJar().set() (no Secure flag),
 * so authenticated scenarios work against plain-HTTP local builds too.
 * Against a real https:// domain the jar stores it natively — the forced
 * set is harmless there.
 *
 * k6 jar reset quirk: empirically the per-VU cookie jar does NOT reliably
 * persist across iterations (module state does). The search scenario
 * therefore re-stashes the saved token into the jar at the start of every
 * iteration (ensureSessionInJar) — otherwise iteration 2+ sends no cookie
 * and every search 401s.
 *
 * Client IPs: the app's AUTH rate limiter is per-IP (max=5+2 burst per
 * minute). In production each user arrives from their own IP behind the
 * proxy (x-forwarded-for). A load test hammering logins from a single
 * "local" IP would saturate the limiter instantly, so every VU presents a
 * distinct simulated client IP via x-forwarded-for — the same header the
 * app trusts in production. The IP is deterministic per (scenario, VU),
 * so an individual simulated user is still rate-limited like a real one.
 *
 * Scenarios (50 concurrent users by default, override with LOAD_VUS):
 *   - browse:    anonymous page loads (homepage, catalog, course detail)
 *   - search:    authenticated GET /api/search bursts (typo variant
 *                included — the Meilisearch typo-tolerance path)
 *   - auth:      login attempts (rate-limiter aware — modest volume)
 *   - dashboard: login once per VU, then hit the heavy dashboard pages
 *                (exercises the read-replica routing for reports)
 *
 * Thresholds (acceptance gate for "Large"):
 *   - p95 < 600ms overall, p95 < 400ms on public pages
 *   - error rate < 1% (search/auth tolerate 429s with headroom)
 *   - dashboard p95 < 600ms
 *
 * Output: after the run, `handleSummary` writes ./scripts/load/result.json
 * with per-scenario latency percentiles + error counts for bottleneck
 * analysis, and prints a human-readable table to stdout.
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const BASE = __ENV.K6_BASE_URL || "http://localhost:3000";
const EMAIL = __ENV.K6_EMAIL || "";
const PASSWORD = __ENV.K6_PASSWORD || "";
const VUS = Number(__ENV.LOAD_VUS || 50);
// Short smoke runs in CI (e.g. LOAD_DURATION=15) vs full 60s runs locally.
const DURATION = __ENV.LOAD_DURATION || "60s";
const DURATION_NUM = Number(DURATION.replace(/s$/, "")) || 60;
// Clamp the ramp so the search stages never produce a negative/zero
// duration (e.g. LOAD_DURATION=3s would otherwise give 3 - 5 = -2s).
const RAMP = Math.max(5, Math.floor(DURATION_NUM / 4));
const MAIN_STAGE = Math.max(5, DURATION_NUM - RAMP);

// k6's Go runtime has no URL global — small helpers instead.
function hostOf(u) {
  const s = u.replace(/^https?:\/\//, "").split("/")[0];
  return s.split(":")[0];
}
function originOf(u) {
  const s = u.replace(/^https?:\/\//, "").split("/")[0];
  return s.includes(":") ? `${u.startsWith("https") ? "https" : "http"}://${s}` : u;
}

// Origin sent on login POSTs. Defaults to the base URL's own origin; when
// load-testing a non-canonical host (e.g. local prod build on :8088),
// pass K6_ORIGIN=https://baseerno.ir so the CSRF origin check passes.
const ORIGIN = __ENV.K6_ORIGIN || originOf(BASE);

export const options = {
  scenarios: {
    browse: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
    },
    search: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: `${RAMP}s`, target: Math.max(5, Math.floor(VUS / 3)) },
        { duration: `${MAIN_STAGE}s`, target: Math.max(10, Math.floor(VUS / 2)) },
      ],
      exec: "searchFlow",
    },
    auth: {
      executor: "per-vu-iterations",
      vus: 5,
      iterations: 3,
      exec: "authFlow",
    },
    dashboard: {
      executor: "per-vu-iterations",
      vus: 5,
      iterations: 2,
      exec: "dashboardFlow",
    },
  },
  thresholds: {
    // Global gate equals the loosest scenario gate (dashboard's 600ms): a
    // stricter global than a scenario gate would produce contradictory
    // failures (a dashboard p95 of 550ms passing its own gate while
    // failing the global one).
    http_req_duration: ["p(95)<600"],
    // NOTE: there is intentionally NO global http_req_failed gate here.
    // k6 counts 429s as failures, but the auth/search scenarios
    // deliberately tolerate rate limiting. The strict gates live on the
    // per-scenario error rates below, which already exclude 429s.
    "http_req_duration{scenario:browse}": ["p(95)<400"],
    "http_req_duration{scenario:dashboard}": ["p(95)<600"],
    "http_req_duration{scenario:search}": ["p(95)<500"],
    browse_errors: ["rate<0.01"],
    dashboard_errors: ["rate<0.01"],
    search_errors: ["rate<0.05"], // 429s are tolerated, so 5% headroom
    auth_errors: ["rate<0.10"], // login rate-limiter can 429 gracefully
  },
};

// Per-scenario trends for the summary table.
const trends = {
  browse: new Trend("browse_ms", true),
  search: new Trend("search_ms", true),
  auth: new Trend("auth_ms", true),
  dashboard: new Trend("dashboard_ms", true),
};
const errors = {
  browse: new Rate("browse_errors"),
  search: new Rate("search_errors"),
  auth: new Rate("auth_errors"),
  dashboard: new Rate("dashboard_errors"),
};
const cacheHits = new Counter("cache_hit_count");

/**
 * Simulated client IP per (scenario, VU). Deterministic so an individual
 * simulated IP is still rate-limited like a real user (per-IP AUTH limiter
 * in the app). Uses the IANA-designated benchmarking range 198.18.0.0/15
 * (~64.5k distinct IPs from two hashed octets), so even 50+ VUs never
 * collide — 198.51.100.0/24 only has 254 addresses, where collisions were
 * likely and caused false 429s between VUs sharing a simulated IP.
 */
function fakeClientIp(scenario) {
  let h = 0;
  const seed = `${scenario}-${__VU}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const third = ((h >>> 8) % 254) + 1;
  const fourth = (h % 254) + 1;
  return `198.18.${third}.${fourth}`;
}

// Per-VU module state: persists across iterations even when the k6 cookie
// jar does not. Holds the session token between logins.
let bnSessionToken = "";

/**
 * Store the session cookie from a login response: keep the token in
 * per-VU module state AND force it into the VU jar. The jar write drops
 * the `Secure` flag, so the cookie is sent over plain HTTP too (k6 never
 * sends Secure cookies to http:// hosts). Against https:// the jar stores
 * it natively — the forced set is harmless there.
 *
 * @returns {boolean} true only if the token was found and stored — the
 * caller should treat an auth as complete only on success, so a missing /
 * misparsed Set-Cookie header can't silently turn every later request in
 * the VU into a confusing 401 cascade.
 */
function stashSessionCookie(res) {
  const sc = res.headers["Set-Cookie"] || res.headers["set-cookie"] || "";
  const m = /bn_session=([^;]+)/.exec(sc);
  if (!m) return false;
  bnSessionToken = decodeURIComponent(m[1]);
  http.cookieJar().set(BASE, "bn_session", bnSessionToken, {
    domain: hostOf(BASE),
    path: "/",
  });
  return true;
}

/**
 * Re-stash the saved token into the VU jar. Call at the START of every
 * iteration in scenarios that authenticate once and reuse the session:
 * k6's jar empirically does not reliably persist across iterations, and
 * an empty jar would make every request in iteration 2+ go out without
 * the cookie (401s).
 */
function ensureSessionInJar() {
  if (!bnSessionToken) return false;
  http.cookieJar().set(BASE, "bn_session", bnSessionToken, {
    domain: hostOf(BASE),
    path: "/",
  });
  return true;
}

/**
 * POST /api/auth/login with the CSRF Origin header + simulated client IP.
 * k6 keeps the session cookie in the per-VU jar automatically for
 * subsequent requests to BASE.
 *
 * Bounded retry with backoff: an unlucky simulated IP can still 429 within
 * its own window; we retry a couple of times so a transient 429 doesn't
 * wipe the whole search/dashboard iteration.
 *
 * @returns {{ res: Response, authed: boolean }} the final login response
 * plus whether the session cookie was successfully stored in the jar.
 */
function login(scenario = "auth") {
  const headers = {
    "Content-Type": "application/json",
    Origin: ORIGIN,
    "X-Forwarded-For": fakeClientIp(scenario),
  };
  let res = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers, tags: { scenario: "auth" } },
  );
  for (let attempt = 0; attempt < 2 && res.status === 429; attempt++) {
    sleep(2);
    res = http.post(
      `${BASE}/api/auth/login`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      { headers, tags: { scenario: "auth" } },
    );
  }
  const authed = res.status === 200 ? stashSessionCookie(res) : false;
  return { res, authed };
}

export default function browse() {
  const urls = ["/", "/courses", "/courses/c_fundamentals"];
  for (const path of urls) {
    const res = http.get(`${BASE}${path}`, { tags: { scenario: "browse" } });
    trends.browse.add(res.timings.duration);
    errors.browse.add(res.status >= 400);
    check(res, {
      "public page status 200": (r) => r.status === 200,
      "has cache-control header": (r) => r.headers["Cache-Control"] !== undefined,
    });
    if (res.headers["Cache-Control"]?.includes("s-maxage")) cacheHits.add(1);
    sleep(1);
  }
}

/**
 * Per-VU session state: k6 gives each VU its own module scope that
 * persists across iterations. The search scenario logs in once per VU and
 * reuses the 7-day session token for every subsequent iteration —
 * otherwise each iteration's login would saturate the per-IP AUTH limiter
 * (max=5+2 burst/min) in sustained runs and the scenario would skip its
 * searches exactly when load peaks.
 */
let searchAuthed = false;

/**
 * Search scenario — /api/search requires an authenticated session, so
 * login once per VU first (cookie jar is shared within the VU), then hit
 * the dedicated Meilisearch index (with a typo).
 */
export function searchFlow() {
  // In CI smoke runs (no credentials) this scenario is skipped, not failed.
  if (!EMAIL || !PASSWORD) {
    console.log("K6_EMAIL/K6_PASSWORD not set — skipping search scenario.");
    return;
  }
  if (!searchAuthed) {
    const { res, authed } = login("search");
    // Only mark the VU authed when the token really landed in the jar.
    if (authed) {
      searchAuthed = true;
    } else {
      // 429 (rate-limited) is tolerated — try again next iteration.
      if (res.status !== 429) errors.search.add(true);
      return;
    }
  }
  // k6's jar may have reset since the last iteration — re-stash the token.
  if (!ensureSessionInJar()) {
    // Guard against a hypothetical module-state reset: searchAuthed can
    // only be true while bnSessionToken is non-empty, so this branch is
    // normally unreachable — it only fires if k6 ever reset module scope.
    if (searchAuthed) searchAuthed = false; // token lost; re-login next iter
    return;
  }

  const queries = [
    "/api/search?q=" + encodeURIComponent("مکالمه"),
    "/api/search?q=" + encodeURIComponent("مکلمه"), // typo → typo-tolerance
    "/api/search?q=" + encodeURIComponent("گرامر"),
  ];
  const searchHeaders = { "X-Forwarded-For": fakeClientIp("search") };
  for (const q of queries) {
    const res = http.get(`${BASE}${q}`, {
      headers: searchHeaders,
      tags: { scenario: "search" },
    });
    trends.search.add(res.timings.duration);
    // 429 (rate-limited) is an acceptable outcome for search, not an error.
    errors.search.add(res.status >= 400 && res.status !== 429);
    check(res, {
      "search status < 500": (r) => r.status < 500,
      "search returns json": (r) => r.headers["Content-Type"]?.includes("application/json"),
    });
    sleep(0.5);
  }
}

export function authFlow() {
  if (!EMAIL || !PASSWORD) {
    console.log("K6_EMAIL/K6_PASSWORD not set — skipping auth scenario.");
    return;
  }
  // Stagger so auth logins don't saturate a simulated IP's window before
  // the search/dashboard scenarios get their own logins in.
  sleep(3 + Math.random() * 3);
  const { res } = login("auth");
  trends.auth.add(res.timings.duration);
  errors.auth.add(res.status >= 400 && res.status !== 429);
  check(res, {
    "login accepted (200)": (r) => r.status === 200,
    "login rate-limited gracefully (429)": (r) => r.status === 429,
  });
  sleep(2);
}

/**
 * Dashboard scenario — login once per VU, then hit heavy pages (replica
 * path). The Cache-Control check below is informational only: it does NOT
 * feed error rates or thresholds (those use status codes), so a red ✗
 * there is cosmetic, not a gate failure.
 */
export function dashboardFlow() {
  if (!EMAIL || !PASSWORD) {
    console.log("K6_EMAIL/K6_PASSWORD not set — skipping dashboard scenario.");
    return;
  }
  // Stagger logins so dashboard VUs don't all hit the login rate limiter
  // in the same second (auth scenario already exercises it).
  sleep(1);
  const { res: loginRes } = login("dashboard");
  // k6 keeps the session cookie in the per-VU jar automatically; the
  // dashboard pages require it, so skip if login failed (429 tolerated).
  if (loginRes.status !== 200) {
    if (loginRes.status !== 429) errors.dashboard.add(true);
    return;
  }
  ensureSessionInJar(); // same jar-reset guard as the search scenario

  const pages = ["/dashboard", "/dashboard/reports", "/dashboard/finance"];
  const dashHeaders = { "X-Forwarded-For": fakeClientIp("dashboard") };
  for (const path of pages) {
    const res = http.get(`${BASE}${path}`, {
      headers: dashHeaders,
      tags: { scenario: "dashboard" },
    });
    trends.dashboard.add(res.timings.duration);
    errors.dashboard.add(res.status >= 400);
    check(res, {
      "dashboard status 200": (r) => r.status === 200,
      "dashboard not cached publicly": (r) => {
        const cc = r.headers["Cache-Control"] || "";
        return cc.includes("private") || cc.includes("no-store");
      },
    });
    sleep(1);
  }
}

/**
 * Machine-readable + human-readable summary for bottleneck analysis.
 * NOTE: k6 Trend metrics only expose p(90) and p(95) — there is no p(99),
 * so the summary reports p90 as the tail signal (a literal p99 would
 * always render 0 and mislead readers into thinking the tail is clean).
 */
export function handleSummary(data) {
  const out = { timestamp: new Date().toISOString(), baseUrl: BASE, vus: VUS };
  for (const name of Object.keys(trends)) {
    const m = data.metrics[`${name}_ms`];
    if (!m) continue;
    out[name] = {
      p50: Math.round(m.values.med ?? 0),
      p90: Math.round(m.values["p(90)"] ?? 0),
      p95: Math.round(m.values["p(95)"] ?? 0),
      avg: Math.round(m.values.avg),
      errors: Math.round((data.metrics[`${name}_errors`]?.values.rate ?? 0) * 1000) / 10,
    };
  }
  out.cacheSMaxageHits = data.metrics.cache_hit_count?.values.count ?? 0;

  const lines = [
    "",
    "═══════════ k6 Large-scale summary ═══════════",
    `baseUrl: ${BASE}   vus: ${VUS}`,
    "─────────────────────────────────────────────",
    "scenario   p50(ms)  p90(ms)  p95(ms)  err%",
    "─────────────────────────────────────────────",
  ];
  for (const name of Object.keys(trends)) {
    const s = out[name];
    if (!s) continue;
    lines.push(
      `${name.padEnd(10)} ${String(s.p50).padStart(6)}   ${String(s.p90).padStart(6)}   ${String(s.p95).padStart(6)}   ${String(s.errors).padStart(4)}`,
    );
  }
  lines.push("─────────────────────────────────────────────");
  lines.push(`public pages served with s-maxage: ${out.cacheSMaxageHits}`);
  lines.push("");
  lines.push("Gates: overall p95<600 · browse p95<400/err<1% · search p95<500/err<5% · dashboard p95<600/err<1% · auth err<10%");
  lines.push("JSON: ./scripts/load/result.json");

  return {
    stdout: lines.join("\n") + "\n",
    "scripts/load/result.json": JSON.stringify(out, null, 2),
  };
}
