/**
 * /api/drive-stream — server-side proxy for Google Drive video files.
 *
 * Bypasses Google's "virus scan warning" page. For MKV/HEVC files that
 * browsers can't play natively, downloads the file and transcodes to H.264
 * using ffmpeg so the video (not just audio) works in all browsers.
 *
 * Query params:
 *   id=<fileId>          (required) Google Drive file ID
 *   resourcekey=<key>    (optional) resource key for restricted files
 */
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

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

  try {
    const upstream = await fetch(downloadUrl.toString(), {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(60000),
    });

    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "Google Drive returned the virus scan warning page.", fileId },
        { status: 502 },
      );
    }

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Google Drive returned HTTP ${upstream.status}`, { status: 502 });
    }

    // Check if it's an MKV file (browsers can't play HEVC video in MKV)
    const contentDisposition = upstream.headers.get("content-disposition") || "";
    const isMkv = contentDisposition.includes(".mkv") || contentType.includes("matroska");

    if (isMkv) {
      // Transcode MKV → H.264 mp4 using ffmpeg
      // Convert the Web ReadableStream to a Node.js Readable for ffmpeg
      const nodeStream = Readable.fromWeb(upstream.body as any);

      const { spawn } = await import("child_process");
      const ffmpeg = spawn("ffmpeg", [
        "-i", "pipe:0",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-c:a", "aac",
        "-b:a", "128k",
        "-f", "mp4",
        "-movflags", "frag_keyframe+empty_moov",
        "pipe:1",
      ]);

      // Pipe upstream → ffmpeg stdin
      nodeStream.pipe(ffmpeg.stdin);

      // Handle errors
      nodeStream.on("error", () => ffmpeg.stdin.destroy());
      ffmpeg.stdin.on("error", () => {});

      // Convert ffmpeg stdout (Node Readable) to Web ReadableStream
      const webStream = Readable.toWeb(ffmpeg.stdout as any);

      return new Response(webStream, {
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

    // Direct passthrough for mp4/webm files (no transcoding needed)
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "video/mp4");
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
