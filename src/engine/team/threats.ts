/**
 * Threat detection for a team.
 *
 * Surfaces the most dangerous attacking types given the team's defensive
 * profile, optionally weighted by meta-usage so common threats appear first.
 *
 * Pure functions — no side effects, no DB access, no React.
 */
import type { PokemonType, TypeChart } from '../../types/pokemon';
import type { UsageEntry } from '../synergy/types';
import { ALL_TYPES, getDefensiveMultiplier } from '../synergy/typeUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThreatEntry {
  /** Attacking type that threatens the team. */
  type:           PokemonType;
  /** Number of team members hit super-effectively (2× or 4×) by this type. */
  weakCount:      number;
  /** Number of team members immune (0×) to this type. */
  immuneCount:    number;
  /**
   * Exposure score — higher means more threatening.
   * Formula: sum of (multiplier − 1) for each member × optional usage weight.
   */
  exposureScore:  number;
  /** The slugs of members that are weak to this type. */
  weakSlugs:      string[];
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Computes the top-N threatening types against the team.
 *
 * @param memberTypes    Defensive types for each team member (outer = member, inner = types)
 * @param memberSlugs    Corresponding member slugs (same order)
 * @param typeChart      Standard type chart
 * @param usageStats     Optional usage data to weight common threats higher
 * @param topN           Maximum entries returned (default 5)
 * @param usageWeight    How much usage data biases scores (0 = ignore, 1 = full weight, default 0.3)
 */
export function detectTopThreats(
  memberTypes:  PokemonType[][],
  memberSlugs:  string[],
  typeChart:    TypeChart,
  usageStats:   UsageEntry[] = [],
  topN:         number = 5,
  usageWeight:  number = 0.3,
): ThreatEntry[] {
  const usageMap = buildUsageMap(usageStats);

  const entries: ThreatEntry[] = [];

  for (const attackType of ALL_TYPES) {
    let weakCount   = 0;
    let immuneCount = 0;
    let rawExposure = 0;
    const weakSlugs: string[] = [];

    for (let i = 0; i < memberTypes.length; i++) {
      const multiplier = getDefensiveMultiplier(attackType, memberTypes[i], typeChart);

      if (multiplier === 0) {
        immuneCount++;
      } else if (multiplier > 1) {
        weakCount++;
        rawExposure += multiplier - 1; // 2× contributes 1, 4× contributes 3
        weakSlugs.push(memberSlugs[i]);
      }
    }

    if (weakCount === 0) continue; // type doesn't threaten anyone

    // Optionally bias by usage: multiply by (1 + usageWeight × usagePercent/100)
    const usage  = usageMap.get(attackType.toLowerCase()) ?? 0;
    const usageMult = 1 + usageWeight * (usage / 100);
    const exposureScore = rawExposure * usageMult;

    entries.push({ type: attackType, weakCount, immuneCount, exposureScore, weakSlugs });
  }

  // Sort by exposure descending, then weakCount, then alphabetical for stability
  entries.sort((a, b) =>
    b.exposureScore - a.exposureScore ||
    b.weakCount - a.weakCount ||
    a.type.localeCompare(b.type),
  );

  return entries.slice(0, topN);
}

/**
 * Summarises whether a type is "covered" (at least one immunity or resistance
 * on the team) or "exposed" (all members neutral or weak).
 */
export function typeCoverageMap(
  memberTypes: PokemonType[][],
  typeChart:   TypeChart,
): Partial<Record<PokemonType, 'immune' | 'resisted' | 'neutral' | 'weak'>> {
  const result: Partial<Record<PokemonType, 'immune' | 'resisted' | 'neutral' | 'weak'>> = {};

  for (const attackType of ALL_TYPES) {
    const multipliers = memberTypes.map((types) =>
      getDefensiveMultiplier(attackType, types, typeChart),
    );

    if (multipliers.some((m) => m === 0)) {
      result[attackType] = 'immune';
    } else if (multipliers.some((m) => m < 1)) {
      result[attackType] = 'resisted';
    } else if (multipliers.every((m) => m > 1)) {
      result[attackType] = 'weak';
    } else {
      result[attackType] = 'neutral';
    }
  }

  return result;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Build a lookup from lowercase type/species name → usage percent.
 * Usage stats usually have species slugs, but if they match a type name we
 * can use them to approximate how often that attacking type appears in the meta.
 */
function buildUsageMap(usageStats: UsageEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of usageStats) {
    map.set(entry.speciesSlug.toLowerCase(), entry.usagePercent);
  }
  return map;
}
