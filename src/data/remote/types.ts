/**
 * Wire types for JSON payloads served from the synergy-data GitHub Pages repo.
 * These match the JSON shape exactly; the repository layer maps them to domain types.
 */

import type { Regulation } from '../../types/regulation';

/** Shape of regulations/index.json */
export interface RemoteRegulationsIndex {
  schemaVersion: number;
  regulations:   Regulation[];
}

/** Shape of champions-roster.json */
export interface RemoteChampionsRoster {
  schemaVersion: number;
  lastUpdated:   string;      // ISO date
  source:        string;
  speciesSlugs:  string[];    // slug strings, e.g. "great-tusk"
}

/** A single override entry in champions-overrides.json */
export interface RemoteChampionsOverride {
  speciesId:    number;
  formName:     string;
  displayName:  string;
  types?:       string[];
  baseStats?:   { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  abilities?:   Array<{ name: string; slot: number; isHidden: boolean }>;
  notes:        string;
}

/** Shape of champions-overrides.json */
export interface RemoteChampionsOverrides {
  schemaVersion: number;
  lastUpdated:   string;
  overrides:     RemoteChampionsOverride[];
}
