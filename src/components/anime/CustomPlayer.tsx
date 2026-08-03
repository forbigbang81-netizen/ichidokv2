"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Cast,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { streamProxyUrl, formatTime } from "@/lib/anime";
import { CastDialog } from "@/components/anime/CastDialog";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  /** Raw episode URL (Archive.org). We wrap it through /api/stream. */
  src: string;
  poster?: string;
  onEnded?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

const HIDE_DELAY = 3000; // ms before auto-hiding controls while playing
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function CustomPlayer({
  title,
  subtitle,
  src,
  poster,
  onEnded,
  onNext,
  onPrev,
  hasPrev = false,
  hasNext = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [castOpen, setCastOpen] = useState(false);
  const [hoverFrac, setHoverFrac] = useState<number | null>(null);

  const proxiedSrc = streamProxyUrl(src);
  const absoluteVideoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${proxiedSrc}`
      : proxiedSrc;

  // ---- Controls visibility (auto-hide while playing) ----
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      // Only hide when actually playing AND not dragging the seek bar.
      if (videoRef.current && !videoRef.current.paused && !dragging.current) {
        setShowControls(false);
        setShowSettings(false);
      }
    }, HIDE_DELAY);
  }, []);

  const hideControlsNow = useCallback(() => {
    if (videoRef.current && !videoRef.current.paused && !dragging.current) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowControls(false);
      setShowSettings(false);
    }
  }, []);

  // ---- Playback control ----
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {
        /* autoplay block / network error — surfaced via onerror */
      });
    } else {
      v.pause();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    const clamped = Math.max(0, Math.min(seconds, v.duration || 0));
    v.currentTime = clamped;
    setCurrent(clamped);
  }, []);

  const seekByFraction = useCallback((frac: number) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    seekTo(frac * v.duration);
  }, [seekTo]);

  const skip = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    seekTo(v.currentTime + delta);
  }, [seekTo]);

  const setVol = useCallback((v: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    const clamped = Math.max(0, Math.min(1, v));
    vid.volume = clamped;
    setVolume(clamped);
    if (clamped > 0 && vid.muted) {
      vid.muted = false;
      setMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const setPlaybackRate = useCallback((r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
    setShowSettings(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore — some browsers reject in iframes */
    }
  }, []);

  // ---- Kick off autoplay on mount ----
  // The WatchPage remounts this component (via `key`) whenever the episode
  // changes, so internal state already resets — no per-src effect needed.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  // ---- Fullscreen state sync ----
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
      // Only respond when the player area is in view.
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          revealControls();
          break;
        case "ArrowLeft":
        case "j":
          e.preventDefault();
          skip(-10);
          revealControls();
          break;
        case "ArrowRight":
        case "l":
          e.preventDefault();
          skip(10);
          revealControls();
          break;
        case "ArrowUp":
          e.preventDefault();
          setVol(volume + 0.1);
          revealControls();
          break;
        case "ArrowDown":
          e.preventDefault();
          setVol(volume - 0.1);
          revealControls();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          revealControls();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          e.preventDefault();
          seekByFraction(parseInt(e.key, 10) / 10);
          revealControls();
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, skip, setVol, toggleFullscreen, toggleMute, seekByFraction, revealControls, volume]);

  // ---- Video element event wiring ----
  const onLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setReady(true);
    setLoading(false);
    setVolume(v.volume);
    setMuted(v.muted);
    setRate(v.playbackRate);
  };
  const onTime = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!dragging.current) setCurrent(v.currentTime);
    // Update buffered end
    if (v.buffered.length) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
  };
  const onPlayEvt = () => {
    setPlaying(true);
    revealControls();
  };
  const onPauseEvt = () => {
    setPlaying(false);
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };
  const onWaiting = () => setLoading(true);
  const onPlaying = () => setLoading(false);
  const onCanPlay = () => setLoading(false);
  const onError = () => {
    setError(
      "Could not load this episode. The source may be temporarily unavailable — try again in a moment.",
    );
    setLoading(false);
  };

  const frac = duration > 0 ? current / duration : 0;
  const bufferedFrac = duration > 0 ? buffered / duration : 0;

  // ---- Seek bar interaction (pointer events) ----
  const seekBarRef = useRef<HTMLDivElement>(null);
  const fractionFromEvent = (clientX: number) => {
    const el = seekBarRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const f = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, f));
  };
  const onSeekPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    const f = fractionFromEvent(e.clientX);
    seekByFraction(f);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    revealControls();
  };
  const onSeekPointerMove = (e: React.PointerEvent) => {
    const f = fractionFromEvent(e.clientX);
    setHoverFrac(f);
    if (dragging.current) seekByFraction(f);
  };
  const onSeekPointerUp = (e: React.PointerEvent) => {
    if (dragging.current) {
      dragging.current = false;
      seekByFraction(fractionFromEvent(e.clientX));
    }
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };
  const onSeekPointerLeave = () => setHoverFrac(null);

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      onMouseMove={revealControls}
      onMouseLeave={hideControlsNow}
      onTouchStart={revealControls}
      className={cn(
        "group relative aspect-video w-full select-none overflow-hidden rounded-xl border border-border/60 bg-black",
        fullscreen && "rounded-none border-0",
        showControls ? "cursor-default" : "cursor-none",
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={proxiedSrc}
        poster={poster}
        className={`size-full bg-black object-contain ${fullscreen ? "ichidoki-flip" : ""}`}
        style={fullscreen ? { transform: "scaleX(-1) !important" } : undefined}
        playsInline
        preload="metadata"
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTime}
        onProgress={onTime}
        onPlay={onPlayEvt}
        onPause={onPauseEvt}
        onWaiting={onWaiting}
        onPlaying={onPlaying}
        onCanPlay={onCanPlay}
        onEnded={onEnded}
        onError={onError}
        crossOrigin="anonymous"
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <Loader2 className="size-10 animate-spin text-[var(--brand)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center"
          >
            <AlertCircle className="size-10 text-[var(--brand)]" />
            <p className="max-w-sm text-sm text-foreground/80">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const v = videoRef.current;
                if (!v) return;
                v.load();
                void v.play().catch(() => {});
              }}
              className="mt-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-foreground)] hover:bg-[var(--brand)]/90"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play button (when paused & ready) */}
      <AnimatePresence>
        {ready && !playing && !loading && !error && (
          <motion.button
            key="center-play"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center"
            aria-label="Play"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-[var(--brand)]/95 text-[var(--brand-foreground)] shadow-2xl shadow-black/60 backdrop-blur-sm transition-transform hover:scale-105 sm:size-20">
              <Play className="size-7 fill-current sm:size-9" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top gradient + title */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 pb-12"
          >
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-white sm:text-base">
                {title}
              </h2>
              {subtitle && (
                <p className="truncate text-xs text-white/70">{subtitle}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom control bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-10 sm:px-4 sm:pb-3"
          >
            {/* Seek bar */}
            <div
              ref={seekBarRef}
              onPointerDown={onSeekPointerDown}
              onPointerMove={onSeekPointerMove}
              onPointerUp={onSeekPointerUp}
              onPointerLeave={onSeekPointerLeave}
              className="group/seek relative flex h-4 cursor-pointer items-center"
            >
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
                {/* Buffered */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                  style={{ width: `${bufferedFrac * 100}%` }}
                />
                {/* Played */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[var(--brand)]"
                  style={{ width: `${frac * 100}%` }}
                />
                {/* Hover preview */}
                {hoverFrac !== null && (
                  <div
                    className="absolute inset-y-0 w-0.5 bg-white/60"
                    style={{ left: `${hoverFrac * 100}%` }}
                  />
                )}
              </div>
              {/* Thumb */}
              <div
                className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand)] opacity-0 shadow transition-opacity group-hover/seek:opacity-100"
                style={{ left: `${frac * 100}%` }}
              />
            </div>

            {/* Buttons row */}
            <div className="mt-1 flex items-center gap-1 text-white sm:gap-2">
              <PlayerButton onClick={onPrev} disabled={!hasPrev} label="Previous episode">
                <SkipBack className="size-5 fill-current" />
              </PlayerButton>
              <PlayerButton onClick={togglePlay} label={playing ? "Pause" : "Play"}>
                {playing ? (
                  <Pause className="size-6 fill-current" />
                ) : (
                  <Play className="size-6 fill-current" />
                )}
              </PlayerButton>
              <PlayerButton onClick={onNext} disabled={!hasNext} label="Next episode">
                <SkipForward className="size-5 fill-current" />
              </PlayerButton>

              {/* Skip back 10s */}
              <PlayerButton onClick={() => skip(-10)} label="Back 10 seconds" className="hidden sm:inline-flex">
                <RotateCcw className="size-5" />
              </PlayerButton>
              <PlayerButton onClick={() => skip(10)} label="Forward 10 seconds" className="hidden sm:inline-flex">
                <RotateCw className="size-5" />
              </PlayerButton>

              {/* Volume */}
              <div className="group/vol flex items-center">
                <PlayerButton onClick={toggleMute} label="Mute">
                  <VolumeIcon className="size-5" />
                </PlayerButton>
                <div className="hidden w-0 overflow-hidden transition-all duration-200 group-hover/vol:w-20 sm:block">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => setVol(parseFloat(e.target.value))}
                    className="ichidoki-range w-full"
                    aria-label="Volume"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="ml-1 select-none font-mono text-xs text-white/90 tabular-nums">
                {formatTime(current)} <span className="text-white/40">/</span>{" "}
                {formatTime(duration)}
              </div>

              <div className="flex-1" />

              {/* Cast */}
              <PlayerButton onClick={() => setCastOpen(true)} label="Cast to TV">
                <Cast className="size-5" />
              </PlayerButton>

              {/* Settings (speed) */}
              <div className="relative">
                <PlayerButton
                  onClick={() => setShowSettings((v) => !v)}
                  label="Playback speed"
                >
                  <Gauge className="size-5" />
                </PlayerButton>
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-10 right-0 w-40 overflow-hidden rounded-lg border border-border/60 bg-card/95 p-1 shadow-2xl backdrop-blur-xl"
                    >
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Speed
                      </p>
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setPlaybackRate(s)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                            rate === s
                              ? "bg-brand-muted text-[var(--brand)]"
                              : "text-foreground hover:bg-accent",
                          )}
                        >
                          {s === 1 ? "Normal" : `${s}×`}
                          {rate === s && <span className="text-xs">✓</span>}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-border/60" />
                      <button
                        onClick={toggleFullscreen}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                      >
                        {fullscreen ? (
                          <Minimize className="size-4" />
                        ) : (
                          <Maximize className="size-4" />
                        )}
                        {fullscreen ? "Exit full" : "Fullscreen"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fullscreen */}
              <PlayerButton onClick={toggleFullscreen} label="Fullscreen">
                {fullscreen ? (
                  <Minimize className="size-5" />
                ) : (
                  <Maximize className="size-5" />
                )}
              </PlayerButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CastDialog
        open={castOpen}
        onOpenChange={setCastOpen}
        videoUrl={absoluteVideoUrl}
        title={subtitle ? `${title} — ${subtitle}` : title}
      />
    </div>
  );
}

/** Small reusable icon button in the control bar. */
function PlayerButton({
  onClick,
  children,
  label,
  disabled,
  className,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}
