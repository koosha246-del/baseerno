"use client";

import { useEffect, useRef, useState } from "react";

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
 *
 * Visual loading state:
 *   - Until frame 0 is decoded, we show a branded aurora-gradient hero
 *     with a "↓ اسکرول کن" hint so the user never sees a blank black
 *     canvas. As soon as the first frame paints, the hero crossfades out
 *     (200ms) and the canvas takes over.
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
  // Tracks whether the very first frame has decoded & been drawn.
  // While false, we render a branded hero placeholder on top of the canvas.
  const [firstFrameReady, setFirstFrameReady] = useState(false);

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
          if (idx === 0 && !firstFrameReady) {
            setFirstFrameReady(true);
          }
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
    // We intentionally exclude `firstFrameReady` from deps — we only need
    // to set it once on the first paint, and adding it would re-run the
    // whole effect every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Brand aurora gradient — visible only as a backdrop if the
        // canvas itself ever fails to initialize; otherwise the canvas
        // sits on top and paints frames over it.
        background:
          "radial-gradient(55% 55% at 18% 22%, rgba(27,79,212,0.22) 0%, rgba(27,79,212,0) 60%), radial-gradient(45% 45% at 85% 28%, rgba(245,197,24,0.20) 0%, rgba(245,197,24,0) 60%), radial-gradient(50% 50% at 60% 88%, rgba(212,160,23,0.16) 0%, rgba(212,160,23,0) 60%), linear-gradient(180deg, #131922 0%, #0b0f17 100%)",
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
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            // Canvas stays painted (black under the gradient placeholder
            // until frame 0 lands). Opacity controlled below.
            opacity: firstFrameReady ? 1 : 0,
            transition: "opacity 240ms ease-out",
          }}
        />

        {/* Branded loading placeholder — visible until the first frame
            decodes. Crossfades out as soon as the canvas paints frame 0
            so the user never sees a jarring black flash. */}
        <div
          aria-hidden={firstFrameReady}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            padding: "1.5rem",
            textAlign: "center",
            color: "#fff",
            pointerEvents: "none",
            opacity: firstFrameReady ? 0 : 1,
            transition: "opacity 240ms ease-out",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "999px",
                background: "#f5c518",
                boxShadow: "0 0 12px #f5c518",
                animation: "scroll-pulse 1.4s ease-in-out infinite",
              }}
            />
            بصیر نو · در حال بارگذاری
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 4.5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              maxWidth: "32ch",
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}
          >
            یادگیری زبان انگلیسی،
            <br />
            <span
              style={{
                background:
                  "linear-gradient(120deg, #1E3A5F 0%, #1B4FD4 40%, #D4A017 70%, #F5C518 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              گام به گام
            </span>
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: "44ch",
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            برای دیدن انیمیشن اسکرول کنید ↓
          </p>
        </div>
      </div>

      {/* Inline keyframes — the animation has no global stylesheet
          dependency, so this works in Storybook too. */}
      <style>{`
        @keyframes scroll-pulse {
          0%, 100% { opacity: 0.55; transform: scale(0.9); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes scroll-pulse { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; } }
        }
      `}</style>
    </div>
  );
}
