/**
 * /api/transcode — transcodes local MKV/HEVC files to H.264 mp4 using ffmpeg.
 *
 * Takes a `?path=<encoded_path>` parameter (relative to public/),
 * pipes the file through ffmpeg, and streams the transcoded H.264 mp4
 * to the browser.
 *
 * This is needed because browsers can't decode HEVC/x265 video natively
 * (except Safari). The MKV files downloaded from nyaa.si use HEVC.
 */
import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { createReadStream } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fileParam = url.searchParams.get("path");

  if (!fileParam) {
    return new Response("Missing path parameter", { status: 400 });
  }

  // Decode and resolve the path (relative to public/)
  const decodedPath = decodeURIComponent(fileParam);
  const fullPath = join(process.cwd(), "public", decodedPath);

  // Verify the file exists and is within public/
  if (!fullPath.startsWith(join(process.cwd(), "public"))) {
    return new Response("Access denied", { status: 403 });
  }

  try {
    // Spawn ffmpeg to transcode MKV → H.264 mp4 (streamable)
    const ffmpeg = spawn("ffmpeg", [
      "-i", fullPath,              // Input file
      "-c:v", "libx264",          // Transcode video to H.264
      "-preset", "ultrafast",     // Fastest preset (real-time)
      "-crf", "28",               // Compression quality
      "-c:a", "aac",              // Transcode audio to AAC
      "-b:a", "128k",             // Audio bitrate
      "-f", "mp4",                // Output format: mp4
      "-movflags", "frag_keyframe+empty_moov",  // Streamable mp4
      "pipe:1",                   // Write to stdout
    ]);

    // Convert ffmpeg stdout (Node Readable) to Web ReadableStream
    const { Readable } = await import("stream");
    const webStream = Readable.toWeb(ffmpeg.stdout as any);

    ffmpeg.stderr.on("data", (data) => {
      // Suppress ffmpeg progress output
    });

    ffmpeg.on("error", (err) => {
      console.error("ffmpeg error:", err.message);
    });

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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`Transcode failed: ${msg}`, { status: 502 });
  }
}
