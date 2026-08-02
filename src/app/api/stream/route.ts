/**
 * /api/stream — server-side video streaming proxy.
 *
 * Takes a `url` query parameter, fetches the video bytes from that URL
 * server-side, and pipes them to the client with proper headers.
 *
 * Supports HTTP Range requests (for seeking) and passes through the
 * Content-Type, Content-Length, and Content-Range headers.
 *
 * This lets our custom HTML5 player play videos from sources that would
 * otherwise be blocked by CORS or that need server-side fetching (e.g.
 * gdriveplayer's redirector URLs).
 *
 * The upstream server only sees a request from our Vercel server — never
 * from the user's browser. We forward a real-browser User-Agent and no
 * Referer to avoid detection.
 */
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  // No Referer — pretend this is a direct video fetch
  Referer: "",
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // Validate the URL — only allow http/https
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.protocol.startsWith("http")) {
      return new Response("Invalid protocol", { status: 400 });
    }
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  // Forward the Range header for seeking support
  const range = req.headers.get("range");
  if (range) {
    BROWSER_HEADERS["Range"] = range;
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      // 206 = Partial Content (normal for Range requests)
      return new Response(
        `Upstream returned HTTP ${upstream.status}`,
        { status: 502 },
      );
    }

    // Build response headers — pass through content-type, content-length,
    // content-range, and accept-ranges so the browser can seek.
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    } else {
      responseHeaders.set("Content-Type", "video/mp4");
    }

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
    // Allow cross-origin access from our own player
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

    // Stream the body directly — don't buffer the whole video in memory
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`Stream failed: ${msg}`, { status: 502 });
  }
}
