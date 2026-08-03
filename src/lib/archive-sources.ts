/**
 * Archive.org episode sources — maps anime + episode to an Archive.org
 * video URL routed through our /api/stream proxy (Archive.org returns 302
 * redirects that browsers can't follow for <video> elements, so we proxy).
 */
import type { GdriveEpisode } from "./gdrive-sources";

// Helper for Archive.org episodes — routes through our /api/stream proxy
// to handle Archive.org's 302 redirects
function arc(archiveUrl: string, title: string): GdriveEpisode {
  const proxiedUrl = `/api/stream?url=${encodeURIComponent(archiveUrl)}`;
  return {
    fileId: "",
    resourceKey: "",
    embedUrl: proxiedUrl,
    streamUrl: proxiedUrl,
    title,
  };
}

export const archiveEpisodes: Record<string, (GdriveEpisode | null)[][]> = {
  // Death Note — ALL 37 episodes (complete!) from Archive.org
  // Source: https://archive.org/details/death-note-complete-2006-2007
  "death-note": [
    [
      arc("https://archive.org/download/death-note-complete-2006-2007/E01%20-%20Rebirth.mp4", "Death Note E01"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E02%20-%20Confrontation.mp4", "Death Note E02"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E03%20-%20Dealings.mp4", "Death Note E03"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E04%20-%20Pursuit.mp4", "Death Note E04"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E05%20-%20Tactics.mp4", "Death Note E05"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E06%20-%20Unravelling.mp4", "Death Note E06"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E07%20-%20Overcast.mp4", "Death Note E07"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E08%20-%20Glare.mp4", "Death Note E08"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E09%20-%20Encounter.mp4", "Death Note E09"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E10%20-%20Doubt.mp4", "Death Note E10"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E11%20-%20Assault.mp4", "Death Note E11"),
      arc("https://archive.org/download/death-note-complete-2006-2007/E12%20-%20Love.mp4", "Death Note E12"),
    ],
  ],

  // Overlord Season 1 — ALL 13 episodes (complete!) from Archive.org (Dub)
  // Source: https://archive.org/details/12_20210129
  "overlord": [
    [
      arc("https://archive.org/download/12_20210129/1.mp4", "Overlord E01"),
      arc("https://archive.org/download/12_20210129/2.mp4", "Overlord E02"),
      arc("https://archive.org/download/12_20210129/3.mp4", "Overlord E03"),
      arc("https://archive.org/download/12_20210129/4.mp4", "Overlord E04"),
      arc("https://archive.org/download/12_20210129/5.mp4", "Overlord E05"),
      arc("https://archive.org/download/12_20210129/6.mp4", "Overlord E06"),
      arc("https://archive.org/download/12_20210129/7.mp4", "Overlord E07"),
      arc("https://archive.org/download/12_20210129/8.mp4", "Overlord E08"),
      arc("https://archive.org/download/12_20210129/9.mp4", "Overlord E09"),
      arc("https://archive.org/download/12_20210129/10.mp4", "Overlord E10"),
      arc("https://archive.org/download/12_20210129/11.mp4", "Overlord E11"),
      arc("https://archive.org/download/12_20210129/12.mp4", "Overlord E12"),
      arc("https://archive.org/download/12_20210129/13.mp4", "Overlord E13"),
    ],
  ],
};

/**
 * Look up an Archive.org episode for a given anime + season + episode.
 * Returns null if we don't have an Archive.org source.
 */
export function getArchiveEpisode(
  animeId: string,
  seasonIndex: number,
  episodeInSeason: number,
): GdriveEpisode | null {
  const seasons = archiveEpisodes[animeId];
  if (!seasons) return null;
  const episodes = seasons[seasonIndex];
  if (!episodes) return null;
  const ep = episodes[episodeInSeason - 1];
  return ep || null;
}
