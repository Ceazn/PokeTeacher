/**
 * Shared type-chart utilities used by the defensive and offensive modules.
 * Pure functions — no side effects.
 */
import type { PokemonType, TypeChart } from '../../types/pokemon';

export const ALL_TYPES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

/**
 * Returns the combined defensive damage multiplier for `attackType` against
 * a Pokémon with the given `defendingTypes`.
 * Handles dual typing by multiplying both matchups together.
 */
export function getDefensiveMultiplier(
  attackType:     PokemonType,
  defendingTypes: PokemonType[],
  typeChart:      TypeChart,
): number {
  return defendingTypes.reduce(
    (mult, defType) => mult * (typeChart[attackType]?.[defType] ?? 1),
    1,
  );
}

/**
 * Returns all attacking types that deal super-effective damage (multiplier > 1)
 * against a Pokémon with the given types.
 */
export function getWeaknesses(
  types:     PokemonType[],
  typeChart: TypeChart,
): PokemonType[] {
  return ALL_TYPES.filter(
    (atk) => getDefensiveMultiplier(atk, types, typeChart) > 1,
  );
}

/**
 * Returns all attacking types that deal less-than-normal damage (multiplier < 1)
 * against a Pokémon with the given types.
 * Includes both resists (0.5×, 0.25×) and immunities (0×).
 */
export function getResistances(
  types:     PokemonType[],
  typeChart: TypeChart,
): PokemonType[] {
  return ALL_TYPES.filter(
    (atk) => getDefensiveMultiplier(atk, types, typeChart) < 1,
  );
}

/**
 * Returns the set of defending types hit super-effectively by any of the
 * given `attackingTypes`.
 *
 * Used to model offensive STAB coverage: what types can this Pokémon threaten?
 */
export function getOffensiveCoverage(
  attackingTypes: PokemonType[],
  typeChart:      TypeChart,
): PokemonType[] {
  const covered = new Set<PokemonType>();
  for (const atk of attackingTypes) {
    for (const def of ALL_TYPES) {
      if ((typeChart[atk]?.[def] ?? 1) > 1) {
        covered.add(def);
      }
    }
  }
  return [...covered];
}

/** Returns types present in `a` that are not present in `b`. */
export function setDifference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((x) => !setB.has(x));
}

/** Returns types present in both `a` and `b`. */
export function setIntersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}
