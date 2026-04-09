/**
 * Synergy Engine — public API.
 *
 * The only file the rest of the app imports from this module.
 * All inputs are passed explicitly; this file has no global state.
 */
import type { PokemonType } from '../../types/pokemon';
import type { RoleTag } from '../../types/team';
import { scoreToTier, SYNERGY_WEIGHTS, USAGE_TIEBREAKER_WEIGHT, CREATIVITY_OFFMETA_BOOST, OFFMETA_USAGE_THRESHOLD } from './config';
import { computeDefensiveDetail } from './defensive';
import { explainPairSynergy, explainTeamSynergy } from './explainer';
import { computeOffensiveDetail } from './offensive';
import { computeRoleCompatibility, inferRoles } from './roles';
import { combosToScore, detectCombos } from './strategic';
import { ALL_TYPES, getOffensiveCoverage, getWeaknesses } from './typeUtils';
import type {
  PairSynergyResult,
  RoleCoverageReport,
  SuggestionResult,
  SynergyContext,
  TeamSynergyResult,
  TypeCoverageReport,
  PokemonWithRole,
} from './types';

// ─── Re-exports for consumers ─────────────────────────────────────────────────

export { inferRoles } from './roles';
export { detectAtypicalRole } from './roles';
export type {
  PokemonWithRole,
  PairSynergyResult,
  TeamSynergyResult,
  SuggestionResult,
  SynergyContext,
  SynergyTier,
  StrategicCombo,
  UsageEntry,
} from './types';

// ─── computePairSynergy ───────────────────────────────────────────────────────

/**
 * Computes the full synergy score for a pair of Pokémon.
 *
 * Combines defensive, offensive, role, and strategic sub-scores using the
 * weights defined in config.ts. Generates a plain-English explanation.
 */
export function computePairSynergy(
  a:       PokemonWithRole,
  b:       PokemonWithRole,
  context: SynergyContext,
): PairSynergyResult {
  const { typeChart } = context;

  // Sub-scores
  const defensiveDetail  = computeDefensiveDetail(a.types, b.types, typeChart);
  const offensiveDetail  = computeOffensiveDetail(a.offensiveTypes, b.offensiveTypes, typeChart);
  const roleScore        = computeRoleCompatibility(a.roles, b.roles);
  const combos           = detectCombos([a, b]);
  const strategicScore   = combosToScore(combos);

  // Weighted composite
  const totalScore =
    defensiveDetail.score * SYNERGY_WEIGHTS.defensive +
    offensiveDetail.score * SYNERGY_WEIGHTS.offensive +
    roleScore             * SYNERGY_WEIGHTS.roleCompatibility +
    strategicScore        * SYNERGY_WEIGHTS.strategicEnablement;

  const tier = scoreToTier(totalScore);

  // Sorted pair key for stable lookup.
  const pairKey = [a.slug, b.slug].sort().join('+');

  const result: Omit<PairSynergyResult, 'explanation'> = {
    pairKey,
    defensiveScore:  defensiveDetail.score,
    offensiveScore:  offensiveDetail.score,
    roleScore,
    strategicScore,
    totalScore,
    tier,
    defensiveDetail,
    offensiveDetail,
    combos,
  };

  const explanation = explainPairSynergy(
    result,
    a.slug, a.displayName,
    b.slug, b.displayName,
  );

  return { ...result, explanation };
}

// ─── computeTeamSynergy ───────────────────────────────────────────────────────

/**
 * Computes full synergy for a team of 2–6 Pokémon.
 *
 * Runs computePairSynergy for every pair, then aggregates into a team-level
 * result including type coverage and role coverage reports.
 */
export function computeTeamSynergy(
  team:    PokemonWithRole[],
  context: SynergyContext,
): TeamSynergyResult {
  if (team.length < 2) {
    // Not enough members to compute synergy — return a neutral result.
    return emptyTeamResult();
  }

  // Compute all pair scores.
  const pairScores: Record<string, PairSynergyResult> = {};
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const result = computePairSynergy(team[i], team[j], context);
      pairScores[result.pairKey] = result;
    }
  }

  // Overall score = mean of all pair scores.
  const scores       = Object.values(pairScores).map((r) => r.totalScore);
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const tier         = scoreToTier(overallScore);

  // Type coverage report.
  const typeCoverage = computeTypeCoverage(team, context);

  // Role coverage report.
  const roleCoverage = computeRoleCoverage(team, context);

  // All team-level combos (across all pairs, deduped).
  const combos = detectCombos(team);

  const partial = {
    pairScores,
    overallScore,
    tier,
    typeCoverage,
    roleCoverage,
    combos,
  };

  const explanation = explainTeamSynergy({ ...partial, explanation: '' });

  return { ...partial, explanation };
}

// ─── suggestNextMember ────────────────────────────────────────────────────────

/**
 * Given a partially-built team, ranks candidate Pokémon by how much they
 * improve the team's overall synergy.
 *
 * @param team        Current team members (1–5 placed members).
 * @param candidates  Pool of Pokémon to evaluate (filtered to legal by the caller).
 * @param context     Type chart, usage stats, regulation, creativity dial.
 * @returns           Sorted list of suggestions, best first.
 */
export function suggestNextMember(
  team:       PokemonWithRole[],
  candidates: PokemonWithRole[],
  context:    SynergyContext,
): SuggestionResult[] {
  const { usageStats, creativityFactor } = context;
  const usageMap = new Map(usageStats.map((u) => [u.speciesSlug, u.usagePercent]));

  const suggestions: SuggestionResult[] = candidates.map((candidate) => {
    // Average synergy of this candidate with all current team members.
    let totalScore = 0;
    const allCombos = detectCombos([...team, candidate]);

    if (team.length === 0) {
      // No team yet — score purely by breadth of the candidate itself.
      totalScore = 0.5; // neutral
    } else {
      for (const member of team) {
        const pair = computePairSynergy(candidate, member, context);
        totalScore += pair.totalScore;
      }
      totalScore /= team.length;
    }

    // Apply creativity dial: off-meta bonus for low-usage mons.
    const usage = usageMap.get(candidate.slug);
    if (usage !== undefined) {
      const isOffMeta = usage < OFFMETA_USAGE_THRESHOLD;
      if (isOffMeta && creativityFactor > 0) {
        totalScore += creativityFactor * CREATIVITY_OFFMETA_BOOST;
      } else if (!isOffMeta && creativityFactor < 0.5) {
        // Meta-leaning: small bump for popular picks.
        totalScore += (1 - creativityFactor) * USAGE_TIEBREAKER_WEIGHT * (usage / 100);
      }
    }

    totalScore = Math.min(1, Math.max(0, totalScore));
    const tier = scoreToTier(totalScore);

    // Infer the roles the candidate would fill.
    const rolesFilled = candidate.roles;

    // Simple explanation: best pair it forms.
    const bestPairResult = team.length > 0
      ? [...team].sort((a, b) => {
          const sA = computePairSynergy(candidate, a, context).totalScore;
          const sB = computePairSynergy(candidate, b, context).totalScore;
          return sB - sA;
        })[0]
      : null;

    const explanation = bestPairResult
      ? computePairSynergy(candidate, bestPairResult, context).explanation
      : `${candidate.displayName} is a solid starting pick.`;

    return {
      slug:         candidate.slug,
      displayName:  candidate.displayName,
      totalScore,
      tier,
      explanation,
      rolesFilled,
      usagePercent: usage,
    };
  });

  return suggestions.sort((a, b) => b.totalScore - a.totalScore);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function computeTypeCoverage(
  team:    PokemonWithRole[],
  context: SynergyContext,
): TypeCoverageReport {
  const { typeChart } = context;

  // Offensive: union of all types any team member can hit SE.
  const offensivelyCovered = new Set<PokemonType>();
  for (const mon of team) {
    for (const t of getOffensiveCoverage(mon.offensiveTypes, typeChart)) {
      offensivelyCovered.add(t);
    }
  }
  const offensivelyUncovered = ALL_TYPES.filter((t) => !offensivelyCovered.has(t));

  // Defensive: count how many team members are weak to each type.
  const weaknessCounts: Partial<Record<PokemonType, number>> = {};
  for (const mon of team) {
    for (const weakness of getWeaknesses(mon.types, typeChart)) {
      weaknessCounts[weakness] = (weaknessCounts[weakness] ?? 0) + 1;
    }
  }

  return {
    offensivelyCovered:   [...offensivelyCovered],
    offensivelyUncovered: offensivelyUncovered as PokemonType[],
    weaknessCounts,
  };
}

function computeRoleCoverage(
  team:    PokemonWithRole[],
  _context: SynergyContext,
): RoleCoverageReport {
  const roleCount: Partial<Record<RoleTag, number>> = {};
  for (const mon of team) {
    for (const role of mon.roles) {
      roleCount[role] = (roleCount[role] ?? 0) + 1;
    }
  }

  const present   = Object.keys(roleCount) as RoleTag[];
  const redundant = present.filter((r) => (roleCount[r] ?? 0) > 1);

  // "Missing" requires knowing the target archetype — left to the caller for now.
  // Archetype role templates live in src/engine/team/archetypes.ts (Tier 1 item).
  const missing: RoleTag[] = [];

  return { present, missing, redundant };
}

function emptyTeamResult(): TeamSynergyResult {
  return {
    pairScores:   {},
    overallScore: 0,
    tier:         'poor',
    typeCoverage: {
      offensivelyCovered:   [],
      offensivelyUncovered: [...ALL_TYPES] as PokemonType[],
      weaknessCounts:       {},
    },
    roleCoverage: { present: [], missing: [], redundant: [] },
    combos:       [],
    explanation:  'Add at least 2 Pokémon to see synergy analysis.',
  };
}
