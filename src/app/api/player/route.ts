/**
 * /api/player — server-side proxy for the gdriveplayer embed.
 *
 * Why this exists:
 *   - gdriveplayer.biz (the original domain) was taken down — NXDOMAIN.
 *   - Mirrors (gdriveplayer.us / .to / .me) still work but the user's
 *     browser may not be able to resolve them, and direct iframe embeds
 *     leak the parent domain as Referer.
 *   - This route fetches the embed HTML server-side (where DNS works and
 *     we control headers), injects a <base> tag so relative URLs resolve
 *     to the mirror, and serves it through our own origin.
 *
 * The user's browser only ever talks to our domain. The mirror only ever
 * sees a request from our server (with a real-browser User-Agent and
 * no Referer).
 *
 * Mirrors are tried in order; the first one that returns 200 + a player
 * page wins. If all fail, we return a clean error page so the iframe
 * doesn't show a broken DNS error.
 */
import { NextRequest, NextResponse } from "next/server";

const MIRRORS = [
  "https://gdriveplayer.us/embed.php",
  "https://gdriveplayer.to/embed.php",
  "https://gdriveplayer.me/embed.php",
];

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9," +
    "image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  // No Referer — pretend this is a top-level navigation
  Referer: "",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title");
  const episode = url.searchParams.get("episode") || "1";
  // "sub" (default) = Japanese audio + English subs.
  // "dub" = English dubbed audio. We forward both styles to the mirror:
  //   - &dub=1      (older gdriveplayer param)
  //   - &language=dub (newer gdriveplayer param)
  // The mirror may or may not have a dub version; if it doesn't, the
  // player falls back to sub silently.
  const lang = url.searchParams.get("lang") === "dub" ? "dub" : "sub";

  if (!title) {
    return new NextResponse("Missing title", { status: 400 });
  }

  // Build the mirror query string — sub and dub use the same endpoint,
  // we just append extra params for the dub case.
  const dubParams = lang === "dub" ? "&dub=1&language=dub" : "";
  let lastError: string | null = null;

  for (const mirror of MIRRORS) {
    try {
      const targetUrl = `${mirror}?title=${encodeURIComponent(title)}&episode=${encodeURIComponent(episode)}${dubParams}`;
      const response = await fetch(targetUrl, {
        headers: BROWSER_HEADERS,
        redirect: "follow",
        // Don't let one dead mirror hang the whole request
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        lastError = `${mirror} returned HTTP ${response.status}`;
        continue;
      }

      const html = await response.text();

      // Sanity check: a real player page should have a player div or jwplayer script.
      // If it's a parking page or redirect stub, skip to the next mirror.
      const looksLikePlayer =
        html.includes("jwplayer") ||
        html.includes("jw-") ||
        html.includes("<video") ||
        html.includes("player");
      if (!looksLikePlayer || html.length < 1500) {
        lastError = `${mirror} returned non-player HTML`;
        continue;
      }

      const mirrorOrigin = new URL(mirror).origin;
      const proxiedHtml = rewriteHtml(html, mirrorOrigin, lang);

      return new NextResponse(proxiedHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Frame-Options": "SAMEORIGIN",
          "Content-Security-Policy":
            "frame-ancestors 'self'; " +
            "media-src * data: blob:; " +
            "img-src * data: blob:; " +
            "script-src 'unsafe-inline' 'unsafe-eval' https:; " +
            "style-src 'unsafe-inline' https:; " +
            "connect-src *;",
          // Tell the client which mirror + language served the request
          "X-Player-Source": new URL(mirror).hostname,
          "X-Player-Lang": lang,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      lastError = `${mirror} failed: ${msg}`;
      continue;
    }
  }

  // All mirrors failed — return a clean error page so the iframe doesn't
  // show a browser DNS error.
  const errorHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; color: #fff; font-family: var(--font-geist-sans, system-ui, sans-serif); display: flex; align-items: center; justify-content: center; height: 100vh; padding: 20px; }
  .err { max-width: 440px; text-align: center; }
  .glyph { font-size: 28px; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 14px; }
  h2 { font-size: 16px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.01em; }
  p { font-size: 12px; color: #888; line-height: 1.5; margin: 4px 0; }
  .code { display: inline-block; margin-top: 12px; padding: 4px 8px; border: 1px solid #333; font-family: var(--font-geist-mono, monospace); font-size: 10px; color: #666; }
</style></head><body><div class="err">
  <div class="glyph">ichidok</div>
  <h2>Episode source unavailable</h2>
  <p>All mirrors are currently down or rate-limited.</p>
  <p>Try another episode or check back in a minute.</p>
  <span class="code">${escapeHtml(lastError || "no mirrors available")}</span>
</div></body></html>`;

  return new NextResponse(errorHtml, {
    status: 502,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Rewrite the mirror's HTML so it renders correctly when served from our origin.
 * Strategy:
 *   1. Inject a <base href="<mirror-origin>/"> tag right after <head> so all
 *      relative URLs (CSS, JS, images, video) resolve to the mirror.
 *   2. Add <meta name="referrer" content="no-referrer"> so the mirror doesn't
 *      see our domain as the Referer when the browser fetches resources.
 *   3. If lang="dub", inject a small script that listens for JW Player
 *      initialization and auto-selects the English audio track once it
 *      becomes available. If lang="sub", the script forces Japanese audio
 *      + English subtitles. This is best-effort — if the source only has
 *      one audio track, the script is a no-op.
 *   4. Pass through everything else unchanged.
 */
function rewriteHtml(html: string, mirrorOrigin: string, lang: "sub" | "dub"): string {
  const baseTag = `<base href="${mirrorOrigin}/">`;
  const referrerMeta = `<meta name="referrer" content="no-referrer">`;

  // JW Player audio track auto-selector.
  // The player exposes `jwplayer().getAudioTracks()` once initialized; we poll
  // for it and pick the track whose label matches "eng" / "english" (for dub)
  // or "jpn" / "japanese" (for sub). If no match, we leave it alone.
  const audioSelectorScript = `<script>
(function(){
  var WANT = ${lang === "dub" ? '"eng"' : '"jpn"'};
  var tries = 0;
  function pickTrack(){
    tries++;
    if (tries > 40) return; // give up after ~20s
    try {
      var p = window.jwplayer && window.jwplayer();
      if (!p || typeof p.getAudioTracks !== "function") {
        setTimeout(pickTrack, 500);
        return;
      }
      var tracks = p.getAudioTracks();
      if (!tracks || tracks.length < 2) {
        setTimeout(pickTrack, 500);
        return;
      }
      var match = tracks.find(function(t){
        var name = ((t.name || "") + " " + (t.language || "")).toLowerCase();
        return name.indexOf(WANT) >= 0 || name.indexOf(${lang === "dub" ? '"english"' : '"japanese"'}) >= 0;
      });
      if (match && typeof p.setCurrentAudioTrack === "function") {
        p.setCurrentAudioTrack(match.index !== undefined ? match.index : tracks.indexOf(match));
      }
    } catch (e) {
      setTimeout(pickTrack, 500);
    }
  }
  if (document.readyState === "complete") pickTrack();
  else window.addEventListener("load", pickTrack);
})();
</script>`;

  // Try to inject right after <head ...>
  const headMatch = html.match(/<head([^>]*)>/i);
  if (headMatch) {
    return html.replace(
      /<\/head>/i,
      `${audioSelectorScript}</head>`,
    ).replace(
      /<head([^>]*)>/i,
      `<head$1>${baseTag}${referrerMeta}`,
    );
  }

  // No <head> tag — wrap the whole thing
  return `<!DOCTYPE html><html><head>${baseTag}${referrerMeta}${audioSelectorScript}</head><body>${html}</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
