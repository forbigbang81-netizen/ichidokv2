"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cast, X, Loader2, Tv, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  /** Embed URL (zokoanime/megaplay player page) */
  src: string;
  /** Poster image for background */
  poster?: string;
  /** Title for cast dialog */
  title: string;
  /** Episode number for cast dialog */
  episode: number;
  /** Called when the iframe player reports playback position */
  onTimeUpdate?: (position: number, duration: number) => void;
  /** Called when the iframe player reports playback complete */
  onComplete?: () => void;
  /** Initial position to resume from (seconds) */
  initialPosition?: number;
  /** Key to force iframe reload (changes when src changes) */
  reloadKey: string;
};

/**
 * EmbedPlayer — wraps a zokoanime/megaplay iframe player with:
 * 1. Google Cast SDK button (top-right overlay)
 * 2. postMessage listener to track playback position
 * 3. Position save/restore when switching sub/dub
 */
export function EmbedPlayer({
  src,
  poster,
  title,
  episode,
  onTimeUpdate,
  onComplete,
  initialPosition = 0,
  reloadKey,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [castReady, setCastReady] = useState(false);
  const [castOpen, setCastOpen] = useState(false);
  const [castState, setCastState] = useState<"idle" | "connecting" | "connected">("idle");
  const [showResumeToast, setShowResumeToast] = useState(false);
  const savedPositionRef = useRef<number>(initialPosition);

  // Load Google Cast Framework SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.cast?.framework) {
      setCastReady(true);
      return;
    }
    // Load the Cast Framework SDK
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/cv/js/sender/1.0/cast_sender.js?loadCastFramework=1";
    script.async = true;
    (window as unknown as { __onGCastApiAvailable?: (available: boolean) => void }).__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable) {
        setCastReady(true);
        // Initialize cast context
        const castCtx = (window as unknown as { cast?: { framework?: { CastContext?: { getInstance?: () => { setOptions: (opts: Record<string, unknown>) => void } } } } }).cast?.framework?.CastContext?.getInstance?.();
        if (castCtx) {
          castCtx.setOptions({
            receiverApplicationId: "CC1AD845",
            autoJoinPolicy: "origin_scoped",
          });
        }
      }
    };
    document.head.appendChild(script);
    return () => {
      // Don't remove the script — it may be used by other instances
    };
  }, []);

  // Listen for postMessage from the iframe (zokoanime player emits events)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Only accept messages from zokoanime/megaplay
      if (e.origin !== "https://zokoanime.video" && e.origin !== "https://megaplay.buzz") {
        return;
      }
      const data = e.data;
      if (!data || data.channel !== "zokoanime") return;

      if (data.type === "time") {
        const position = data.position || 0;
        const duration = data.duration || 0;
        savedPositionRef.current = position;
        onTimeUpdate?.(position, duration);
      } else if (data.type === "complete") {
        onComplete?.();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onTimeUpdate, onComplete]);

  // Show resume toast when initialPosition > 0
  useEffect(() => {
    if (initialPosition > 5) {
      setShowResumeToast(true);
      const t = setTimeout(() => setShowResumeToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [initialPosition, reloadKey]);

  // Cast the video to Chromecast
  const startCast = useCallback(async () => {
    if (typeof window === "undefined") return;
    const cast = (window as any).cast;
    const framework = cast?.framework;
    if (!framework) {
      toast.error("Cast not available", {
        description: "Google Cast SDK failed to load. Try Chrome or Edge.",
      });
      return;
    }

    setCastState("connecting");
    try {
      const context = framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: "CC1AD845",
        autoJoinPolicy: "origin_scoped",
      });

      // Request a session
      await context.requestSession();

      const session = context.getCurrentSession();
      if (!session) {
        setCastState("idle");
        return;
      }

      // Build the media info — cast the iframe URL as a web page
      // Chromecast's Default Media Receiver can play video URLs
      // For embed pages, we use the Web Receiver App which loads the page
      const mediaInfo = new cast.framework.messages.MediaInformation(
        cast.framework.messages.MediaType.MOVIE,
      );
      mediaInfo.contentId = src;
      mediaInfo.contentUrl = src;
      mediaInfo.metadata = new cast.framework.messages.GenericMediaMetadata();
      mediaInfo.metadata.title = `${title} - Episode ${episode}`;
      mediaInfo.metadata.images = poster ? [{ url: poster }] : [];

      const request = new cast.framework.LoadRequest(mediaInfo);
      await session.loadMedia(request);
      setCastState("connected");
      toast.success("Casting started", {
        description: `${title} - Episode ${episode}`,
      });
    } catch (e: any) {
      setCastState("idle");
      if (e?.code !== "cancel") {
        toast.error("Cast failed", {
          description: e?.message || "Could not start casting.",
        });
      }
    }
  }, [src, title, episode, poster]);

  // Stop casting
  const stopCast = useCallback(async () => {
    if (typeof window === "undefined") return;
    const framework = (window as any).cast?.framework;
    if (!framework) return;
    try {
      const session = framework.CastContext.getInstance().getCurrentSession();
      if (session) {
        await session.endSession(true);
      }
      setCastState("idle");
    } catch {
      setCastState("idle");
    }
  }, []);

  // Format time as M:SS or H:MM:SS
  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const sec = Math.floor(s % 60);
    const min = Math.floor((s / 60) % 60);
    const hr = Math.floor(s / 3600);
    const ss = sec.toString().padStart(2, "0");
    if (hr > 0) return `${hr}:${min.toString().padStart(2, "0")}:${ss}`;
    return `${min}:${ss}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-black"
    >
      {/* Iframe player */}
      <iframe
        ref={iframeRef}
        key={reloadKey}
        src={src}
        className="size-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        frameBorder={0}
        scrolling="no"
      />

      {/* Cast button — top right overlay */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2">
        {/* Resume toast */}
        <AnimatePresence>
          {showResumeToast && initialPosition > 5 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-auto rounded-lg border border-border/60 bg-black/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
            >
              Resuming from {formatTime(initialPosition)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cast button */}
        <button
          onClick={() => {
            if (castState === "connected") {
              stopCast();
            } else {
              setCastOpen(true);
            }
          }}
          className={cn(
            "pointer-events-auto flex size-10 items-center justify-center rounded-full border backdrop-blur-sm transition-colors",
            castState === "connected"
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
              : "border-white/20 bg-black/60 text-white hover:bg-black/80",
          )}
          title={castState === "connected" ? "Stop casting" : "Cast to TV"}
          aria-label={castState === "connected" ? "Stop casting" : "Cast to TV"}
        >
          {castState === "connecting" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Cast className="size-5" />
          )}
        </button>
      </div>

      {/* Cast dialog */}
      <AnimatePresence>
        {castOpen && (
          <CastPicker
            src={src}
            title={title}
            episode={episode}
            poster={poster}
            castState={castState}
            onCast={async () => {
              setCastOpen(false);
              await startCast();
            }}
            onClose={() => setCastOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Cast picker dialog — shows cast options */
function CastPicker({
  src,
  title,
  episode,
  poster,
  castState,
  onCast,
  onClose,
}: {
  src: string;
  title: string;
  episode: number;
  poster?: string;
  castState: "idle" | "connecting" | "connected";
  onCast: () => void;
  onClose: () => void;
}) {
  const [supportsPresentation, setSupportsPresentation] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupportsPresentation(
      typeof (window as any).PresentationRequest !== "undefined",
    );
  }, []);

  // Fallback: Presentation API (Chrome built-in cast)
  const startPresentation = async () => {
    try {
      const PresentationRequestCtor = (window as any).PresentationRequest;
      const request = new PresentationRequestCtor(src);
      await request.start();
      toast.success("Casting started", { description: `${title} - Episode ${episode}` });
      onClose();
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast.error("Cast failed", { description: e?.message });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="size-5 text-[var(--brand)]" />
            <h3 className="text-lg font-bold">Cast to TV</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Cast {title} - Episode {episode} to your TV using Google Cast.
        </p>

        <div className="space-y-2">
          {/* Google Cast SDK button */}
          <button
            onClick={onCast}
            disabled={castState === "connecting"}
            className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3 text-left transition-colors hover:border-[var(--brand)]/50 hover:bg-accent"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--brand)]/15">
              {castState === "connecting" ? (
                <Loader2 className="size-5 animate-spin text-[var(--brand)]" />
              ) : (
                <Cast className="size-5 text-[var(--brand)]" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {castState === "connecting" ? "Connecting..." : "Chromecast / Google TV"}
              </p>
              <p className="text-xs text-muted-foreground">
                Cast to any Chromecast device on your network
              </p>
            </div>
          </button>

          {/* Presentation API fallback */}
          {supportsPresentation && (
            <button
              onClick={startPresentation}
              className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3 text-left transition-colors hover:border-[var(--brand)]/50 hover:bg-accent"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--brand)]/15">
                <Tv className="size-5 text-[var(--brand)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Browser Cast</p>
                <p className="text-xs text-muted-foreground">
                  Use Chrome&apos;s built-in cast (Presentation API)
                </p>
              </div>
            </button>
          )}

          {/* QR code fallback for mobile */}
          <div className="rounded-lg border border-border/60 bg-card/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Smartphone className="size-4 text-[var(--brand)]" />
              <p className="text-sm font-semibold">Watch on phone</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Open this page on your phone and use AirPlay or cast from there.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
