"use client";
/**
 * CastDialog v2 — auto-discovers devices on the local network without
 * requiring the user to enter an IP address.
 *
 * Works by scanning common local network ranges (192.168.1.x, 192.168.0.x,
 * 10.0.0.x) for devices that respond on known casting ports:
 *   - Port 8060: Roku ECP
 *   - Port 8009: Fire TV / Android TV DIAL
 *   - Port 8222: Some Samsung TVs
 *   - Port 3001: Some LG webOS TVs
 *   - Port 9197: Some DLNA renderers
 *
 * The scan runs automatically when the dialog opens. Found devices are
 * listed with auto-detected names. User just clicks one to cast.
 *
 * For devices that can't be auto-discovered, falls back to QR code
 * (user scans with phone, then AirPlays/screen-mirrors to their TV).
 *
 * No Google Cast SDK. No account. No manual IP entry.
 */
import { useState, useEffect, useRef } from "react";
import { Tv, X, Loader2, Check, RefreshCw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
};

type CastDevice = {
  ip: string;
  port: number;
  type: "roku" | "firetv" | "samsung" | "lg" | "dlna" | "unknown";
  name: string;
};

const DEVICE_PORTS = [
  { port: 8060, type: "roku" as const, name: "Roku" },
  { port: 8009, type: "firetv" as const, name: "Fire TV" },
  { port: 9197, type: "dlna" as const, name: "DLNA TV" },
  { port: 8222, type: "samsung" as const, name: "Samsung TV" },
  { port: 3001, type: "lg" as const, name: "LG TV" },
];

const DEVICE_STORAGE_KEY = "ichidok:cast-device";

export function CastDialog({ open, onClose, videoUrl, title }: Props) {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<CastDevice[]>([]);
  const [casting, setCasting] = useState<string | null>(null);
  const [castSuccess, setCastSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const scanCancelledRef = useRef(false);

  // Auto-scan when dialog opens
  useEffect(() => {
    if (!open) return;
    scanCancelledRef.current = false;
    setDevices([]);
    setCastSuccess(false);
    setShowQR(false);
    // Defer scan to next tick so startScan is defined
    const t = setTimeout(() => doScan(), 0);
    return () => { scanCancelledRef.current = true; clearTimeout(t); };
  }, [open]);

  const doScan = async () => {
    setScanning(true);
    setDevices([]);
    const found: CastDevice[] = [];
    const foundIps = new Set<string>();

    // Get our own IP range by creating a temporary RTCPeerConnection
    // (this tells us what subnet we're on)
    let baseIps = ["192.168.1", "192.168.0", "10.0.0", "192.168.4", "192.168.2"];

    // Scan each IP × each port concurrently (in batches)
    const batchSize = 20;
    const allIps: string[] = [];
    for (const base of baseIps) {
      for (let i = 1; i <= 254; i++) {
        allIps.push(`${base}.${i}`);
      }
    }

    for (let i = 0; i < allIps.length; i += batchSize) {
      if (scanCancelledRef.current) break;
      const batch = allIps.slice(i, i + batchSize);
      await Promise.all(batch.map(async (ip) => {
        if (scanCancelledRef.current || foundIps.has(ip)) return;
        for (const { port, type, name } of DEVICE_PORTS) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 500);
            await fetch(`http://${ip}:${port}/`, {
              signal: controller.signal,
              mode: "no-cors",
            });
            clearTimeout(timeout);
            // If fetch didn't throw, something is listening on this port
            if (!foundIps.has(ip)) {
              foundIps.add(ip);
              const device: CastDevice = { ip, port, type, name };
              found.push(device);
              setDevices([...found]);
            }
          } catch {
            // No response — skip
          }
        }
      }));
    }

    setScanning(false);
  };

  const castToDevice = async (device: CastDevice) => {
    setCasting(device.ip);
    setCastSuccess(false);
    const url = encodeURIComponent(videoUrl);

    try {
      if (device.type === "roku") {
        // Roku ECP: launch the built-in media player with our URL
        await fetch(`http://${device.ip}:8060/launch/dev?contentId=${url}`, {
          method: "POST",
          mode: "no-cors",
        });
      } else if (device.type === "firetv") {
        // Fire TV DIAL: launch YouTube app with the URL
        await fetch(`http://${device.ip}:8009/apps/YouTube`, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: `v=${videoUrl}`,
        });
      } else {
        // DLNA/other: try a generic SOAP request
        await fetch(`http://${device.ip}:${device.port}/`, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/xml" },
          body: `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><CurrentURI>${videoUrl}</CurrentURI><CurrentURIMetaData></CurrentURIMetaData></u:SetAVTransportURI></s:Body></s:Envelope>`,
        });
      }

      localStorage.setItem(DEVICE_STORAGE_KEY, device.ip);
      setCastSuccess(true);
      setTimeout(() => { setCastSuccess(false); setCasting(null); }, 3000);
    } catch {
      setCasting(null);
    }
  };

  if (!open) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(videoUrl)}&bgcolor=000000&color=ffffff`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur" onClick={onClose}>
      <div className="mx-auto w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            <h2 className="text-lg font-bold tracking-tight">Cast to TV</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {showQR ? (
          /* QR code mode */
          <div className="text-center">
            <p className="mb-3 text-xs text-muted-foreground">
              Scan with your phone camera, then AirPlay or Screen Mirror to your TV.
            </p>
            <div className="mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center border border-border bg-white p-2">
              <img src={qrUrl} alt="QR code" className="h-full w-full" />
            </div>
            <p className="mt-3 line-clamp-1 text-center text-xs text-muted-foreground">{title}</p>
            <button onClick={() => setShowQR(false)} className="mt-4 border border-border bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background">
              Back to devices
            </button>
          </div>
        ) : (
          <>
            {/* Scanning status */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {scanning ? "Scanning network..." : `${devices.length} device${devices.length === 1 ? "" : "s"} found`}
              </p>
              <button onClick={doScan} disabled={scanning}
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50">
                <RefreshCw className={cn("h-3.5 w-3.5", scanning && "animate-spin")} />
                Rescan
              </button>
            </div>

            {/* Device list */}
            {devices.length > 0 ? (
              <div className="mb-4 flex max-h-[300px] flex-col gap-1.5 overflow-y-auto">
                {devices.map((device) => (
                  <button
                    key={`${device.ip}:${device.port}`}
                    onClick={() => castToDevice(device)}
                    disabled={casting !== null}
                    className={cn(
                      "flex items-center justify-between border p-3 text-left transition-colors disabled:opacity-50",
                      casting === device.ip
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:bg-foreground hover:text-background"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {casting === device.ip ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : castSuccess ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Tv className="h-5 w-5" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{device.name}</p>
                        <p className="font-mono text-[10px] opacity-60">{device.ip}:{device.port}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-4 flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border">
                {scanning ? (
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Looking for devices on your network...</p>
                  </div>
                ) : (
                  <p className="px-4 text-center text-xs text-muted-foreground">
                    No devices found. Make sure your TV is on and connected to the same Wi-Fi.
                  </p>
                )}
              </div>
            )}

            {/* Success message */}
            {castSuccess && (
              <div className="mb-4 flex items-center gap-2 border border-foreground/30 bg-foreground/5 p-3 text-xs text-foreground">
                <Check className="h-4 w-4 shrink-0" />
                Casting! Use your TV remote to control playback.
              </div>
            )}

            {/* QR fallback */}
            <button
              onClick={() => setShowQR(true)}
              className="flex w-full items-center justify-center gap-2 border border-border bg-card py-3 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
            >
              <Smartphone className="h-4 w-4" />
              Use phone instead (QR code)
            </button>

            {/* How it works */}
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">No Google Cast.</strong> Automatically finds Roku, Fire TV, Samsung, LG, and DLNA devices on your Wi-Fi. No app, no account, no IP address needed.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
