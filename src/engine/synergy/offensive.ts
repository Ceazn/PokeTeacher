/**
 * Offensive synergy scoring.
 *
 * Measures how well two Pokémon's offensive types complement each other —
 * i.e. whether together they can threaten a wide variety of opposing types.
 *
 * Pure functions — no side effects, no DB access, no React.
 */
import type { PokemonType, TypeChart } from '../../types/pokemon';
import { OFFENSIVE_GAP_FILL_BONUS } from './config';
import { ALL_TYPES, getOffensiveCoverage, setDifference } from './typeUtils';
import type { OffensiveDetail } from './types';

/**
 * Computes the offensive coverage synergy between two Pokémon.
 *
 * The score rewards:
 *   1. Total breadth — how many of the 18 types the pair threatens SE.
 *   2. Gap-filling — whether B covers types that A cannot, and vice versa.
 *
 * @param offensiveTypesA  Types of moves A uses offensively (STAB or known coverage).
 * @param offensiveTypesB  Types of moves B uses offensively.
 * @returns OffensiveDetail with a `score` in [0, 1].
 */
export function computeOffensiveDetail(
  offensiveTypesA: PokemonType[],
  offensiveTypesB: PokemonType[],
  typeChart:       TypeChart,
): OffensiveDetail {
  const seTypesA = getOffensiveCoverage(offensiveTypesA, typeChart);
  const seTypesB = getOffensiveCoverage(offensiveTypesB, typeChart);

  const combinedSE = new Set([...seTypesA, ...seTypesB]);
  const uncoveredTypes = ALL_TYPES.filter((t) => !combinedSE.has(t)) as PokemonType[];

  // Gap-filling: types covered by B but not A, and vice versa.
  const bFillsAGaps = setDifference(seTypesB, seTypesA) as PokemonType[];
  const aFillsBGaps = setDifference(seTypesA, seTypesB) as PokemonType[];
  const uniqueGapsFilled = [...new Set([...bFillsAGaps, ...aFillsBGaps])] as PokemonType[];

  // Base coverage score: fraction of 18 types the pair can hit SE.
  const coverageScore = combinedSE.size / ALL_TYPES.length;

  // Gap-fill bonus: reward pairs where each covers the other's blind spots.
  // Normalised so filling all 18 types exclusively gives the max bonus.
  const gapFillScore =
    (bFillsAGaps.length + aFillsBGaps.length) /
    (ALL_TYPES.length * 2);
  const gapBonus = gapFillScore * OFFENSIVE_GAP_FILL_BONUS;

  const score = Math.min(1, coverageScore + gapBonus);

  return {
    seTypesA,
    seTypesB,
    uniqueGapsFilled,
    uncoveredTypes,
    score,
  };
}
