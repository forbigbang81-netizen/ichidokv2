/**
 * Google Drive episode sources — maps anime + season + episode to a Google
 * Drive embed URL when we have one.
 *
 * These are real Google Drive video files in public folders. The embed URL
 * loads Google's own video player in an iframe — no CORS issues, no third-
 * party dependencies, no gdriveplayer.
 *
 * To add more: extract file IDs from a public Drive folder using
 * scripts/extract_gdrive_folder.py, then add entries here.
 */
export type GdriveEpisode = {
  fileId: string;
  resourceKey: string;
  embedUrl: string;
  /** Our server-side proxy URL that streams the video bytes (bypasses virus scan + CORS). */
  streamUrl: string;
  title?: string;
};

// Helper to build an episode entry
function ep(fileId: string, resourceKey: string, title: string): GdriveEpisode {
  return {
    fileId,
    resourceKey,
    embedUrl: resourceKey
      ? `https://drive.google.com/file/d/${fileId}/preview?resourcekey=${resourceKey}`
      : `https://drive.google.com/file/d/${fileId}/preview`,
    streamUrl: `/api/drive-stream?id=${fileId}${resourceKey ? `&resourcekey=${resourceKey}` : ""}`,
    title,
  };
}

export const gdriveEpisodes: Record<string, (GdriveEpisode | null)[][]> = {
  // Attack on Titan Season 1 (Dub) — all 25 episodes
  // Source folder: https://drive.google.com/drive/folders/0BwNIVETrodXLQ3V1b083NmVQRk0
  "attack-on-titan": [
    [
      ep("0BwNIVETrodXLaVdqNWdoaHBxMWM", "0-gcUfOSq_CXPtQe4tLFq2WQ", "Attack on Titan S1 E01 (Dub)"),
      ep("0BwNIVETrodXLWThlQWRyaGFQSG8", "0-uJHpkOoC7X49MQKCtYTL0Q", "Attack on Titan S1 E02 (Dub)"),
      ep("0BwNIVETrodXLVUFqdG5vMDJCWmc", "0-_SlkHLCrYKzdmV6RwcybFw", "Attack on Titan S1 E03 (Dub)"),
      ep("0BwNIVETrodXLY2dHaDFaUGxIeE0", "0-z6uSLmIWQZ8mOv-ML0Wv6g", "Attack on Titan S1 E04 (Dub)"),
      ep("0BwNIVETrodXLTUpuYzNWN3R1X2M", "0-S2YV5szi6e4UBtP3NHeM_Q", "Attack on Titan S1 E05 (Dub)"),
      ep("0BwNIVETrodXLeDhNQ3ZTUHR2cmc", "0-4vqk8FvT5Yl61jUil7hZBA", "Attack on Titan S1 E06 (Dub)"),
      ep("0BwNIVETrodXLcmoyeGZhNzhhaHM", "0-lRLGyOG0aJ2kQovLtbnGTw", "Attack on Titan S1 E07 (Dub)"),
      ep("0BwNIVETrodXLUGNfWGhBV0tKeVE", "0-PYmRDlrQC8LwoJb8i1FIwQ", "Attack on Titan S1 E08 (Dub)"),
      ep("0BwNIVETrodXLdTJLZ0NicFgxdUE", "0-JJ5teGHRbXXfTjyeGBbRDQ", "Attack on Titan S1 E09 (Dub)"),
      ep("0BwNIVETrodXLRUNWQmtrdTM2dmc", "0-gNYsGsTG4JbimsMXZQiJOQ", "Attack on Titan S1 E10 (Dub)"),
      ep("0BwNIVETrodXLSm1qUk1XbjhtcXc", "0-VJsE_Wfk2syQ8ai83D9DzQ", "Attack on Titan S1 E11 (Dub)"),
      ep("0BwNIVETrodXLRGgwdUI0Nm4telk", "0-4NLSKuKLdvFX8y_wUa0jwg", "Attack on Titan S1 E12 (Dub)"),
      ep("0BwNIVETrodXLNlhZX3ZSbjlpVnc", "0-YLY3mRjvzfKHpEHtQIqUww", "Attack on Titan S1 E13 (Dub)"),
      ep("0BwNIVETrodXLYkNFWGFobmdfTmM", "0-N7kB_O8UQYpWnR2HGMFJPA", "Attack on Titan S1 E14 (Dub)"),
      ep("0BwNIVETrodXLZjJURXA1ZjFpaDQ", "0-CbHSA8GfIqh2tVAXCXgo6Q", "Attack on Titan S1 E15 (Dub)"),
      ep("0BwNIVETrodXLc0pjUzJsaUtXSjg", "0-zRDWCWHuftCRhczcSvmeMA", "Attack on Titan S1 E16 (Dub)"),
      ep("0BwNIVETrodXLWGQtWWg1NTVfODg", "0-xhd5ksco4wfhSXyANVF_FA", "Attack on Titan S1 E17 (Dub)"),
      ep("0BwNIVETrodXLX1hrWWl1cndQWVU", "0-B3vSmDwV52nV1sV7xBWajQ", "Attack on Titan S1 E18 (Dub)"),
      ep("0BwNIVETrodXLdDNSOHVkNXg0SWM", "0-D9WSZV2rrZ57kCsIzZPd5Q", "Attack on Titan S1 E19 (Dub)"),
      ep("0BwNIVETrodXLUldXQTBLS1hqMTQ", "0-r-14nrUfr_C7OQ0ScUaRxA", "Attack on Titan S1 E20 (Dub)"),
      ep("0BwNIVETrodXLem5VQ3BxYUQ0Tms", "0-FGlvRs20gxgwgzJ9mIXuoA", "Attack on Titan S1 E21 (Dub)"),
      ep("0BwNIVETrodXLMFNBUlNBeVN1S28", "0-1A8vEsLUknMDfes_-UZk6w", "Attack on Titan S1 E22 (Dub)"),
      ep("0BwNIVETrodXLRl91R3Y3VC00Y2M", "0-XY-j4qiZQTfo34sLCxEiYw", "Attack on Titan S1 E23 (Dub)"),
      ep("0BwNIVETrodXLa1JJbnFZaVUxWW8", "0-ISgyMSxqlC9S3ePgay4X9g", "Attack on Titan S1 E24 (Dub)"),
      ep("0BwNIVETrodXLaWFCTHpjTUstdG8", "0-Qt9_uv6kpDv0M_VyC5tXdg", "Attack on Titan S1 E25 (Dub)"),
    ],
  ],

  // Tokyo Ghoul √A (Season 2) — episodes 7, 10, 11, 12
  // Source folder: https://drive.google.com/drive/folders/1WJsrt0WiCV0sC19xIJSidQzkMJQtQHDN
  // (only 4 of 12 episodes available; others fall back to gdriveplayer)
  "tokyo-ghoul-a": [
    [
      null, // Ep 1 — no Drive source, falls back to gdriveplayer
      null, // Ep 2
      null, // Ep 3
      null, // Ep 4
      null, // Ep 5
      null, // Ep 6
      ep("1Z7vER03_xx306UrX8lEaXCZpN0WjYrka", "", "Tokyo Ghoul √A E07"), // Ep 7
      null, // Ep 8
      null, // Ep 9
      ep("1Yon0zwzwlLzkmdr3ndWWsJQeYD7WwOwV", "", "Tokyo Ghoul √A E10"), // Ep 10
      ep("19dozQoiKprOngPLSUwcR07r4GutKV2g1", "", "Tokyo Ghoul √A E11"), // Ep 11
      ep("1eNNc6yhuwNXXg0sUtgrl9CEwOGYAXJRv", "", "Tokyo Ghoul √A E12"), // Ep 12
    ],
  ],

  // Death Note Season 1 — 7 of 12 episodes (1080p Dual Audio)
  // Source: https://drive.google.com/drive/folders/166tNe4UUWgYROWK4DwhtZKxgrpFZZAm5
  "death-note": [
    [
      null,
      null,
      ep("1urqp5FB98tPtfwbHLm1uNKuQEkmARpJK", "", "Death Note E03"),
      ep("1m317hzYib_At1EFS30cI_KUEIVhvs4Kf", "", "Death Note E04"),
      ep("1QPyCQWXXD_fpLMvYMvJJaZyUqOD7Xp6_", "", "Death Note E05"),
      ep("1RjLVjMuoGMvchl3bH2ApeUMvD9g36syh", "", "Death Note E06"),
      null,
      null,
      ep("1p6vaJjEJRLJvvKmNddymbPDHwzvtwkY3", "", "Death Note E09"),
      ep("1rwyQb5zpWNvgfLDVDrUuKn03aXqGmgS7", "", "Death Note E10"),
      ep("1sdus11t1EvVMv300QIfCMv6EtX2WxaRw", "", "Death Note E11"),
    ],
  ],

  // Psycho-Pass Season 1 — 14 of 22 episodes (1080p Dual Audio)
  // Source: https://drive.google.com/drive/folders/1G_sAIRGTRWHN0o7qYXX5MetybiCmMXiv
  "psychopass": [
    [
      ep("1l1MxVD7Op8ObnCGOuLCotgID5yT_9Ntp", "", "Psycho-Pass E01"),
      ep("1F7C8ELtkCOmufIwCa0O44zlScj95Qs26", "", "Psycho-Pass E02"),
      null,
      null,
      null,
      ep("1muVqCCxxE9ZaohTmQhD5SBAYzXv61P9O", "", "Psycho-Pass E06"),
      ep("1AY00BhOztHVYxbYc4yRQlszmd07SadPm", "", "Psycho-Pass E07"),
      ep("1lrA_p9WWb_nV9t6cL8smxli8mvuPeVQN", "", "Psycho-Pass E08"),
      ep("1ZWl_1ZBjzelXyFSdmYvRrjiUznlWM63T", "", "Psycho-Pass E09"),
      ep("1ZAXULEmCglprsORNVCQjW9X7NNerrsvm", "", "Psycho-Pass E10"),
      ep("1z7gsVH3S3CI8gcMKEygFqnFVqEsO79GB", "", "Psycho-Pass E11"),
      null,
      null,
      ep("19lWe2JYU8sg6poUXi3f6kaZVyL5cHK5A", "", "Psycho-Pass E14"),
      ep("1y2wK0sd6f_R4oSg22mqmQelBp78GBWDA", "", "Psycho-Pass E15"),
      null,
      null,
      ep("1vnTjyWl_9mfcsfMx_76aYeJXqh0umI5B", "", "Psycho-Pass E18"),
      ep("1Coi4CFWkxJVpym_kPgCR_2LOzuhNCsqn", "", "Psycho-Pass E19"),
      ep("1veNL8rKgApSjSVc7nl1ud_hDwFJQNKMh", "", "Psycho-Pass E20"),
      ep("1Ea3wOBCNrH3y4y4Hh0raAcasxcGd_Qji", "", "Psycho-Pass E21"),
    ],
  ],

  // Puella Magi Madoka Magica Season 1 — 5 of 12 episodes + Rebellion movie (BD 1080p)
  // Source: https://drive.google.com/drive/folders/1xLRToaeAOZiOPf26Y7qCE_VWCYMtZV8T
  "mahou-shoujo-madokamagica": [
    [
      null, // Ep 1
      null, // Ep 2
      null, // Ep 3
      ep("190G34Cw6jJrV2Ne45i5eT5OkhYz5P_je", "", "Madoka Magica E04"), // Ep 4
      null, // Ep 5
      null, // Ep 6
      ep("1TOsDhVZczTyWl8ke1hWF4hOxJOTRKnyK", "", "Madoka Magica E07"), // Ep 7
      ep("1XMAZniuzPUR0HoL327C0465Bhz8nmiUp", "", "Madoka Magica E08"), // Ep 8
      ep("1l2lhMlXnYLppgFu5K7xvBVA_GeA44FQp", "", "Madoka Magica E09"), // Ep 9
      ep("1jBieamf79YDTmkzEcPVBJaQTjyU1aOi8", "", "Madoka Magica E10"), // Ep 10
      null, // Ep 11
      null, // Ep 12
    ],
  ],

  // Puella Magi Madoka Magica the Movie: Rebellion (BD 1080p)
  "mahou-shoujo-madokamagica-movie-3-hangyaku-no-monogatari": [
    [
      ep("14tSEHlC6vt67KymPutWdYGbnZgXgVZIk", "", "Madoka Magica: Rebellion Movie"),
    ],
  ],

  // Overlord Season 1 — 10 of 13 episodes
  // Source: https://drive.google.com/drive/folders/1nopLk3ascFJldV9RYSvDF6Ir-EL97XgJ
  "overlord": [
    [
      ep("1bDHOKTJuW85z1i1Ix8VId8jPNh8uCQHW", "", "Overlord E01"),
      ep("1OsMQGMRywWlep6jih26t9sueg2VMmbEm", "", "Overlord E02"),
      null, // Ep 3
      ep("1ER_sTxR85Ve6xiklpTSDkuHHudaS3liS", "", "Overlord E04"),
      ep("1B22A4b_e2d8S85uHboZoJiARbhAo4dwO", "", "Overlord E05"),
      ep("118xlw6ba6sy6uEcG0NbKh3aX10_yFayj", "", "Overlord E06"),
      ep("1QKirtJwC6eOIf_lvaB8XhnSsqlEHddHt", "", "Overlord E07"),
      ep("1xXPSlFVa227vv9Zt6kIbqOLWJluWNyhG", "", "Overlord E08"),
      ep("1rZ9rH_AHm3ldQeQ9KhVUnAqo1Sh05qps", "", "Overlord E09"),
      ep("1Rb6Oe9hPJubTa2gfyPSQnchetnlpHpqt", "", "Overlord E10"),
      null, // Ep 11
      ep("1QWkxJdyDHZfAxN2m0aOsI9qVnJD75Dw9", "", "Overlord E12"),
      null, // Ep 13
    ],
  ],

  // Naruto — Season 0 (Prologue / Land of Waves Arc, eps 1-19)
  // Source: https://drive.google.com/drive/folders/1gDzL8p8wG8P4R21kMJmQ2sDcKc2SuQlf
  "naruto": [
    [
      ep("1FN1n99bBiFiQA8YzSFy0rBnsao87luVw", "", "Naruto E01"),
      ep("1PPmDsJVWqNgKKiCfxYuSO2oFJaMjS5dY", "", "Naruto E02"),
      ep("1DqM1k6Tk1UcPGxTOcGSpS4hevxAQ9K3z", "", "Naruto E03"),
      null, // Ep 4
      null, // Ep 5
      null, // Ep 6
      ep("1YtthnSrlXgR_ELWF5xd1B4MtYgU3lone", "", "Naruto E07"),
      null, // Ep 8
      null, // Ep 9
      null, // Ep 10
      ep("1nuzJuAe74aC9Nj61RHJczAB4xjRwMqXx", "", "Naruto E11"),
      null, // Ep 12
      null, // Ep 13
      ep("1uUldZn5QTn3YzmY1xv6Ai9mLWgp5PlFT", "", "Naruto E14"),
      null, // Ep 15
      null, // Ep 16
      ep("1cnysnMdtMgqdm3pkHrP_hqnP8vLSTxUA", "", "Naruto E17"),
      null, // Ep 18
      ep("1uP0nvGrKLvfMuydG3bqwrw2Rl5NUvcPs", "", "Naruto E19"),
    ],
    // Season 1 (Chunin Exam Arc, eps 20-60)
    [
      null, // Ep 1 (20)
      null, // Ep 2 (21)
      null, // Ep 3 (22)
      null, // Ep 4 (23)
      null, // Ep 5 (24)
      null, // Ep 6 (25)
      null, // Ep 7 (26)
      null, // Ep 8 (27)
      ep("18c1nDYpuNhEi0jkyBlYmeTDyUjejwenT", "", "Naruto E28"), // Ep 9 (28)
      ep("1_PJoV4IuryOhHixKhB3MeIkaeqMRqiG9", "", "Naruto E29"), // Ep 10 (29)
      ep("1UZPaY_JkPbiIcA8kmYQR8FByMze8YuCG", "", "Naruto E30"), // Ep 11 (30)
      ep("1rlErkBT9XFFAb1HtKrNsJJ0s_tDN90yP", "", "Naruto E31"), // Ep 12 (31)
      null, // Ep 13 (32)
      ep("102PsMFd4DdLilwRPGHwtnXHE4IknVSuM", "", "Naruto E33"), // Ep 14 (33)
      null, // Ep 15 (34)
      ep("1nDXdNQsYmtKuf2s7XwMcdL_ZTD1bFa_7", "", "Naruto E35"), // Ep 16 (35)
      null, // Ep 17 (36)
      null, // Ep 18 (37)
      null, // Ep 19 (38)
      ep("1YBdF5CYUpW8D2BAQ7SUBSo4wHoOlVtsD", "", "Naruto E39"), // Ep 20 (39)
      null, // Ep 21 (40)
      null, // Ep 22 (41)
      null, // Ep 23 (42)
      null, // Ep 24 (43)
      null, // Ep 25 (44)
      null, // Ep 26 (45)
      null, // Ep 27 (46)
      null, // Ep 28 (47)
      ep("1uCBNLpGCaJC21RKhTKsvCXliyOOf54PJ", "", "Naruto E48"), // Ep 29 (48)
      ep("1rKK7ntnkJw7sJremJHY9GZ1v_qKtQvrA", "", "Naruto E49"), // Ep 30 (49)
    ],
  ],
};

/**
 * Look up a Google Drive episode for a given anime + season + episode.
 * Returns null if we don't have a Google Drive source for this episode
 * (or if the episode slot exists but is null — meaning we only have
 * partial coverage for that season).
 */
export function getGdriveEpisode(
  animeId: string,
  seasonIndex: number,
  episodeInSeason: number,
): GdriveEpisode | null {
  const seasons = gdriveEpisodes[animeId];
  if (!seasons) return null;
  const episodes = seasons[seasonIndex];
  if (!episodes) return null;
  // episodeInSeason is 1-indexed
  const ep = episodes[episodeInSeason - 1];
  return ep || null;
}
