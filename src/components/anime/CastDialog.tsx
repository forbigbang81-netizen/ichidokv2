"use client";

import { useMemo, useState } from "react";
import { Cast, CheckCircle2, MonitorPlay, Smartphone, Tv } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absolute URL the receiver / phone should open to play the video. */
  videoUrl: string;
  /** Human title shown in the dialog (anime + episode). */
  title: string;
};

type CastStatus = "idle" | "connecting" | "connected" | "unsupported" | "error";

/**
 * "Cast to TV" dialog — no Google Cast SDK.
 *
 * 1. If the browser supports the Presentation API (Chrome/Edge desktop), we
 *    offer a "Start Cast" button that calls `new PresentationRequest(url).start()`.
 *    This casts the video URL to any Chromecast / smart TV that the browser
 *    knows how to reach (Chrome's built-in cast menu).
 * 2. As a reliable fallback (and on unsupported browsers), we show a QR code
 *    of the absolute video URL — the user scans it with their phone and
 *    AirPlays / casts from there.
 */
export function CastDialog({ open, onOpenChange, videoUrl, title }: Props) {
  // Detect Presentation API support once (client-only). Computed via useMemo
  // so it doesn't trigger a setState-in-effect cascade. Safe because the
  // dialog content only renders after a user click (post-hydration).
  const supportsPresentation = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      typeof (window as unknown as { PresentationRequest?: unknown })
        .PresentationRequest !== "undefined"
    );
  }, []);
  const [status, setStatus] = useState<CastStatus>("idle");

  // Reset cast status whenever the dialog closes — done in the open-change
  // handler (not an effect) to avoid cascading renders.
  const handleOpenChange = (next: boolean) => {
    if (!next) setStatus("idle");
    onOpenChange(next);
  };

  const startCast = async () => {
    try {
      setStatus("connecting");
      const PresentationRequestCtor = (
        window as unknown as {
          PresentationRequest: new (urls: string | string[]) => unknown;
        }
      ).PresentationRequest;
      const request = new PresentationRequestCtor(videoUrl);
      // Some browsers expose navigator.presentation; the simplest path is
      // to call .start() on the request directly.
      const session = await (
        request as unknown as {
          start: () => Promise<{
            connection: unknown;
            onstatechange?: ((e: unknown) => void) | null;
            close: () => void;
          }>;
        }
      ).start();
      setStatus("connected");
      toast.success("Casting started", {
        description: title,
      });
      // Close the dialog once casting has begun.
      handleOpenChange(false);
      // Clean up the session if the user navigates away.
      void session;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // AbortError means the user dismissed the picker — not a real error.
      if (msg && /abort/i.test(msg)) {
        setStatus("idle");
        return;
      }
      setStatus("error");
      toast.error("Cast failed", {
        description:
          "Your browser couldn't start a cast session. Try the QR code instead.",
      });
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(videoUrl)}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-border/70 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-brand-muted">
            <Cast className="size-5 text-[var(--brand)]" />
          </div>
          <DialogTitle className="text-xl">Cast to TV</DialogTitle>
          <DialogDescription>
            Send <span className="font-medium text-foreground">{title}</span> to
            any Chromecast, smart TV, or AirPlay device.
          </DialogDescription>
        </DialogHeader>

        {/* Option 1 — Presentation API */}
        {supportsPresentation && (
          <div className="rounded-lg border border-border/60 bg-background/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/15">
                <Tv className="size-5 text-[var(--brand)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Use this device</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Opens your browser&apos;s built-in cast picker. Choose any
                  available Chromecast or smart TV on your network.
                </p>
              </div>
            </div>
            <Button
              onClick={startCast}
              disabled={status === "connecting" || status === "connected"}
              className="mt-3 w-full gap-2 bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand)]/90"
            >
              {status === "connected" ? (
                <>
                  <CheckCircle2 className="size-4" /> Casting started
                </>
              ) : status === "connecting" ? (
                <>
                  <MonitorPlay className="size-4 animate-pulse" /> Connecting…
                </>
              ) : (
                <>
                  <Cast className="size-4" /> Start Cast
                </>
              )}
            </Button>
          </div>
        )}

        {!supportsPresentation && (
          <div className="rounded-lg border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
            <p>
              This browser doesn&apos;t support the Presentation API. Use the QR
              code below to cast from your phone.
            </p>
          </div>
        )}

        {/* Option 2 — QR fallback */}
        <div className="rounded-lg border border-border/60 bg-background/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/15">
              <Smartphone className="size-5 text-[var(--brand)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Cast from your phone</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Scan with your phone camera, open the link, then AirPlay or cast
                from your phone&apos;s video player.
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-center rounded-lg bg-white p-3">
            <img
              src={qrUrl}
              alt="QR code linking to the video stream"
              className="size-48"
            />
          </div>

          <div className="mt-3 max-h-16 overflow-y-auto rounded-md bg-muted/60 p-2">
            <p className="break-all font-mono text-[10px] leading-tight text-muted-foreground">
              {videoUrl}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
