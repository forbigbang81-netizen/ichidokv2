"use client";
/**
 * CustomPlayer — wraps the gdriveplayer iframe embed with our own chrome
 * (cast button, sub/dub toggle, episode navigation).
 *
 * The actual video playback happens inside the gdriveplayer iframe (their
 * JW Player + Google Drive video sources). Our player provides the UI
 * around it: sub/dub toggle, cast button, prev/next episode.
 *
 * If the user clicks "Use my own URL", we switch to a manual HTML5 video
 * player where they can paste any direct video URL (mp4, m3u8, etc.).
 */
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
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CastButton } from "./CastButton";

type Props = {
  storageKey: string;
  poster?: string;
  title: string;
  subtitle?: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  /** gdriveplayer embed URL (for the iframe). */
  embedUrl?: string | null;
  /** URL for the Cast button. */
  castUrl?: string;
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
  castUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Source URL state (for manual mode)
  const [sourceUrl, setSourceUrl] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_PREFIX + storageKey) || "";
  });
  const [sourceInput, setSourceInput] = useState<string>(sourceUrl);
  const [showSourceInput, setShowSourceInput] = useState<boolean>(!sourceUrl && !embedUrl);

  // Player state
  const [state, setState] = useState<PlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Mode: "embed" (iframe) or "manual" (HTML5 video with sourceUrl)
  const [mode, setMode] = useState<"embed" | "manual">(
    sourceUrl ? "manual" : embedUrl ? "embed" : "manual",
  );

  // Reset on storageKey change (new episode)
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (prevStorageKey !== storageKey) {
    setPrevStorageKey(storageKey);
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_PREFIX + storageKey) || ""
        : "";
    setSourceUrl(saved);
    setSourceInput(saved);
    setShowSourceInput(!saved && !embedUrl);
    setState("idle");
    setErrorMessage("");
    setMode(saved ? "manual" : embedUrl ? "embed" : "manual");
  }

  // Track sourceUrl changes
  const [prevSourceUrl, setPrevSourceUrl] = useState(sourceUrl);
  if (prevSourceUrl !== sourceUrl) {
    setPrevSourceUrl(sourceUrl);
    if (sourceUrl) {
      setState("loading");
      setErrorMessage("");
    }
  }

  // --- Set up video + HLS when sourceUrl changes (manual mode) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

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
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setState("error");
            setErrorMessage(
              data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR
                ? "Could not load the stream."
                : `Stream error: ${data.details || "unknown"}`,
            );
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else {
        queueMicrotask(() => {
          setState("error");
          setErrorMessage("HLS streams are not supported in this browser.");
        });
      }
    } else {
      video.src = sourceUrl;
    }

    return () => {
      video.removeEventListener("canplay", onReady);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [sourceUrl]);

  // Sync volume / muted / speed
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    v.playbackRate = speed;
  }, [volume, muted, speed]);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedMeta = () => setDuration(v.duration || 0);
    const onTimeUpdate = () => {
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

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onError);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onError);
      v.removeEventListener("ended", onEnded);
    };
  }, [onNext, hasNext]);

  // Fullscreen tracking
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Mouse activity for auto-hide controls
  const [mouseActive, setMouseActive] = useState(true);
  const mouseTimerRef = useRef<number | null>(null);
  const onMouseMove = useCallback(() => {
    setMouseActive(true);
    if (mouseTimerRef.current) window.clearTimeout(mouseTimerRef.current);
    mouseTimerRef.current = window.setTimeout(() => setMouseActive(false), 3000);
  }, []);
  const onMouseLeave = useCallback(() => {
    if (mouseTimerRef.current) window.clearTimeout(mouseTimerRef.current);
    setMouseActive(false);
  }, []);
  const controlsVisible = state !== "playing" || mouseActive;

  // Action handlers
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !sourceUrl) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [sourceUrl]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen().catch(() => {});
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
    const container = containerRef.current;
    if (!container) return;
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((vol) => Math.min(1, vol + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((vol) => Math.max(0, vol - 0.1));
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          setMuted((m) => !m);
          break;
      }
    };
    container.addEventListener("keydown", onKey);
    return () => container.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleFullscreen]);

  const saveSource = () => {
    const url = sourceInput.trim();
    if (!url) {
      setErrorMessage("Please paste a video URL.");
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setErrorMessage("URL must start with http:// or https://");
      return;
    }
    localStorage.setItem(STORAGE_PREFIX + storageKey, url);
    setSourceUrl(url);
    setErrorMessage("");
    setShowSourceInput(false);
    setMode("manual");
  };

  const clearSource = () => {
    localStorage.removeItem(STORAGE_PREFIX + storageKey);
    setSourceUrl("");
    setSourceInput("");
    setShowSourceInput(!embedUrl);
    const v = videoRef.current;
    if (v) { v.removeAttribute("src"); v.load(); }
    if (embedUrl) { setMode("embed"); setState("idle"); }
    else { setMode("manual"); setState("idle"); }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const isHlsSource = /\.m3u8(\?|$)/i.test(sourceUrl);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="group relative h-full w-full overflow-hidden bg-black outline-none"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* === EMBED MODE: gdriveplayer iframe === */}
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
          {/* Badge */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 border border-white/20 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-white/70">
            ichidok
          </div>
          {/* Cast button (top-right) */}
          {castUrl && (
            <div className="absolute right-3 top-3 z-30">
              <CastButton url={castUrl} title={title} compact />
            </div>
          )}
        </>
      )}

      {/* Video element for MANUAL mode */}
      {mode !== "embed" && (
        <video
          ref={videoRef}
          poster={poster}
          className="absolute inset-0 h-full w-full object-contain"
          playsInline
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
        />
      )}

      {/* === Source input overlay (manual mode only) === */}
      {mode === "manual" && (!sourceUrl || showSourceInput) && state !== "playing" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/95 p-6">
          <div className="w-full max-w-lg">
            <div className="mb-4 flex items-center gap-2 text-foreground">
              <Link2 className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {sourceUrl ? "Change source" : "Add a source URL"}
              </h3>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Paste a direct video URL below. The player supports{" "}
              <span className="font-mono text-foreground">.mp4</span>,{" "}
              <span className="font-mono text-foreground">.webm</span>,{" "}
              <span className="font-mono text-foreground">.m3u8</span>{" "}
              (HLS streams), and{" "}
              <span className="font-mono text-foreground">.mov</span> files.
              The URL is saved for this episode.
            </p>
            <textarea
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder="https://example.com/anime/episode-1.mp4"
              rows={3}
              className="w-full resize-none border border-border bg-card p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {errorMessage && (
              <div className="mt-3 flex items-start gap-2 border border-foreground/30 bg-foreground/5 p-2 text-xs text-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={saveSource}
                className="flex-1 bg-foreground py-2.5 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90"
              >
                Load video
              </button>
              {sourceUrl && (
                <button
                  onClick={() => setShowSourceInput(false)}
                  className="border border-border bg-card px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
                >
                  Cancel
                </button>
              )}
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
              Tip: many sites host anime as HLS streams (URLs ending in{" "}
              <span className="font-mono">.m3u8</span>) — those work too.
            </p>
          </div>
        </div>
      )}

      {/* === Loading spinner (manual mode) === */}
      {mode === "manual" && state === "loading" && sourceUrl && !showSourceInput && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-foreground" />
        </div>
      )}

      {/* === Error state (manual mode) === */}
      {mode === "manual" && state === "error" && !showSourceInput && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-foreground" />
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider">Playback failed</h3>
            <p className="mb-4 text-xs text-muted-foreground">{errorMessage || "An unknown error occurred."}</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowSourceInput(true)}
                className="bg-foreground px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90"
              >
                Try a different source
              </button>
              <button
                onClick={() => { if (videoRef.current) { setState("loading"); videoRef.current.load(); } }}
                className="border border-border bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Idle hint (manual mode) === */}
      {mode === "manual" && state === "paused" && !showSourceInput && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
          aria-label="Play"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform hover:scale-110">
            <Play className="h-7 w-7 fill-current" />
          </span>
        </button>
      )}

      {/* === Top chrome (manual mode) === */}
      {mode === "manual" && sourceUrl && controlsVisible && !showSourceInput && (
        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{subtitle}</p>
          <h3 className="mt-0.5 line-clamp-1 text-sm font-bold tracking-tight text-white">{title}</h3>
        </div>
      )}

      {/* === Bottom controls (manual mode) === */}
      {mode === "manual" && sourceUrl && controlsVisible && !showSourceInput && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-12 transition-opacity">
          {/* Seek bar */}
          <div className="group/seek mb-2 flex items-center gap-2">
            <span className="font-mono text-[10px] tabular-nums text-white/80">{formatTime(currentTime)}</span>
            <div
              className="relative h-1 flex-1 cursor-pointer bg-white/20"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seek(pct * duration);
              }}
            >
              <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${bufferedPct}%` }} />
              <div className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${progressPct}%` }} />
              <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-foreground opacity-0 transition-opacity group-hover/seek:opacity-100" style={{ left: `${progressPct}%` }} />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-white/80">{formatTime(duration)}</span>
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-1">
            <button onClick={onPrev} disabled={!hasPrev} className="p-1.5 text-white/80 hover:text-white disabled:opacity-30" title="Previous episode" aria-label="Previous episode">
              <Rewind className="h-4 w-4" />
            </button>
            <button onClick={() => skip(-10)} className="p-1.5 text-white/80 hover:text-white" title="Back 10s (←)" aria-label="Back 10 seconds">
              <Rewind className="h-4 w-4" />
            </button>
            <button onClick={togglePlay} className="p-1.5 text-white hover:text-white" title="Play/Pause (Space)" aria-label={state === "playing" ? "Pause" : "Play"}>
              {state === "playing" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={() => skip(10)} className="p-1.5 text-white/80 hover:text-white" title="Forward 10s (→)" aria-label="Forward 10 seconds">
              <FastForward className="h-4 w-4" />
            </button>
            <button onClick={onNext} disabled={!hasNext} className="p-1.5 text-white/80 hover:text-white disabled:opacity-30" title="Next episode" aria-label="Next episode">
              <FastForward className="h-4 w-4" />
            </button>

            <div className="group/vol ml-1 flex items-center">
              <button onClick={() => setMuted((m) => !m)} className="p-1.5 text-white/80 hover:text-white" title="Mute (M)" aria-label={muted ? "Unmute" : "Mute"}>
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); setMuted(v === 0); }}
                className="ml-1 h-1 w-0 cursor-pointer appearance-none bg-white/30 opacity-0 transition-all group-hover/vol:w-16 group-hover/vol:opacity-100"
                aria-label="Volume"
              />
            </div>

            <div className="flex-1" />

            <span className="mr-2 hidden font-mono text-[9px] uppercase tracking-wider text-white/40 sm:inline">
              {isHlsSource ? "HLS" : "DIRECT"}
            </span>

            <div className="relative">
              <button onClick={() => setShowSpeedMenu((v) => !v)} className="flex items-center gap-1 p-1.5 text-white/80 hover:text-white" title="Playback speed" aria-label="Playback speed">
                <Gauge className="h-4 w-4" />
                <span className="font-mono text-[10px] tabular-nums">{speed}x</span>
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 border border-border bg-card py-1 shadow-xl">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                      className={cn("block w-full px-4 py-1 text-left font-mono text-[11px] tabular-nums hover:bg-foreground hover:text-background", s === speed && "bg-foreground text-background")}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setShowSourceInput(true)} className="p-1.5 text-white/80 hover:text-white" title="Change source URL" aria-label="Change source URL">
              <Settings2 className="h-4 w-4" />
            </button>

            {castUrl && <CastButton url={castUrl} title={title} compact />}

            <button onClick={toggleFullscreen} className="p-1.5 text-white/80 hover:text-white" title="Fullscreen (F)" aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Clear source button (manual mode) */}
      {mode === "manual" && sourceUrl && !showSourceInput && state !== "playing" && (
        <button
          onClick={clearSource}
          className="absolute right-3 top-3 z-30 inline-flex items-center gap-1 border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 hover:bg-white/20 hover:text-white"
          title="Remove this source URL"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
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
