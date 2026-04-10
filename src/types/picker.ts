import type { PokemonWithRole } from '../engine/synergy/types';

/**
 * A single row in the Pokémon picker list.
 *
 * Produced by the pokemon repository — either from the SQLite cache or from
 * the built-in fixture data when the DB has not been seeded yet.
 */
export interface PickerEntry {
  speciesId: number;
  slug:      string;
  pokemon:   PokemonWithRole;
  spriteUrl: string | null;
  /** Usage percent from the most recent usage-stats snapshot, or null. */
  usagePct:  number | null;
}
