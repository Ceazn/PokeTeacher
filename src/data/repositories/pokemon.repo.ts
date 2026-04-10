/**
 * Pokémon repository — reads the champion-legal species list.
 *
 * Primary path: SELECT from `pokemon` WHERE in_champions = 1.
 * Fallback path: when the DB has not been seeded yet (empty pokemon table),
 *   insert the 10 fixture entries so FK constraints work, then return them.
 *
 * The seeding writes speciesIds 1001-1010 into the DB exactly once; on all
 * subsequent calls the SELECT will find those rows and the fallback is skipped.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { PickerEntry } from '../../types/picker';
import type { PokemonWithRole } from '../../engine/synergy/types';
import type { PokemonRow } from '../db/schema';
import { FIXTURE_PICKER_ENTRIES } from '../fixtures/pokemon';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all Pokémon available in the current Champions regulation.
 * Falls back to fixture data with auto-seeding when the DB is empty.
 */
export async function getChampionsPokemon(db: SQLiteDatabase): Promise<PickerEntry[]> {
  const rows = await db.getAllAsync<PokemonRow>(
    `SELECT * FROM pokemon WHERE in_champions = 1 ORDER BY display_name ASC`,
  );

  if (rows.length > 0) {
    return rows.map(rowToPickerEntry);
  }

  // DB is unseeded — insert fixtures so FK constraints are satisfied when
  // team_members rows reference these species IDs.
  await seedFixtures(db);
  return FIXTURE_PICKER_ENTRIES;
}

// ─── Seeding ──────────────────────────────────────────────────────────────────

async function seedFixtures(db: SQLiteDatabase): Promise<void> {
  for (const entry of FIXTURE_PICKER_ENTRIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO pokemon
         (id, name, display_name, types, base_stats, abilities, egg_groups,
          sprite_url, in_champions, data_version, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'fixture', ?)`,
      [
        entry.speciesId,
        entry.slug,
        entry.pokemon.displayName,
        JSON.stringify(entry.pokemon.types),
        JSON.stringify(entry.pokemon.baseStats),
        JSON.stringify([]),   // abilities: empty; engine uses abilityTags from fixtures
        JSON.stringify([]),   // egg_groups: unused by this app
        null,                 // sprite_url
        Date.now(),
      ],
    );
  }
}

// ─── Row mapping ──────────────────────────────────────────────────────────────

function rowToPickerEntry(row: PokemonRow): PickerEntry {
  const types  = JSON.parse(row.types)  as string[];
  const stats  = JSON.parse(row.base_stats) as PokemonWithRole['baseStats'];

  const pokemon: PokemonWithRole = {
    slug:           row.name,
    displayName:    row.display_name,
    types:          types as PokemonWithRole['types'],
    offensiveTypes: types as PokemonWithRole['types'],  // STAB assumption
    baseStats:      stats,
    abilityTags:    [],
    moveTags:       [],
    roles:          [],
    teraType:       null,
  };

  return {
    speciesId: row.id,
    slug:      row.name,
    pokemon,
    spriteUrl: row.sprite_url ?? null,
    usagePct:  null,  // populated separately from usage_stats table
  };
}
