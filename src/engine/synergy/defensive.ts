/**
 * Defensive synergy scoring.
 *
 * Measures how well two Pokémon cover each other's type weaknesses.
 * Pure functions — no side effects, no DB access, no React.
 */
import type { PokemonType, TypeChart } from '../../types/pokemon';
import { SHARED_WEAKNESS_PENALTY } from './config';
import {
  ALL_TYPES,
  getDefensiveMultiplier,
  getWeaknesses,
  setIntersection,
} from './typeUtils';
import type { DefensiveDetail } from './types';

/**
 * Computes the defensive synergy between two Pokémon based on their types.
 *
 * The score reflects how much each Pokémon's weaknesses are covered by its
 * partner's resistances/immunities, penalised for shared weaknesses that
 * create common threats both members are vulnerable to.
 *
 * @returns DefensiveDetail with a `score` in [0, 1].
 */
export function computeDefensiveDetail(
  typesA:    PokemonType[],
  typesB:    PokemonType[],
  typeChart: TypeChart,
): DefensiveDetail {
  const weaknessesA = getWeaknesses(typesA, typeChart);
  const weaknessesB = getWeaknesses(typesB, typeChart);
  const sharedWeaknesses = setIntersection(weaknessesA, weaknessesB) as PokemonType[];

  // Count how many of A's weaknesses B resists (multiplier < 1 vs B's types).
  const aWeaknessCountCoveredByB = weaknessesA.filter(
    (t) => getDefensiveMultiplier(t, typesB, typeChart) < 1,
  ).length;

  // Count how many of B's weaknesses A resists.
  const bWeaknessCountCoveredByA = weaknessesB.filter(
    (t) => getDefensiveMultiplier(t, typesA, typeChart) < 1,
  ).length;

  const totalWeaknesses = weaknessesA.length + weaknessesB.length;

  // Base coverage ratio: what fraction of the combined weakness pool is covered?
  const coverageRatio = totalWeaknesses > 0
    ? (aWeaknessCountCoveredByB + bWeaknessCountCoveredByA) / totalWeaknesses
    : 1;

  // Shared weakness fraction (relative to the average weakness count per mon).
  const avgWeaknessCount = totalWeaknesses / 2;
  const sharedFraction = avgWeaknessCount > 0
    ? sharedWeaknesses.length / avgWeaknessCount
    : 0;

  // Penalty scales with how many weaknesses are shared — a pair that shares
  // every weakness is punished up to SHARED_WEAKNESS_PENALTY off the score.
  const penalty = sharedFraction * SHARED_WEAKNESS_PENALTY;

  const score = clamp(coverageRatio - penalty);

  return {
    aCoveredByB: weaknessesA.length > 0
      ? aWeaknessCountCoveredByB / weaknessesA.length
      : 1,
    bCoveredByA: weaknessesB.length > 0
      ? bWeaknessCountCoveredByA / weaknessesB.length
      : 1,
    sharedWeaknesses,
    score,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function clamp(x: number): number {
  return Math.max(0, Math.min(1, x));
}
