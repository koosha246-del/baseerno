"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  /** Direct video URL (.mp4/.webm) or YouTube/Vimeo share URL. */
  src: string;
  /** Poster/thumbnail shown before play. */
  poster?: string;
  /** Optional title shown below the player. */
  title?: string;
  /** Auto-play on mount (default false — respects user preference). */
  autoPlay?: boolean;
  className?: string;
}

/** Parse a YouTube share/shorts URL into an embed URL. */
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
    }
    if (u.hostname.includes("youtu.be")) {
      const v = u.pathname.slice(1);
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
    }
  } catch {
    // not a URL
  }
  return null;
}

/** Parse a Vimeo share URL into an embed URL. */
function toVimeoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const v = u.pathname.slice(1);
      if (v) return `https://player.vimeo.com/video/${v}?autoplay=1`;
    }
  } catch {
    // not a URL
  }
  return null;
}

type EmbedType = "youtube" | "vimeo" | "native";

function detectEmbedType(src: string): EmbedType {
  if (toYouTubeEmbed(src)) return "youtube";
  if (toVimeoEmbed(src)) return "vimeo";
  return "native";
}

// ─── Native HTML5 video player ───────────────────────────────────────────────

function NativePlayer({ src, poster, autoPlay, title }: Omit<VideoPlayerProps, "src"> & { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-video overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="size-full object-contain"
        />

        {/* Big play/pause overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 hover:bg-black/20"
          aria-label={playing ? "Pause" : "Play"}
        >
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-all duration-300",
              "group-hover:scale-110",
              playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            )}
          >
            {playing ? (
              <Pause className="size-7 fill-white text-white" />
            ) : (
              <Play className="size-7 fill-white text-white mr-0.5" />
            )}
          </div>
        </button>

        {/* Bottom controls bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button onClick={togglePlay} className="text-white/90 hover:text-white">
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <button onClick={toggleMute} className="text-white/90 hover:text-white">
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>

          {/* Progress bar */}
          <div
            className="group/progress relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/30"
            onClick={handleProgressClick}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="text-white/90 hover:text-white"
            aria-label="Fullscreen"
          >
            <Maximize className="size-4" />
          </button>
        </div>
      </div>

      {title && <p className="text-sm font-medium text-fg-secondary">{title}</p>}
    </div>
  );
}

// ─── Iframe embed player ─────────────────────────────────────────────────────

function EmbedPlayer({
  embedType,
  src,
  title,
}: {
  embedType: "youtube" | "vimeo";
  src: string;
  title?: string;
}) {
  const embedUrl =
    embedType === "youtube"
      ? toYouTubeEmbed(src) ?? src
      : toVimeoEmbed(src) ?? src;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          src={embedUrl}
          title={title ?? "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="size-full border-0"
          loading="lazy"
        />
      </div>
      {title && <p className="text-sm font-medium text-fg-secondary">{title}</p>}
    </div>
  );
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * VideoPlayer — supports direct video URLs and YouTube / Vimeo embeds.
 *
 * Usage:
 *   <VideoPlayer src="https://www.youtube.com/watch?v=abc" title="مقدمه" />
 *   <VideoPlayer src="/videos/intro.mp4" poster="/thumb.jpg" />
 */
export function VideoPlayer({ src, poster, title, autoPlay = false, className }: VideoPlayerProps) {
  const embedType = detectEmbedType(src);

  if (embedType === "youtube") {
    return <EmbedPlayer embedType="youtube" src={src} title={title} />;
  }
  if (embedType === "vimeo") {
    return <EmbedPlayer embedType="vimeo" src={src} title={title} />;
  }

  return (
    <div className={cn("", className)}>
      <NativePlayer src={src} poster={poster} title={title} autoPlay={autoPlay} />
    </div>
  );
}
