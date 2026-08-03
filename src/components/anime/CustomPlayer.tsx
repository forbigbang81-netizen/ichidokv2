"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Rewind,
  FastForward,
  Loader2,
  AlertCircle,
  Link2,
  X,
  Gauge,
  Tv,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CastDialog } from "./CastDialog";

type Props = {
  storageKey: string;
  poster?: string;
  title: string;
  subtitle?: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  embedUrl?: string | null;
  directSourceUrl?: string | null;
};

const STORAGE_PREFIX = "ichidok:source:";
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

export function CustomPlayer({
  storageKey,
  poster,
  title,
  subtitle,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  embedUrl,
  directSourceUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Source URL
  const [sourceUrl, setSourceUrl] = useState<string>(
    directSourceUrl || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_PREFIX + storageKey) || "" : ""),
  );
  const [sourceInput, setSourceInput] = useState<string>(sourceUrl);
  const [showSourceInput, setShowSourceInput] = useState<boolean>(
    !sourceUrl && !embedUrl && !directSourceUrl,
  );

  // Player state
  const [state, setState] = useState<PlayerState>(sourceUrl ? "loading" : "idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showCastDialog, setShowCastDialog] = useState(false);

  const [mode, setMode] = useState<"embed" | "manual">(
    sourceUrl ? "manual" : embedUrl ? "embed" : "manual",
  );

  // Reset on storageKey change
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (prevStorageKey !== storageKey) {
    setPrevStorageKey(storageKey);
    const newSource = directSourceUrl || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_PREFIX + storageKey) || "" : "");
    setSourceUrl(newSource);
    setSourceInput(newSource);
    setShowSourceInput(!newSource && !embedUrl && !directSourceUrl);
    setState(newSource ? "loading" : "idle");
    setErrorMessage("");
    setMode(newSource ? "manual" : embedUrl ? "embed" : "manual");
  }

  const [prevSourceUrl, setPrevSourceUrl] = useState(sourceUrl);
  if (prevSourceUrl !== sourceUrl) {
    setPrevSourceUrl(sourceUrl);
    if (sourceUrl) {
      setState("loading");
      setErrorMessage("");
    }
  }

  // Video + HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const isHls = /\.m3u8(\?|$)/i.test(sourceUrl);
    const onReady = () => setState("paused");
    video.addEventListener("canplay", onReady, { once: true });

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => setState("paused"));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            setState("error");
            setErrorMessage(data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR
              ? "Could not load the stream." : `Stream error: ${data.details || "unknown"}`);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else {
        queueMicrotask(() => { setState("error"); setErrorMessage("HLS not supported."); });
      }
    } else {
      video.src = sourceUrl;
    }

    return () => {
      video.removeEventListener("canplay", onReady);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [sourceUrl]);

  // Sync volume / muted / speed
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume; v.muted = muted; v.playbackRate = speed;
  }, [volume, muted, speed]);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration || 0);
    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onPlay = () => setState("playing");
    const onPause = () => setState((s) => (s === "error" ? s : "paused"));
    const onWaiting = () => setState((s) => (s === "error" ? s : "loading"));
    const onPlaying = () => setState("playing");
    const onError = () => {
      setState("error");
      setErrorMessage("Could not play this video. The URL may be invalid or blocked by CORS.");
    };
    const onEnded = () => { if (onNext && hasNext) onNext(); };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onError);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onError);
      v.removeEventListener("ended", onEnded);
    };
  }, [onNext, hasNext]);

  // Fullscreen
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (state === "playing") {
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  }, [state]);

  useEffect(() => {
    // Only manage the timer, not the visible state — showControls is
    // derived from mouse activity + player state
    if (state === "playing") {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    } else {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    }
  }, [state]);

  // Actions
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !sourceUrl) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  }, [sourceUrl]);

  const toggleFullscreen = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else c.requestFullscreen().catch(() => {});
  }, []);

  const seek = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, time));
  }, []);

  const skip = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    seek(v.currentTime + delta);
  }, [seek]);

  // Keyboard shortcuts
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10); break;
        case "ArrowRight": e.preventDefault(); v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); break;
        case "ArrowUp": e.preventDefault(); setVolume((vol) => Math.min(1, vol + 0.1)); break;
        case "ArrowDown": e.preventDefault(); setVolume((vol) => Math.max(0, vol - 0.1)); break;
        case "f": toggleFullscreen(); break;
        case "m": setMuted((m) => !m); break;
      }
    };
    c.addEventListener("keydown", onKey);
    return () => c.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleFullscreen]);

  const saveSource = () => {
    const url = sourceInput.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      setErrorMessage(url ? "URL must start with http:// or https://" : "Please paste a video URL.");
      return;
    }
    localStorage.setItem(STORAGE_PREFIX + storageKey, url);
    setSourceUrl(url); setErrorMessage(""); setShowSourceInput(false); setMode("manual");
  };

  const clearSource = () => {
    localStorage.removeItem(STORAGE_PREFIX + storageKey);
    setSourceUrl(""); setSourceInput(""); setShowSourceInput(!embedUrl);
    const v = videoRef.current; if (v) { v.removeAttribute("src"); v.load(); }
    if (embedUrl) { setMode("embed"); setState("idle"); } else { setMode("manual"); setState("idle"); }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="group relative h-full w-full overflow-hidden bg-black outline-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => state === "playing" && setShowControls(false)}
    >
      {/* EMBED MODE: iframe */}
      {mode === "embed" && embedUrl && !showSourceInput && (
        <>
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
          />
          <div className="pointer-events-none absolute left-3 top-3 z-20 border border-white/20 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-white/70">ichidok</div>
        </>
      )}

      {/* Video element */}
      {mode !== "embed" && (
        <video
          ref={videoRef}
          poster={poster}
          className="absolute inset-0 h-full w-full object-contain"
          playsInline
          onDoubleClick={toggleFullscreen}
        />
      )}

      {/* Source input */}
      {mode === "manual" && (!sourceUrl || showSourceInput) && state !== "playing" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/95 p-6">
          <div className="w-full max-w-lg">
            <div className="mb-4 flex items-center gap-2 text-foreground">
              <Link2 className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">{sourceUrl ? "Change source" : "Add a source URL"}</h3>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Paste a direct video URL. Supports <span className="font-mono text-foreground">.mp4</span>, <span className="font-mono text-foreground">.webm</span>, <span className="font-mono text-foreground">.m3u8</span> (HLS), and <span className="font-mono text-foreground">.mov</span>.
            </p>
            <textarea
              value={sourceInput} onChange={(e) => setSourceInput(e.target.value)}
              placeholder="https://example.com/anime/episode-1.mp4" rows={3}
              className="w-full resize-none border border-border bg-card p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus
            />
            {errorMessage && (
              <div className="mt-3 flex items-start gap-2 border border-foreground/30 bg-foreground/5 p-2 text-xs text-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{errorMessage}</span>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={saveSource} className="flex-1 bg-foreground py-2.5 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90">Load video</button>
              {sourceUrl && <button onClick={() => setShowSourceInput(false)} className="border border-border bg-card px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background">Cancel</button>}
            </div>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {mode === "manual" && state === "loading" && sourceUrl && !showSourceInput && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-foreground" />
        </div>
      )}

      {/* Error */}
      {mode === "manual" && state === "error" && !showSourceInput && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-foreground" />
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider">Playback failed</h3>
            <p className="mb-4 text-xs text-muted-foreground">{errorMessage || "An unknown error occurred."}</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setShowSourceInput(true)} className="bg-foreground px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90">Try a different source</button>
              <button onClick={() => { if (videoRef.current) { setState("loading"); videoRef.current.load(); } }} className="border border-border bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background">Retry</button>
            </div>
          </div>
        </div>
      )}

      {/* === Crunchyroll-style controls === */}
      {mode === "manual" && sourceUrl && !showSourceInput && (
        <>
          {/* Top gradient bar with title + cast */}
          <div className={cn(
            "absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 pb-12 pt-4 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none",
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{subtitle}</p>
                <h3 className="mt-0.5 line-clamp-1 text-sm font-bold tracking-tight text-white md:text-base">{title}</h3>
              </div>
              {/* Cast to TV button */}
              <button
                onClick={() => setShowCastDialog(true)}
                className="shrink-0 rounded-md border border-white/20 bg-black/60 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                title="Cast to TV"
                aria-label="Cast to TV"
              >
                <Tv className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Center play/pause button (Crunchyroll style) */}
          {state === "paused" && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 z-10 flex items-center justify-center"
              aria-label="Play"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110">
                <Play className="h-9 w-9 fill-white text-white" />
              </span>
            </button>
          )}
          {state === "playing" && showControls && (
            <button
              onClick={togglePlay}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              aria-label="Pause"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100">
                <Pause className="h-7 w-7 fill-white text-white" />
              </span>
            </button>
          )}

          {/* Bottom controls bar */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-3 pt-16 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none",
          )}>
            {/* Seek bar — Crunchyroll style (thick, orange/white) */}
            <div className="group/seek mb-3 flex items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-white">{formatTime(currentTime)}</span>
              <div
                className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seek(((e.clientX - rect.left) / rect.width) * duration);
                }}
              >
                {/* Buffered */}
                <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
                {/* Progress — white bar */}
                <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progressPct}%` }} />
                {/* Scrubber dot */}
                <div className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-opacity opacity-0 group-hover/seek:opacity-100" style={{ left: `${progressPct}%` }} />
              </div>
              <span className="font-mono text-xs tabular-nums text-white">{formatTime(duration)}</span>
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-2">
              {/* Previous episode */}
              <button onClick={onPrev} disabled={!hasPrev}
                className="rounded p-1.5 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                title="Previous episode" aria-label="Previous episode">
                <SkipBack className="h-5 w-5" />
              </button>

              {/* Skip back 10s */}
              <button onClick={() => skip(-10)}
                className="rounded p-1.5 text-white/70 transition-colors hover:text-white"
                title="Back 10s" aria-label="Back 10 seconds">
                <Rewind className="h-5 w-5" />
              </button>

              {/* Play/Pause */}
              <button onClick={togglePlay}
                className="rounded p-2 text-white transition-colors hover:text-white/80"
                title="Play/Pause (Space)" aria-label={state === "playing" ? "Pause" : "Play"}>
                {state === "playing" ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>

              {/* Skip forward 10s */}
              <button onClick={() => skip(10)}
                className="rounded p-1.5 text-white/70 transition-colors hover:text-white"
                title="Forward 10s" aria-label="Forward 10 seconds">
                <FastForward className="h-5 w-5" />
              </button>

              {/* Next episode */}
              <button onClick={onNext} disabled={!hasNext}
                className="rounded p-1.5 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                title="Next episode" aria-label="Next episode">
                <SkipForward className="h-5 w-5" />
              </button>

              {/* Volume */}
              <div className="group/vol ml-2 flex items-center">
                <button onClick={() => setMuted((m) => !m)}
                  className="rounded p-1.5 text-white/70 transition-colors hover:text-white"
                  title="Mute (M)" aria-label={muted ? "Unmute" : "Mute"}>
                  {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); setMuted(v === 0); }}
                  className="ml-1 h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all group-hover/vol:w-20 group-hover/vol:opacity-100"
                  aria-label="Volume"
                />
              </div>

              <div className="flex-1" />

              {/* Speed */}
              <div className="relative">
                <button onClick={() => setShowSpeedMenu((v) => !v)}
                  className="flex items-center gap-1 rounded p-1.5 text-white/70 transition-colors hover:text-white"
                  title="Playback speed" aria-label="Playback speed">
                  <Gauge className="h-5 w-5" />
                  <span className="font-mono text-xs tabular-nums">{speed}x</span>
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
                    {SPEEDS.map((s) => (
                      <button key={s} onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                        className={cn("block w-full px-4 py-2 text-left font-mono text-xs tabular-nums transition-colors hover:bg-foreground hover:text-background",
                          s === speed && "bg-foreground text-background")}>{s}x</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen}
                className="rounded p-1.5 text-white/70 transition-colors hover:text-white"
                title="Fullscreen (F)" aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cast dialog */}
      <CastDialog
        open={showCastDialog}
        onClose={() => setShowCastDialog(false)}
        videoUrl={sourceUrl}
        title={title}
      />
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
