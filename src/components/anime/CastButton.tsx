"use client";
/**
 * CastButton — a custom "Send to Device" button.
 *
 * Why custom: Google's Chromecast SDK requires a registered receiver app ID
 * and uses the Cast framework which has been progressively blocking non-
 * approved origins. Instead we implement a "send to device" flow that:
 *   1) shows a QR code of the current video URL the user can scan on a phone/tablet
 *   2) offers a copy-link button
 *   3) opens the player in a new tab on the same network
 *
 * This works on any device with a camera and a browser, no Google account,
 * no SDK, no API key. Works alongside DLNA receivers if the user has one.
 */
import { useMemo, useState } from "react";
import { Cast, X, Copy, ExternalLink, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  url: string;
  title?: string;
};

export function CastButton({ url, title }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // generate a QR code as an SVG via the public api (no key, no SDK)
  // we use the deterministic goqr.me endpoint which renders an SVG.
  const qrUrl = useMemo(() => {
    const target = url;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      target,
    )}&bgcolor=ffffff&color=000000&qzone=1`;
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 border border-border bg-background/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-background"
        aria-label="Send to device"
      >
        <Cast className="h-3.5 w-3.5" />
        Cast
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[360px] border-border bg-card p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Send to device</DialogTitle>
            <DialogDescription>
              Scan the QR code with any phone or tablet to open the player on
              that device.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Cast className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-tight">
                Send to device
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-4">
            <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              Scan with phone camera
            </p>
            <div className="mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center border border-border bg-white p-2">
              <img
                src={qrUrl}
                alt="QR code linking to the video player"
                className="h-full w-full"
              />
            </div>
            {title && (
              <p className="mt-3 line-clamp-1 text-center text-xs text-muted-foreground">
                {title}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={copy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 border border-border bg-background py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </>
                )}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 border border-border bg-background py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
            </div>

            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              No Google account, no SDK. Works with any device that has a camera
              and a browser.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
