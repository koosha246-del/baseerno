"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-driven animation player.
 *
 * Maps the document's vertical scroll position within a tall sticky container
 * to one of 300 pre-extracted frames. The current frame is painted on a
 * <canvas> via a single requestAnimationFrame loop, so the playback feels
 * 1:1 with the user's scroll (no lag, no interpolation) and remains smooth
 * even on long pages.
 *
 * Performance notes:
 *   - Frames are loaded progressively, not all at once. Frame 0 fires
 *     immediately so the first paint is instant; the next ~30 frames
 *     (≈ 100vh of scroll) follow in microtasks; the rest trickle in via
 *     requestIdleCallback. This caps the initial request burst at ~30
 *     instead of 300, which keeps HTTP/2 happy and the network unblocked.
 *   - Canvas backing store scales with devicePixelRatio (capped at 2x to
 *     avoid blowing up memory on 3x/4x phones).
 *   - scroll listener is passive; rAF throttles the actual draw calls.
 *   - Image smoothing is enabled for clean downscales on high-DPR screens.
 */
const FRAME_COUNT = 300;
const PRIORITY_BATCH = 30; // first 30 frames loaded eagerly after frame 0
const IDLE_BATCH = 8; // frames per idle callback
const pad = (n: number) => String(n).padStart(3, "0");
const frameSrc = (i: number) => `/scroll-frames/ezgif-frame-${pad(i + 1)}.jpg`;

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;
type IdleHandle = number;
interface IdleScheduler {
  request: (cb: IdleCallback) => IdleHandle;
  cancel: (h: IdleHandle) => void;
}

/** requestIdleCallback with setTimeout fallback for Safari / older browsers. */
const idleScheduler: IdleScheduler =
  typeof window === "undefined"
    ? { request: () => 0, cancel: () => {} }
    : "requestIdleCallback" in window
      ? {
          request: (cb) => window.requestIdleCallback(cb, { timeout: 1500 }),
          cancel: (h) => window.cancelIdleCallback(h),
        }
      : {
          request: (cb) =>
            window.setTimeout(
              () => cb({ didTimeout: false, timeRemaining: () => 50 }),
              50,
            ) as unknown as number,
          cancel: (h) => window.clearTimeout(h),
        };

function loadOne(i: number, bucket: HTMLImageElement[]): HTMLImageElement {
  if (bucket[i]) return bucket[i];
  const img = new Image();
  img.decoding = "async";
  img.src = frameSrc(i);
  bucket[i] = img;
  return img;
}

export function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const cancelledRef = useRef(false);

  // ─── Progressive preload ─────────────────────────────────────────
  //
  // Phase 1 (synchronous-ish): frame 0 fires immediately. The browser
  // dispatches the request before the next paint so the user never sees
  // a blank canvas.
  //
  // Phase 2 (microtask): frames 1..PRIORITY_BATCH are loaded right after
  // to cover the first viewport of scroll.
  //
  // Phase 3 (idle): the remaining frames are batched into requestIdleCallback
  // callbacks, IDLE_BATCH per slot, until the full catalog is in flight.
  // If the user navigates away mid-load, `cancelledRef` aborts the rest.
  useEffect(() => {
    cancelledRef.current = false;
    const bucket = imagesRef.current;

    // Phase 1 — frame 0
    loadOne(0, bucket);

    // Phase 2 — frames 1..PRIORITY_BATCH on next microtask
    queueMicrotask(() => {
      if (cancelledRef.current) return;
      const limit = Math.min(PRIORITY_BATCH, FRAME_COUNT - 1);
      for (let i = 1; i <= limit; i++) loadOne(i, bucket);
    });

    // Phase 3 — remaining frames in idle time
    let cursor = PRIORITY_BATCH + 1;
    const pump: IdleCallback = () => {
      if (cancelledRef.current || cursor >= FRAME_COUNT) return;
      const end = Math.min(cursor + IDLE_BATCH, FRAME_COUNT);
      for (let i = cursor; i < end; i++) loadOne(i, bucket);
      cursor = end;
      if (cursor < FRAME_COUNT) {
        idleHandle = idleScheduler.request(pump);
      }
    };
    let idleHandle = idleScheduler.request(pump);

    return () => {
      cancelledRef.current = true;
      idleScheduler.cancel(idleHandle);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const draw = () => {
      const img = imagesRef.current[currentFrameRef.current];
      if (!img || img.naturalWidth === 0) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      // Cover-fit: fill the canvas, cropping if needed.
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      draw();
    };

    const updateFrame = () => {
      const rect = container.getBoundingClientRect();
      const total = container.offsetHeight - window.innerHeight;
      if (total <= 0) {
        currentFrameRef.current = 0;
        return;
      }
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      currentFrameRef.current = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(p * (FRAME_COUNT - 1))),
      );
    };

    resize();
    updateFrame();

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateFrame, { passive: true });

    let lastPainted = -1;
    let raf = 0;
    const tick = () => {
      const idx = currentFrameRef.current;
      if (idx !== lastPainted) {
        const img = imagesRef.current[idx];
        if (img && img.naturalWidth > 0) {
          draw();
          lastPainted = idx;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateFrame);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        // 1000vh of scroll → 300 frames → ~3.3vh per frame.
        // The user has roughly 3× the scroll distance of a 500vh page
        // to traverse the animation, so each frame lingers longer and
        // the motion feels more cinematic.
        height: "1000vh",
        background: "#000",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100dvh",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
