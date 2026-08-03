/**
 * /api/stream — server-side video streaming proxy.
 *
 * Takes a `?url=<encoded>` query parameter, fetches the video bytes from
 * that URL server-side, and pipes them to the client with proper headers.
 *
 * Why a proxy: Archive.org serves its files from a redirector
 * (`archive.org/download/...`) that 302s to a CDN host
 * (`dnXXX.us.archive.org`). Browsers can't follow that redirect for a
 * <video> media source in all cases, and CORS would block direct playback.
 * We follow the redirects server-side and stream the bytes back with
 * permissive CORS headers.
 *
 * Supports HTTP Range requests (for seeking) and passes through
 * Content-Type, Content-Length, and Content-Range.
 *
 * Implementation note: we use Node's `http`/`https` modules with manual
 * redirect-following rather than the global `fetch` (undici). In some
 * sandboxes undici times out connecting to archive.org's CDN hosts even
 * though the `https` module connects fine — so we go straight to the
 * battle-tested `https` implementation and pipe the stream.
 */
import { NextRequest } from "next/server";
import { request, type IncomingMessage } from "http";
import { request as requestHttps } from "https";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type UpstreamResponse = {
  status: number;
  headers: Record<string, string | string[]>;
  stream: IncomingMessage;
};

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
};

/**
 * Issue a GET (with optional Range) to `targetUrl`, following 3xx redirects
 * up to `maxRedirects` hops. Resolves with the final IncomingMessage stream.
 */
function fetchWithRedirects(
  targetUrl: string,
  extraHeaders: Record<string, string>,
  maxRedirects = 6,
): Promise<UpstreamResponse> {
  return new Promise((resolve, reject) => {
    const doRequest = (href: string, remaining: number) => {
      let parsed: URL;
      try {
        parsed = new URL(href);
      } catch {
        reject(new Error(`Invalid URL: ${href}`));
        return;
      }
      const isHttps = parsed.protocol === "https:";
      const reqFn = isHttps ? requestHttps : request;
      const headers = { ...DEFAULT_HEADERS, ...extraHeaders };

      const req = reqFn(
        {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: "GET",
          headers,
        },
        (res: IncomingMessage) => {
          // Follow redirects (3xx with a Location header).
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location &&
            remaining > 0
          ) {
            // Consume the redirect body so the socket can be reused/freed.
            res.resume();
            const nextUrl = new URL(
              res.headers.location,
              parsed,
            ).toString();
            doRequest(nextUrl, remaining - 1);
            return;
          }

          resolve({
            status: res.statusCode ?? 200,
            headers: res.headers as Record<string, string | string[]>,
            stream: res,
          });
        },
      );

      req.on("error", (err) => reject(err));
      // Overall connect + transfer guard. The body itself may stream for a
      // long time, so we only guard the *establish* phase loosely here.
      req.setTimeout(30_000, () => {
        req.destroy(new Error("upstream timeout"));
      });
      req.end();
    };

    doRequest(targetUrl, maxRedirects);
  });
}

function firstHeader(
  headers: Record<string, string | string[]>,
  name: string,
): string | null {
  const v = headers[name.toLowerCase()];
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // Validate — only http/https upstream URLs.
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.protocol.startsWith("http")) {
      return new Response("Invalid protocol", { status: 400 });
    }
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  // Forward the Range header so seeking works.
  const range = req.headers.get("range");
  const extraHeaders: Record<string, string> = {};
  if (range) extraHeaders["Range"] = range;

  try {
    const upstream = await fetchWithRedirects(targetUrl, extraHeaders);

    // 2xx or 206 (Partial Content) are the success cases we stream.
    if (
      !upstream.status ||
      upstream.status < 200 ||
      (upstream.status >= 300 && upstream.status !== 206)
    ) {
      // Drain so the socket can be returned to the pool.
      upstream.stream.resume();
      return new Response(`Upstream returned HTTP ${upstream.status}`, {
        status: 502,
      });
    }

    const responseHeaders = new Headers();
    const contentType =
      firstHeader(upstream.headers, "content-type") || "video/mp4";
    responseHeaders.set("Content-Type", contentType);

    const contentLength = firstHeader(upstream.headers, "content-length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    const contentRange = firstHeader(upstream.headers, "content-range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);

    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range");
    responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

    // Convert the Node stream into a Web ReadableStream so we can hand it
    // straight to the Response without buffering the whole file.
    const webStream = Readable.toWeb(upstream.stream) as ReadableStream;

    return new Response(webStream, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`Stream failed: ${msg}`, { status: 502 });
  }
}
