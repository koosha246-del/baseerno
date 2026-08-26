import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { File } from "node:buffer";
import { env } from "@/lib/env";

// ─── Module mocks (must come before importing the route) ───────────────
const getCurrentUser = vi.fn();
const cloudinaryUpload = vi.fn();
const isSameOriginRequest = vi.fn((_req?: Request) => true);
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: () => {},
    uploader: { upload: (dataUri: string, opts: unknown) => cloudinaryUpload(dataUri, opts) },
  },
}));

vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: (req: Request) => isSameOriginRequest(req),
  csrfRejectedResponse: () =>
    new Response(JSON.stringify({ error: "csrf" }), { status: 403 }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (id: string, config?: unknown) => checkRateLimit(id, config),
  getClientIdentifier: () => getClientIdentifier(),
  RATE_LIMIT_PRESETS: {
    AUTH: { windowMs: 60_000, max: 5, burst: 2, burstWindowMs: 10_000 },
    API: { windowMs: 60_000, max: 20, burst: 5, burstWindowMs: 5_000 },
    READ: { windowMs: 60_000, max: 60, burst: 10, burstWindowMs: 2_000 },
    SENSITIVE: { windowMs: 120_000, max: 3, burst: 1, burstWindowMs: 30_000 },
  },
  tooManyRequestsResponse: (retryAfter: number) =>
    new Response(JSON.stringify({ error: "rate", retryAfter }), {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }),
}));

import { POST } from "../route";

/**
 * jsdom's FormData/File don't round-trip through undici's multipart parser,
 * so we stub Request.prototype.formData with a plain lookup instead. The
 * route only needs `.size`, `.type` and `.arrayBuffer()` off the file.
 */
let uploadedFile: File | null = null;
let uploadedFolder = "baseerno";

function makeReq(origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/upload", {
    method: "POST",
    headers: { origin, "x-forwarded-for": "127.0.0.1" },
  });
}

const authenticatedUser = { id: "u-1", name: "Ali", email: "a@b.com", role: "STUDENT" as const };

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });
    getCurrentUser.mockResolvedValue(authenticatedUser);
    env.CLOUDINARY_CLOUD_NAME = "test-cloud";

    uploadedFile = new File([new Uint8Array(1024)], "photo.png", { type: "image/png" });
    uploadedFolder = "baseerno";

    vi.spyOn(Request.prototype, "formData").mockImplementation(async function () {
      return {
        get: (name: string) => {
          if (name === "file") return uploadedFile;
          if (name === "folder") return uploadedFolder;
          return null;
        },
      } as unknown as FormData;
    });
  });

  afterEach(() => {
    delete env.CLOUDINARY_CLOUD_NAME;
    vi.restoreAllMocks();
  });

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq());
    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 30 });
    const res = await POST(makeReq());
    expect(res.status).toBe(429);
  });

  it("returns 400 when no file is provided", async () => {
    uploadedFile = null;
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });

  it("returns 400 when the file exceeds 10MB", async () => {
    uploadedFile = new File([new Uint8Array(11 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });

  it("returns 400 for a disallowed file type", async () => {
    uploadedFile = new File([new Uint8Array(512)], "notes.txt", { type: "text/plain" });
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });

  it("returns 503 when Cloudinary is not configured", async () => {
    delete env.CLOUDINARY_CLOUD_NAME;
    const res = await POST(makeReq());
    expect(res.status).toBe(503);
  });

  it("uploads the file and returns the public URL", async () => {
    cloudinaryUpload.mockResolvedValue({
      secure_url: "https://res.cloudinary.com/x/image/upload/v1/photo.png",
      public_id: "baseerno/photo",
      width: 800,
      height: 600,
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://res.cloudinary.com/x/image/upload/v1/photo.png");
    expect(body.publicId).toBe("baseerno/photo");
    expect(cloudinaryUpload).toHaveBeenCalledWith(
      expect.stringContaining("data:image/png;base64,"),
      expect.objectContaining({ folder: "baseerno", resource_type: "image" }),
    );
  });

  it("routes video uploads to the video resource type", async () => {
    uploadedFile = new File([new Uint8Array(2048)], "clip.mp4", { type: "video/mp4" });
    cloudinaryUpload.mockResolvedValue({
      secure_url: "https://res.cloudinary.com/x/video.mp4",
      public_id: "baseerno/video",
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    expect(cloudinaryUpload).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ resource_type: "video" }),
    );
  });

  it("returns 500 when Cloudinary throws", async () => {
    cloudinaryUpload.mockRejectedValue(new Error("cloud error"));
    const res = await POST(makeReq());
    expect(res.status).toBe(500);
  });
});
