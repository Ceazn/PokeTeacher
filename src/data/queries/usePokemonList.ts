/**
 * TanStack Query hook for the champion-legal Pokémon list.
 *
 * Data comes from pokemon.repo.ts which queries the SQLite cache and falls
 * back to fixture data (with auto-seeding) when the DB is empty.
 */
import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '../db';
import { getChampionsPokemon } from '../repositories/pokemon.repo';
import type { PickerEntry } from '../../types/picker';

export const POKEMON_KEYS = {
  champions: () => ['pokemon', 'champions'] as const,
} as const;

/**
 * Returns all Pokémon legal in the current Champions regulation.
 * Stale-while-revalidate — refreshes when the app regains focus.
 */
export function usePokemonList() {
  return useQuery<PickerEntry[]>({
    queryKey: POKEMON_KEYS.champions(),
    queryFn:  async () => {
      const db = await getDatabase();
      return getChampionsPokemon(db);
    },
    staleTime: 5 * 60 * 1000,  // 5 min — species data doesn't change often
  });
}
