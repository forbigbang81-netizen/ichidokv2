/**
 * /api/extract-stream — extracts the HLS video URL from a zokoanime/megaplay
 * embed page.
 *
 * The zokoanime player page contains a `window.__P` variable that is
 * base64 + XOR encoded. When decoded, it contains the HLS m3u8 URL,
 * subtitles, and other player config.
 *
 * This endpoint fetches the embed page, extracts __P, decodes it, and
 * returns the HLS URL to the client. Used for Chromecast (the Default
 * Media Receiver can play HLS URLs but not iframe embed pages).
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const OBF_KEY = "otaku-embed-v1";

function xorDecode(raw: Buffer): string {
  const key = Buffer.from(OBF_KEY, "utf-8");
  const out = Buffer.alloc(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw[i] ^ key[i % key.length];
  }
  return out.toString("utf-8");
}

function decodeP(blob: string): Record<string, unknown> | null {
  try {
    const raw = Buffer.from(blob, "base64");
    const json = xorDecode(raw);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Referer: "https://zokoanime.video/",
      },
      redirect: "follow",
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: `Failed to fetch embed page: ${r.status}` },
        { status: 502 },
      );
    }

    const html = await r.text();

    const m = html.match(/window\.__P="([^"]*)"/);
    if (!m) {
      return NextResponse.json(
        { error: "Could not find __P variable in player page" },
        { status: 502 },
      );
    }

    const data = decodeP(m[1]);
    if (!data) {
      return NextResponse.json(
        { error: "Failed to decode __P variable" },
        { status: 502 },
      );
    }

    const src = (data.src as string) || "";

    if (!src) {
      return NextResponse.json(
        { error: "No video source found in player data" },
        { status: 502 },
      );
    }

    return NextResponse.json({ src });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
