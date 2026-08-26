import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Env mock ──────────────────────────────────────────────────────
// Vitest hoists vi.mock() factories above const declarations — shared
// mocks must be created inside vi.hoisted().
// The client reads SEARCH_HOST/SEARCH_API_KEY from env at call time, so a
// mutable object lets tests toggle "configured" vs "not configured".
const { envState } = vi.hoisted(() => ({
  envState: {
    SEARCH_HOST: "http://localhost:7700",
    SEARCH_API_KEY: "test-master-key",
  } as Record<string, string | undefined>,
}));

vi.mock("@/lib/env", () => ({
  env: envState,
}));

// Import AFTER mocking so the module sees the mocks.
import {
  COURSE_INDEX_SETTINGS,
  clearCoursesIndex,
  configureCourseIndex,
  indexCourses,
  isSearchEnabled,
  pingSearch,
  searchCoursesIndex,
  waitForSearchTask,
  type IndexedCourse,
} from "@/lib/search/client";

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

const sampleDoc: IndexedCourse = {
  id: "c1",
  title: "دوره مکالمه",
  subtitle: "زیرعنوان",
  category: "speaking",
  level: "مقدماتی",
  price: 0,
  published: true,
};

describe("search client (Meilisearch REST)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    envState.SEARCH_HOST = "http://localhost:7700";
    envState.SEARCH_API_KEY = "test-master-key";
  });

  it("isSearchEnabled() is false when host/key are unset", () => {
    envState.SEARCH_HOST = "";
    envState.SEARCH_API_KEY = "";
    expect(isSearchEnabled()).toBe(false);
  });

  it("isSearchEnabled() is true when host/key are set", () => {
    expect(isSearchEnabled()).toBe(true);
  });

  it("indexCourses POSTs documents with Bearer auth", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ taskUid: 1, status: "enqueued" }));

    const task = await indexCourses([sampleDoc]);

    expect(task?.taskUid).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:7700/indexes/courses/documents",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-master-key",
        }),
      }),
    );
  });

  it("configureCourseIndex PATCHes Persian-optimized settings", async () => {
    // PATCH returns an async task; configureCourseIndex then polls
    // GET /tasks/:uid until it settles — return "succeeded" immediately.
    fetchMock.mockImplementation(async (_url: unknown, init?: unknown) => {
      const method = (init as RequestInit | undefined)?.method;
      if (method === "PATCH") {
        return jsonResponse({ taskUid: 2, status: "enqueued" });
      }
      return jsonResponse({ taskUid: 2, status: "succeeded" });
    });

    await configureCourseIndex(COURSE_INDEX_SETTINGS);

    const patchCall = fetchMock.mock.calls.find(
      ([, i]) => (i as RequestInit | undefined)?.method === "PATCH",
    );
    const [url, init] = patchCall ?? [];
    expect(url).toBe("http://localhost:7700/indexes/courses/settings");
    expect(init?.method).toBe("PATCH");
    const body = JSON.parse(String(init?.body));
    expect(body.searchableAttributes).toContain("title");
    expect(body.filterableAttributes).toContain("published");
    expect(body.stopWords).toContain("و");
    expect(body.typoTolerance.minWordSizeForTypos.oneTypo).toBe(4);
  });

  it("searchCoursesIndex sends query, limit and published filter", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ hits: [sampleDoc], estimatedTotalHits: 1 }),
    );

    const result = await searchCoursesIndex("مکالمه", 5);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://localhost:7700/indexes/courses/search");
    const body = JSON.parse(String(init?.body));
    expect(body.q).toBe("مکالمه");
    expect(body.limit).toBe(5);
    expect(body.filter).toBe("published = true");
    expect(result?.hits).toHaveLength(1);
    expect(result?.estimatedTotalHits).toBe(1);
  });

  it("waitForSearchTask polls /tasks/{uid} until it succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ taskUid: 9, status: "enqueued" }))
      .mockResolvedValueOnce(jsonResponse({ taskUid: 9, status: "processing" }))
      .mockResolvedValueOnce(jsonResponse({ taskUid: 9, status: "succeeded" }));

    const status = await waitForSearchTask(9, 2_000);

    expect(status).toBe("succeeded");
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    for (const [url] of fetchMock.mock.calls) {
      expect(url).toContain("/tasks/9");
    }
  });

  it("clearCoursesIndex DELETEs all documents", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ taskUid: 3, status: "enqueued" }));

    await clearCoursesIndex();

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://localhost:7700/indexes/courses/documents");
    expect(init?.method).toBe("DELETE");
  });

  it("pingSearch returns false when the service is down", async () => {
    // mockResolvedValueOnce for the healthy call; mockResolvedValue (default)
    // for the down case — a second mockResolvedValue would REPLACE the first.
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "available" }));
    expect(await pingSearch()).toBe(true);

    fetchMock.mockResolvedValue(jsonResponse({}, false, 503));
    expect(await pingSearch()).toBe(false);
  });

  it("throws on non-2xx so callers can fall back to Postgres FTS", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "index not found" }, false, 404));

    await expect(searchCoursesIndex("مکالمه")).rejects.toThrow();
  });

  it("returns null (no-op) when search is not configured", async () => {
    envState.SEARCH_HOST = "";
    envState.SEARCH_API_KEY = "";

    const task = await indexCourses([sampleDoc]);
    const cleared = await clearCoursesIndex();

    expect(task).toBeNull();
    expect(cleared).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
