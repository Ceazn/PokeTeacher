/**
 * All URLs the app reads from. Every remote dependency lives here.
 * The synergy-data repo (ceazn/synergy-data) publishes to GitHub Pages.
 * Update BASE_URL when the repo name or org changes — nothing else needs editing.
 */
const BASE_URL = 'https://ceazn.github.io/synergy-data';

export const ENDPOINTS = {
  /** Index of all known regulations (array of Regulation objects). */
  regulations:         `${BASE_URL}/regulations/index.json`,
  /** Species IDs currently legal in Pokémon Champions. */
  championsRoster:     `${BASE_URL}/champions-roster.json`,
  /** Stat / ability / move overrides for Champions-specific forms. */
  championsOverrides:  `${BASE_URL}/champions-overrides.json`,
  /** Weekly usage snapshots — interpolate regulation ID, e.g. "champions-m-a". */
  usageStats: (regulationId: string) =>
    `${BASE_URL}/usage/${regulationId}/latest.json`,
} as const;

/** Cache TTLs in milliseconds. */
export const CACHE_TTL = {
  regulations:     1000 * 60 * 60 * 6,   // 6 h — regs change rarely
  championsRoster: 1000 * 60 * 60 * 24,  // 24 h
  usageStats:      1000 * 60 * 60 * 24 * 7, // 7 days (updated weekly)
} as const;
