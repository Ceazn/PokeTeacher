/** Which game this regulation applies to. */
export type Game = 'champions';

/** Which gimmicks are active in this format. */
export interface Gimmicks {
  mega:    boolean;
  tera:    boolean;
  dynamax: boolean;
  zMove:   boolean;
}

export interface TeamSizeConfig {
  min:         number; // minimum Pokémon to register
  max:         number; // maximum Pokémon to register (usually 6)
  battleSize:  number; // Pokémon brought per game (usually 4 in VGC)
}

/**
 * How the legal species pool is determined before bans are applied.
 *
 *  "champions-roster" — filter to the champions-roster.json ID list
 *  "national-dex"     — all species in PokéAPI
 *  string[]           — explicit allowlist of species slugs
 */
export type SpeciesSource = 'champions-roster' | 'national-dex' | string[];

/** Single regulation object. Matches the JSON shape hosted in synergy-data. */
export interface Regulation {
  id:            string;        // "champions-m-a"
  displayName:   string;        // "Pokémon Champions Regulation M-A"
  game:          Game;
  format:        'doubles' | 'singles';
  levelCap:      number;
  teamSize:      TeamSizeConfig;
  speciesSource: SpeciesSource;
  speciesBanlist:   string[];   // species slugs
  restrictedPool:   string[];   // legendaries etc. with per-team limits
  restrictedLimit:  number;     // how many from restrictedPool allowed per team
  itemBanlist:      string[];
  moveBanlist:      string[];
  clauseList:       string[];   // "species-clause" | "sleep-clause" etc.
  gimmicks:         Gimmicks;
  effectiveFrom:    string;     // ISO date "2026-04-01"
  effectiveTo:      string | null;
  source:           string;     // URL to official announcement
  notes:            string;
}

/** Cached regulation row as stored in SQLite. */
export interface RegulationRow {
  id:          string;
  displayName: string;
  data:        string;  // JSON-serialised Regulation
  isActive:    number;  // SQLite boolean (0 | 1)
  fetchedAt:   number;  // Unix ms
  sourceUrl:   string | null;
}
