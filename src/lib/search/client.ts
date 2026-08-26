/**
 * Dedicated search client — Meilisearch-compatible REST API via fetch.
 *
 * No SDK dependency: speaks the Meilisearch REST protocol directly
 * (indexes/documents + indexes/search). Typesense uses a different
 * protocol, so this client targets Meilisearch; the interface is the
 * integration seam — swap the implementation if you deploy Typesense.
 *
 * Graceful degradation:
 *  - When `SEARCH_HOST`/`SEARCH_API_KEY` are unset, every function is a
 *    no-op (returns null) and `isSearchEnabled()` is false — the rest of
 *    the app keeps working on the Postgres FTS fallback (search.repo.ts).
 *  - When the search service is down, functions throw; callers catch and
 *    fall back (already the pattern in search.repo.ts).
 */

import { env } from "@/lib/env";

export const COURSES_INDEX = "courses";

/** Whether a dedicated search engine is configured. */
export function isSearchEnabled(): boolean {
  return Boolean(env.SEARCH_HOST?.trim() && env.SEARCH_API_KEY?.trim());
}

function baseUrl(): string {
  return (env.SEARCH_HOST ?? "").replace(/\/$/, "");
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.SEARCH_API_KEY}`,
  };
}

/** Perform a raw request; throws on non-2xx so callers can fall back. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isSearchEnabled()) throw new Error("search not configured");
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`search request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface IndexedCourse {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  price: number | null;
  published: boolean;
}

/**
 * Persian-optimized index settings (PATCH /indexes/{uid}/settings).
 *
 * - `searchableAttributes` order = field ranking (title first).
 * - `filterableAttributes` lets the API filter `published = true` server-side.
 * - `stopWords` removes high-frequency Persian connectors so they don't
 *   dominate relevance.
 * - `typoTolerance` with lower `minWordSizeForTypos` than the English
 *   default (4/7 instead of 5/9) — Persian words are shorter, so a typo in
 *   a 5-letter word like «مکالمه» should still match «مکلمه».
 */
export const COURSE_INDEX_SETTINGS = {
  searchableAttributes: ["title", "subtitle", "category", "level"],
  filterableAttributes: ["published", "category", "level", "price"],
  sortableAttributes: ["price"],
  stopWords: ["و", "در", "به", "از", "برای", "با", "که", "این", "آن", "را", "هم", "یا", "نیز", "مثل", "مثلا", "های", "ها"],
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 7 },
  },
} as const;

export interface SearchTask {
  taskUid: number;
  status: "enqueued" | "processing" | "succeeded" | "failed" | "canceled";
}

/**
 * Apply index settings and wait for them to take effect.
 * Meilisearch returns an async task; we poll until the settings are live
 * so callers can immediately index documents with the new configuration.
 */
export async function configureCourseIndex(
  settings: typeof COURSE_INDEX_SETTINGS = COURSE_INDEX_SETTINGS,
): Promise<SearchTask | null> {
  if (!isSearchEnabled()) return null;
  const task = await request<SearchTask>(`/indexes/${COURSES_INDEX}/settings`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  // Wait for the settings to be applied before returning
  if (task?.taskUid) {
    await waitForSearchTask(task.taskUid);
  }
  return task;
}

/** Liveness probe — GET /health (no auth required by Meilisearch). */
export async function pingSearch(): Promise<boolean> {
  if (!isSearchEnabled()) return false;
  try {
    await request<{ status: string }>("/health");
    return true;
  } catch {
    return false;
  }
}

/**
 * Poll an async Meilisearch task until it settles (succeeded/failed/…).
 * Returns "processing" when the timeout elapses first.
 */
export async function waitForSearchTask(
  taskUid: number,
  timeoutMs = 30_000,
): Promise<SearchTask["status"]> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = await request<SearchTask>(`/tasks/${taskUid}`);
    if (task.status !== "enqueued" && task.status !== "processing") {
      return task.status;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return "processing"; // timed out
}

/** Upsert course documents into the search index (batch). Returns the async task. */
export async function indexCourses(docs: IndexedCourse[]): Promise<SearchTask | null> {
  if (!isSearchEnabled() || docs.length === 0) return null;
  return request<SearchTask>(`/indexes/${COURSES_INDEX}/documents`, {
    method: "POST",
    body: JSON.stringify(docs),
  });
}

/**
 * Remove ALL documents from the courses index (full re-seed).
 * Returns the async task, or null when search is not configured.
 */
export async function clearCoursesIndex(): Promise<SearchTask | null> {
  if (!isSearchEnabled()) return null;
  return request<SearchTask>(`/indexes/${COURSES_INDEX}/documents`, {
    method: "DELETE",
  });
}

/** Remove a course document from the index. */
export async function deleteCourse(id: string): Promise<unknown> {
  if (!isSearchEnabled()) return null;
  return request(`/indexes/${COURSES_INDEX}/documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  price: number | null;
}

export interface SearchResult {
  hits: SearchHit[];
  /** Meilisearch estimated total hits (for pagination later). */
  estimatedTotalHits: number;
}

/**
 * Search the course index. Throws when the service is unreachable so the
 * caller (search.repo) can fall back to Postgres FTS.
 */
export async function searchCoursesIndex(
  query: string,
  limit = 10,
): Promise<SearchResult | null> {
  if (!isSearchEnabled()) return null;
  const data = await request<{ hits: SearchHit[]; estimatedTotalHits: number }>(
    `/indexes/${COURSES_INDEX}/search`,
    {
      method: "POST",
      body: JSON.stringify({
        q: query,
        limit,
        attributesToRetrieve: ["id", "title", "subtitle", "category", "level", "price"],
        filter: "published = true",
      }),
    },
  );
  return { hits: data.hits, estimatedTotalHits: data.estimatedTotalHits };
}
