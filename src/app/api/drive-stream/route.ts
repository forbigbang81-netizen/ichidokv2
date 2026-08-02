/**
 * /api/drive-stream — server-side proxy for Google Drive video files.
 *
 * Bypasses Google's "virus scan warning" page by adding confirm=t&uuid=<uuid>
 * to the download URL. Streams the video bytes to the client with proper
 * Content-Type, Content-Range, and Accept-Ranges headers.
 *
 * The user's browser only talks to our domain. Google Drive only sees a
 * request from our Vercel server.
 *
 * Query params:
 *   id=<fileId>          (required) Google Drive file ID
 *   resourcekey=<key>    (optional) resource key for restricted files
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
  Referer: "https://drive.usercontent.google.com/",
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fileId = url.searchParams.get("id");
  const resourceKey = url.searchParams.get("resourcekey") || "";

  if (!fileId) {
    return new Response("Missing id parameter", { status: 400 });
  }

  // Build the download URL with virus-scan bypass
  const downloadUrl = new URL("https://drive.usercontent.google.com/download");
  downloadUrl.searchParams.set("id", fileId);
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("confirm", "t");
  downloadUrl.searchParams.set("uuid", crypto.randomUUID());
  if (resourceKey) {
    downloadUrl.searchParams.set("resourcekey", resourceKey);
  }

  // Forward the Range header for seeking support
  const range = req.headers.get("range");
  if (range) {
    BROWSER_HEADERS["Range"] = range;
  } else {
    delete BROWSER_HEADERS["Range"];
  }

  try {
    const upstream = await fetch(downloadUrl.toString(), {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });

    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return new Response(
        JSON.stringify({
          error: "Google Drive returned the virus scan warning page.",
          fileId,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(
        `Google Drive returned HTTP ${upstream.status}`,
        { status: 502 },
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      upstream.headers.get("content-type") || "video/mp4",
    );

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
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`Stream failed: ${msg}`, { status: 502 });
  }
}
