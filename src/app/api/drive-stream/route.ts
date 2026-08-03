/**
 * /api/drive-stream — server-side proxy for Google Drive video files.
 *
 * Bypasses Google's "virus scan warning" page by adding confirm=t&uuid=<uuid>.
 * For MKV/HEVC files that browsers can't play natively, transcodes to H.264
 * mp4 using ffmpeg so the video (not just audio) works in all browsers.
 *
 * Query params:
 *   id=<fileId>          (required) Google Drive file ID
 *   resourcekey=<key>    (optional) resource key for restricted files
 */
import { NextRequest } from "next/server";
import { spawn } from "child_process";

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
  const transcode = url.searchParams.get("transcode") === "1";

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
        JSON.stringify({ error: "Google Drive returned the virus scan warning page.", fileId }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Google Drive returned HTTP ${upstream.status}`, { status: 502 });
    }

    // If the file is MKV (HEVC/x265), transcode to H.264 mp4 so the
    // browser can display the video (not just audio). This is expensive
    // but necessary — browsers can't decode HEVC video natively.
    const contentDisposition = upstream.headers.get("content-disposition") || "";
    const isMkv = contentDisposition.includes(".mkv") || contentType.includes("matroska");

    if (isMkv || transcode) {
      // Transcode using ffmpeg: read from stdin, output H.264 mp4 to stdout
      // Use -movflags frag_keyframe+empty_moov for fragmented mp4 (streamable)
      const ffmpeg = spawn("ffmpeg", [
        "-i", "pipe:0",           // Read from stdin
        "-c:v", "libx264",        // Transcode video to H.264
        "-preset", "ultrafast",   // Fastest preset (lower quality but real-time)
        "-crf", "28",             // Compression quality (lower = better quality, higher = smaller)
        "-c:a", "aac",            // Transcode audio to AAC
        "-b:a", "128k",           // Audio bitrate
        "-f", "mp4",              // Output format: mp4
        "-movflags", "frag_keyframe+empty_moov",  // Streamable mp4
        "pipe:1",                 // Write to stdout
      ]);

      // Pipe the upstream response to ffmpeg's stdin
      // @ts-expect-error — ReadableStream to WritableStream conversion
      upstream.body.pipe(ffmpeg.stdin);

      // Return ffmpeg's stdout as the response
      return new Response(ffmpeg.stdout, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "Cross-Origin-Resource-Policy": "cross-origin",
          "X-Transcoded": "1",
        },
      });
    }

    // Direct passthrough for mp4/webm files
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
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
