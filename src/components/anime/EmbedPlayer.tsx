"use client";

import { useEffect, useRef } from "react";
import { CastButton } from "@/components/anime/CastButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  /** Embed URL (zokoanime/megaplay player page) */
  src: string;
  /** Poster image for background */
  poster?: string;
  /** Title for cast metadata */
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
 * 1. Cast button (top-right) using the shared CAF SDK context
 *    (session persists across page navigation and sub/dub switching)
 * 2. postMessage listener to track playback position
 * 3. Position save/restore when switching sub/dub
 *
 * The CastButton here shares the same singleton cast context as the
 * CastButton on the details page — so a session started on the details
 * page stays connected when the user enters the player, and clicking
 * the cast button in the player loads the current episode's URL.
 *
 * When switching sub/dub, the iframe src changes but the cast session
 * is NOT disrupted (the CAF session is independent of the iframe).
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

  // Listen for postMessage from the iframe (zokoanime player emits events)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (
        e.origin !== "https://zokoanime.video" &&
        e.origin !== "https://megaplay.buzz"
      ) {
        return;
      }
      const data = e.data;
      if (!data || data.channel !== "zokoanime") return;

      if (data.type === "time") {
        const position = data.position || 0;
        const duration = data.duration || 0;
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
      const min = Math.floor(initialPosition / 60);
      const sec = Math.floor(initialPosition % 60);
      const timeStr = `${min}:${sec.toString().padStart(2, "0")}`;
      toast.info(`Resuming from ${timeStr}`, {
        duration: 4000,
      });
    }
  }, [initialPosition, reloadKey]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-black">
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

      {/* Cast button — top right overlay (shared CAF session) */}
      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <CastButton
          videoUrl={src}
          title={`${title} - Episode ${episode}`}
          poster={poster}
          size={5}
          className={cn(
            "pointer-events-auto size-10",
            "border-white/20 bg-black/60 text-white hover:bg-black/80",
          )}
        />
      </div>
    </div>
  );
}
