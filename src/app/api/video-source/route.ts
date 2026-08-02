/**
 * /api/video-source — extracts the actual video stream URL from a gdriveplayer
 * embed page, server-side.
 *
 * Flow:
 *   1. Fetch https://database.gdriveplayer.me/embed.php?type=anime&slug=<slug>&episode=<N>
 *   2. Find the eval'd JS packer in the HTML
 *   3. Decode it (base-62 packer unpacker)
 *   4. Extract the video source URL from the decoded JW Player setup
 *   5. Return the URL (or URLs) as JSON
 *
 * The client (our CustomPlayer) then loads this URL through /api/stream
 * to avoid CORS issues and to hide the gdriveplayer origin from the user's
 * browser.
 *
 * All fetching happens server-side, so gdriveplayer only ever sees a request
 * from our Vercel server — never from the user's browser.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMBED_URL = "https://database.gdriveplayer.me/embed.php";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Referer: "https://database.gdriveplayer.me/",
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const episode = url.searchParams.get("episode") || "1";

  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug parameter" },
      { status: 400 },
    );
  }

  try {
    const embedFullUrl = `${EMBED_URL}?type=anime&slug=${encodeURIComponent(slug)}&episode=${encodeURIComponent(episode)}`;
    const response = await fetch(embedFullUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `gdriveplayer returned HTTP ${response.status}`,
          sources: [],
        },
        { status: 502 },
      );
    }

    const html = await response.text();

    // Decode the eval'd JS packer to extract video source URLs
    const sources = extractVideoSources(html);

    if (sources.length === 0) {
      return NextResponse.json(
        {
          error: "No video sources found in the embed page",
          sources: [],
          htmlPreview: html.slice(0, 500),
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        sources,
        // The stream URL our player should use — points to our own /api/stream
        // endpoint which proxies the actual video bytes.
        // Pick the FIRST real video source (gdriveplayer lists 360 first, then 480, 720).
        // Skip subtitle tracks and error fallbacks.
        streamUrls: sources
          .filter((s) => !s.file.includes("subtitle") && !s.file.includes("error.php"))
          .map((s) => ({
            label: s.label,
            url: `/api/stream?url=${encodeURIComponent(s.file)}`,
            type: s.type,
          })),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to fetch video source: ${msg}`, sources: [] },
      { status: 500 },
    );
  }
}

/**
 * Extract video source URLs from the gdriveplayer embed HTML.
 *
 * The HTML contains an eval'd JS packer like:
 *   eval(function(p,a,c,k,e,d){...}('payload',62,count,'token1|token2|...'.split('|'),0,{}))
 *
 * We decode it by:
 *   1. Extracting the payload string and token list
 *   2. Replacing each base-62 number in the payload with the corresponding token
 *   3. Finding all `file:'...'` entries in the decoded JS
 */
function extractVideoSources(html: string): Array<{ file: string; type: string; label: string }> {
  // Find the eval'd JS packer
  const evalMatch = html.match(
    /eval\(function\(p,a,c,k,e,d\).*?return p\}\((.*?)\)\)/s,
  );
  if (!evalMatch) return [];

  const argsStr = evalMatch[1];
  // Extract all single-quoted strings from the args
  const quotedStrings: string[] = [];
  const regex = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = regex.exec(argsStr)) !== null) {
    quotedStrings.push(m[1].replace(/\\'/g, "'"));
  }

  if (quotedStrings.length < 2) return [];

  const payload = quotedStrings[0];
  const tokens = quotedStrings[1].split("|");

  // Decode: replace each base-62 word in the payload with tokens[base62(word)]
  const decoded = decodePacker(payload, tokens);

  // Extract all file:'...' entries from the decoded JS
  const sources: Array<{ file: string; type: string; label: string }> = [];
  const fileRegex = /file:\s*'([^']+)'/g;
  const typeRegex = /type:\s*'([^']+)'/g;
  const labelRegex = /label:\s*'([^']+)'/g;

  const files: string[] = [];
  const types: string[] = [];
  const labels: string[] = [];

  while ((m = fileRegex.exec(decoded)) !== null) {
    files.push(m[1]);
  }
  while ((m = typeRegex.exec(decoded)) !== null) {
    types.push(m[1]);
  }
  while ((m = labelRegex.exec(decoded)) !== null) {
    labels.push(m[1]);
  }

  // Combine into source objects — the sources array has file/type/label in order
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Skip error/placeholder sources
    if (file.startsWith("error.php") || file === "P") continue;
    // Normalize protocol-relative URLs
    const normalizedFile = file.startsWith("//")
      ? `https:${file}`
      : file;
    sources.push({
      file: normalizedFile,
      type: types[i] || "mp4",
      label: labels[i] || `${i}`,
    });
  }

  // Deduplicate by file URL (gdriveplayer often lists the same URL for 360/480/720)
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (seen.has(s.file)) return false;
    seen.add(s.file);
    return true;
  });
}

/**
 * Decode a base-62 packer payload.
 * Each word in the payload that is a valid base-62 number gets replaced with
 * tokens[base62(word)] if that token exists and is non-empty.
 */
function decodePacker(payload: string, tokens: string[]): string {
  function base62ToNum(s: string): number | null {
    if (!s || !/^[0-9a-zA-Z]+$/.test(s)) return null;
    let n = 0;
    for (const ch of s) {
      if (ch >= "0" && ch <= "9") n = n * 62 + parseInt(ch, 10);
      else if (ch >= "a" && ch <= "z") n = n * 62 + 10 + (ch.charCodeAt(0) - "a".charCodeAt(0));
      else if (ch >= "A" && ch <= "Z") n = n * 62 + 36 + (ch.charCodeAt(0) - "A".charCodeAt(0));
      else return null;
    }
    return n;
  }

  return payload.replace(/\b\w+\b/g, (word) => {
    const n = base62ToNum(word);
    if (n === null || n >= tokens.length) return word;
    return tokens[n] || word;
  });
}
