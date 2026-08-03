"use client";
/**
 * CastDialog — non-Google "Cast to TV" feature.
 *
 * Supports casting to:
 *   - Roku devices (via Roku ECP — External Control Protocol)
 *   - Fire TV / Android TV devices (via DIAL protocol)
 *   - Any device with a browser (via QR code to open the video on another device)
 *
 * How Roku ECP works:
 *   1. User enters their Roku's IP address (found in Settings > Network > About)
 *   2. We send POST http://<roku-ip>:8060/launch/dev?contentId=<video_url>
 *   3. Roku's built-in media player opens and plays the video
 *   4. The video URL must be reachable from the Roku (same network or public internet)
 *
 * How Fire TV DIAL works:
 *   1. User enters their Fire TV's IP address (found in Settings > My Fire TV > About > Network)
 *   2. We send POST http://<firetv-ip>:8009/apps/YouTube with the video URL
 *   3. Or we use the "Developer Tools" app if installed
 *
 * For devices without ECP/DIAL (smart TVs, Apple TV, etc.):
 *   - Show a QR code that opens the video URL on the user's phone/tablet
 *   - The phone can then AirPlay/Cast to their TV using the phone's built-in casting
 *
 * The IP is saved in localStorage so the user only enters it once.
 */
import { useState } from "react";
import { Tv, X, Search, Check, Smartphone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
};

const DEVICE_STORAGE_KEY = "ichidok:cast-device";

type DeviceType = "roku" | "firetv" | "qr";

export function CastDialog({ open, onClose, videoUrl, title }: Props) {
  const [deviceType, setDeviceType] = useState<DeviceType>("roku");
  const [deviceIp, setDeviceIp] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "scanning" | "casting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [scannedDevices, setScannedDevices] = useState<string[]>([]);

  // Load saved device IP on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (saved) setDeviceIp(saved);
    }
  });

  if (!open) return null;

  // Scan for Roku devices on the local network (try common IPs)
  const scanForDevices = async () => {
    setStatus("scanning");
    setScannedDevices([]);
    const found: string[] = [];

    // Try common local network IPs (192.168.1.x, 192.168.0.x, 10.0.0.x)
    const baseIps = ["192.168.1", "192.168.0", "10.0.0", "192.168.4", "192.168.2"];
    for (const base of baseIps) {
      for (let i = 1; i <= 254; i++) {
        const ip = `${base}.${i}`;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 800);
          const res = await fetch(`http://${ip}:8060/query/device-info`, {
            signal: controller.signal,
            mode: "no-cors",
          });
          clearTimeout(timeout);
          // Roku ECP responds even in no-cors mode (opaque response)
          // If fetch doesn't throw, the device exists on port 8060
          found.push(ip);
          setScannedDevices([...found]);
          if (found.length >= 5) break;
        } catch {
          // No response from this IP — skip
        }
      }
      if (found.length >= 5) break;
    }

    if (found.length > 0) {
      setStatus("idle");
    } else {
      setStatus("idle");
      setErrorMessage("No Roku devices found. Enter your device IP manually.");
    }
  };

  // Cast to Roku via ECP
  const castToRoku = async (ip: string) => {
    setStatus("casting");
    setErrorMessage("");
    const url = encodeURIComponent(videoUrl);

    try {
      // Launch Roku's built-in media player with our video URL
      const res = await fetch(`http://${ip}:8060/launch/dev?contentId=${url}`, {
        method: "POST",
        mode: "no-cors",
      });

      // Save IP for future use
      localStorage.setItem(DEVICE_STORAGE_KEY, ip);
      setDeviceIp(ip);
      setStatus("success");

      // Reset after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setStatus("error");
      setErrorMessage(`Could not reach Roku at ${ip}. Make sure it's on the same network and developer mode is enabled.`);
    }
  };

  // Cast to Fire TV via DIAL
  const castToFireTv = async (ip: string) => {
    setStatus("casting");
    setErrorMessage("");

    try {
      // DIAL: POST to the Fire TV's DIAL endpoint
      const res = await fetch(`http://${ip}:8009/apps/YouTube`, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: `v=${videoUrl}`,
      });

      localStorage.setItem(DEVICE_STORAGE_KEY, ip);
      setDeviceIp(ip);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setStatus("error");
      setErrorMessage(`Could not reach Fire TV at ${ip}. Make sure it's on the same network.`);
    }
  };

  const handleCast = () => {
    if (!deviceIp.trim()) {
      setErrorMessage("Please enter your device IP address.");
      return;
    }
    if (deviceType === "roku") castToRoku(deviceIp.trim());
    else if (deviceType === "firetv") castToFireTv(deviceIp.trim());
  };

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

        {/* Device type selector */}
        <div className="mb-5 flex gap-2">
          <DeviceButton active={deviceType === "roku"} onClick={() => setDeviceType("roku")} label="Roku" />
          <DeviceButton active={deviceType === "firetv"} onClick={() => setDeviceType("firetv")} label="Fire TV" />
          <DeviceButton active={deviceType === "qr"} onClick={() => setDeviceType("qr")} label="QR Code" />
        </div>

        {/* QR Code mode */}
        {deviceType === "qr" ? (
          <div className="text-center">
            <p className="mb-3 text-xs text-muted-foreground">
              Scan with your phone camera, then AirPlay/Screen Mirror to your TV.
            </p>
            <div className="mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center border border-border bg-white p-2">
              <img src={qrUrl} alt="QR code" className="h-full w-full" />
            </div>
            <p className="mt-3 line-clamp-1 text-center text-xs text-muted-foreground">{title}</p>
          </div>
        ) : (
          <>
            {/* IP input + scan */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {deviceType === "roku" ? "Roku IP Address" : "Fire TV IP Address"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceIp}
                  onChange={(e) => setDeviceIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="flex-1 border border-border bg-card px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={scanForDevices}
                  disabled={status === "scanning"}
                  className="inline-flex items-center gap-1.5 border border-border bg-card px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50"
                >
                  {status === "scanning" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Scan
                </button>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                {deviceType === "roku"
                  ? "Find in: Roku Settings → Network → About. Enable Developer Mode in Settings → System → Developer."
                  : "Find in: Fire TV Settings → My Fire TV → About → Network."}
              </p>
            </div>

            {/* Scanned devices */}
            {scannedDevices.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Found devices</p>
                <div className="flex flex-col gap-1.5">
                  {scannedDevices.map((ip) => (
                    <button
                      key={ip}
                      onClick={() => setDeviceIp(ip)}
                      className={cn(
                        "flex items-center justify-between border px-3 py-2 text-left text-sm transition-colors",
                        deviceIp === ip ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-foreground hover:text-background"
                      )}
                    >
                      <span className="font-mono">{ip}</span>
                      <Tv className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="mb-4 border border-foreground/30 bg-foreground/5 p-3 text-xs text-foreground">
                {errorMessage}
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className="mb-4 flex items-center gap-2 border border-foreground/30 bg-foreground/5 p-3 text-xs text-foreground">
                <Check className="h-4 w-4" />
                Casting to {deviceIp}. Use your TV remote to control playback.
              </div>
            )}

            {/* Cast button */}
            <button
              onClick={handleCast}
              disabled={status === "casting" || !deviceIp.trim()}
              className="flex w-full items-center justify-center gap-2 bg-foreground py-3 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90 disabled:opacity-50"
            >
              {status === "casting" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
              ) : (
                <><Tv className="h-4 w-4" /> Cast to {deviceType === "roku" ? "Roku" : "Fire TV"}</>
              )}
            </button>

            {/* How it works */}
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> No Google Cast SDK, no account.
                Sends a direct command to your Roku or Fire TV on your local network to launch
                the video. Your TV must be on the same Wi-Fi as this device.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeviceButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 border py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
