"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cast, Loader2, X, Tv, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * CastButton — Google Cast (CAF SDK) button.
 *
 * Uses the Google Cast Application Framework (CAF) SDK via the
 * `cast_sender.js?loadCastFramework=1` loader. The cast context is
 * shared app-wide (singleton on window), so a session started on the
 * details page stays connected when the user navigates to the player.
 *
 * Props:
 *  - videoUrl: the absolute URL to cast (the embed player URL)
 *  - title:    title for the cast metadata
 *  - poster:   poster image URL for cast metadata
 *  - className: extra classes for the button
 *  - size:     icon size (default 5)
 *  - onSessionChange: callback when cast session connects/disconnects
 */
type Props = {
  videoUrl?: string;
  title?: string;
  poster?: string;
  className?: string;
  size?: number;
  onSessionChange?: (connected: boolean) => void;
};

// Singleton state shared across all CastButton instances
let castInitialized = false;
const sessionListeners = new Set<(connected: boolean) => void>();
let currentSessionState = false;

function notifySessionListeners(connected: boolean) {
  currentSessionState = connected;
  sessionListeners.forEach((fn) => fn(connected));
}

function initCast() {
  if (typeof window === "undefined") return;
  if (castInitialized) return;
  castInitialized = true;

  const w = window as unknown as {
    __onGCastApiAvailable?: (available: boolean) => void;
  };

  w.__onGCastApiAvailable = (isAvailable: boolean) => {
    if (!isAvailable) return;
    const cast = (window as unknown as {
      cast?: {
        framework?: {
          CastContext?: {
            getInstance?: () => {
              setOptions: (opts: Record<string, unknown>) => void;
              addEventListener: (
                type: string,
                fn: (e: unknown) => void,
              ) => void;
              getCastState?: () => string;
              requestSession?: () => Promise<unknown>;
              getCurrentSession?: () => unknown;
            };
          };
        };
      };
    }).cast;
    const ctx = cast?.framework?.CastContext?.getInstance?.();
    if (!ctx) return;
    ctx.setOptions({
      receiverApplicationId: "CC1AD845",
      autoJoinPolicy: "origin_scoped",
      resumeSavedSession: true,
    });
    // Listen for session state changes
    ctx.addEventListener(
      "caststatechanged",
      (e: unknown) => {
        const event = e as { castState?: string };
        const connected =
          event.castState === "CONNECTED" ||
          event.castState === "CONNECTING";
        notifySessionListeners(connected);
      },
    );
    // Check initial state
    const initialState = ctx.getCastState?.();
    if (initialState === "CONNECTED" || initialState === "CONNECTING") {
      notifySessionListeners(true);
    }
  };

  // Load the SDK script
  const existing = document.querySelector(
    'script[src*="cast_sender.js"]',
  );
  if (existing) return;
  const script = document.createElement("script");
  script.src =
    "https://www.gstatic.com/cv/js/sender/1.0/cast_sender.js?loadCastFramework=1";
  script.async = true;
  document.head.appendChild(script);
}

export function CastButton({
  videoUrl,
  title = "",
  poster,
  className,
  size = 5,
  onSessionChange,
}: Props) {
  const [castReady, setCastReady] = useState(false);
  const [connected, setConnected] = useState(currentSessionState);
  const [connecting, setConnecting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const onSessionChangeRef = useRef(onSessionChange);
  onSessionChangeRef.current = onSessionChange;

  // Init cast on mount
  useEffect(() => {
    initCast();
    // Check if SDK already loaded
    const check = setInterval(() => {
      const cast = (window as unknown as {
        cast?: { framework?: unknown };
      }).cast;
      if (cast?.framework) {
        setCastReady(true);
        clearInterval(check);
      }
    }, 300);
    // Timeout after 10s
    const timeout = setTimeout(() => clearInterval(check), 10000);
    return () => {
      clearInterval(check);
      clearTimeout(timeout);
    };
  }, []);

  // Subscribe to session state
  useEffect(() => {
    const listener = (isConnected: boolean) => {
      setConnected(isConnected);
      onSessionChangeRef.current?.(isConnected);
    };
    sessionListeners.add(listener);
    return () => {
      sessionListeners.delete(listener);
    };
  }, []);

  const startCast = useCallback(async () => {
    const cast = (window as unknown as {
      cast?: {
        framework?: {
          CastContext?: {
            getInstance?: () => {
              requestSession?: () => Promise<unknown>;
              getCurrentSession?: () => unknown;
            };
          };
        };
      };
    }).cast;
    const ctx = cast?.framework?.CastContext?.getInstance?.();
    if (!ctx) {
      toast.error("Cast not available", {
        description: "Google Cast SDK failed to load. Use Chrome or Edge.",
      });
      return;
    }
    setConnecting(true);
    try {
      await ctx.requestSession?.();
      // If we have a video URL, load it now
      const session = ctx.getCurrentSession?.();
      if (session && videoUrl) {
        await loadMedia(session, videoUrl, title, poster);
      }
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code !== "cancel") {
        toast.error("Cast failed");
      }
    } finally {
      setConnecting(false);
    }
  }, [videoUrl, title, poster]);

  const stopCast = useCallback(async () => {
    const cast = (window as unknown as {
      cast?: {
        framework?: {
          CastContext?: {
            getInstance?: () => {
              getCurrentSession?: () => {
                endSession?: (stopCasting: boolean) => Promise<void>;
              };
            };
          };
        };
      };
    }).cast;
    const ctx = cast?.framework?.CastContext?.getInstance?.();
    const session = ctx?.getCurrentSession?.();
    if (session?.endSession) {
      await session.endSession(true);
    }
  }, []);

  // If connected (no videoUrl), clicking stops cast
  // If connected (with videoUrl), clicking loads new media
  // If not connected, clicking opens picker
  const handleClick = () => {
    if (connected && !videoUrl) {
      // Stop casting
      stopCast();
      return;
    }
    if (connected && videoUrl) {
      // Load new media into existing session
      const cast = (window as unknown as {
        cast?: {
          framework?: {
            CastContext?: { getInstance?: () => unknown };
          };
        };
      }).cast;
      const ctx = cast?.framework?.CastContext?.getInstance?.() as {
        getCurrentSession?: () => unknown;
      };
      const session = ctx?.getCurrentSession?.();
      if (session) {
        loadMedia(session, videoUrl, title, poster);
        toast.success("Now playing on TV", { description: title });
      }
      return;
    }
    // Not connected — open picker
    setShowPicker(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={connecting}
        className={cn(
          "flex items-center justify-center rounded-full border backdrop-blur-sm transition-colors disabled:opacity-50",
          connected
            ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
            : "border-border/60 bg-card/40 text-foreground hover:bg-accent",
          className,
        )}
        title={
          connected
            ? videoUrl
              ? "Play on TV"
              : "Stop casting"
            : "Cast to TV"
        }
        aria-label={
          connected
            ? videoUrl
              ? "Play on TV"
              : "Stop casting"
            : "Cast to TV"
        }
      >
        {connecting ? (
          <Loader2 className={cn("animate-spin", `size-${size}`)} />
        ) : (
          <Cast className={`size-${size}`} />
        )}
      </button>

      {/* Cast picker dialog */}
      <AnimatePresence>
        {showPicker && (
          <CastPicker
            title={title}
            castReady={castReady}
            onCast={async () => {
              setShowPicker(false);
              await startCast();
            }}
            onClose={() => setShowPicker(false)}
            videoUrl={videoUrl}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** Load media into an existing cast session */
async function loadMedia(
  session: unknown,
  videoUrl: string,
  title: string,
  poster?: string,
) {
  // Use eslint-disable for the cast SDK which doesn't have proper types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cast = (window as any).cast;
  const framework = cast?.framework;
  const messages = framework?.messages;
  if (!messages) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mediaInfo: any = new messages.MediaInformation(messages.MediaType?.MOVIE);
  mediaInfo.contentId = videoUrl;
  mediaInfo.contentUrl = videoUrl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata: any = new messages.GenericMediaMetadata();
  metadata.title = title;
  if (poster) {
    metadata.images = [{ url: poster }];
  }
  mediaInfo.metadata = metadata;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request: any = new framework.LoadRequest(mediaInfo);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = session as any;
  await s?.loadMedia?.(request);
}

/** Cast picker dialog */
function CastPicker({
  title,
  castReady,
  onCast,
  onClose,
  videoUrl,
}: {
  title: string;
  castReady: boolean;
  onCast: () => void;
  onClose: () => void;
  videoUrl?: string;
}) {
  const [supportsPresentation, setSupportsPresentation] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupportsPresentation(
      typeof (window as unknown as { PresentationRequest?: unknown })
        .PresentationRequest !== "undefined",
    );
  }, []);

  const startPresentation = async () => {
    if (!videoUrl) return;
    try {
      const PresentationRequestCtor = (
        window as unknown as { PresentationRequest: new (url: string) => { start: () => Promise<unknown> } }
      ).PresentationRequest;
      const request = new PresentationRequestCtor(videoUrl);
      await request.start();
      toast.success("Casting started", { description: title });
      onClose();
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
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

        {title && (
          <p className="mb-4 text-sm text-muted-foreground">
            Cast {title} to your TV using Google Cast.
          </p>
        )}

        <div className="space-y-2">
          <button
            onClick={onCast}
            disabled={!castReady}
            className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3 text-left transition-colors hover:border-[var(--brand)]/50 hover:bg-accent disabled:opacity-50"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--brand)]/15">
              <Cast className="size-5 text-[var(--brand)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {castReady ? "Chromecast / Google TV" : "Loading..."}
              </p>
              <p className="text-xs text-muted-foreground">
                Cast to any Chromecast device on your network
              </p>
            </div>
          </button>

          {supportsPresentation && videoUrl && (
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
                  Use Chrome&apos;s built-in cast
                </p>
              </div>
            </button>
          )}

          <div className="rounded-lg border border-border/60 bg-card/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Smartphone className="size-4 text-[var(--brand)]" />
              <p className="text-sm font-semibold">Watch on phone</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Open this page on your phone and cast from there.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
