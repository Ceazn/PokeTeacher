/**
 * Team health report aggregation.
 *
 * Aggregates synergy engine outputs into a single health snapshot used by
 * the health dashboard screen and slot-level indicators.
 *
 * Pure functions — no side effects, no DB access, no React.
 */
import type { Archetype, RoleTag } from '../../types/team';
import type {
  PairSynergyResult,
  RoleCoverageReport,
  StrategicCombo,
  SynergyTier,
  TeamSynergyResult,
  TypeCoverageReport,
} from '../synergy/types';
import { ARCHETYPE_TEMPLATES } from './archetypes';
import { scoreToTier } from '../synergy/config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlotHealth {
  /** Slot index 0–5. */
  slotIndex:     number;
  /** Average pairwise synergy score for this slot against all others (0..1). */
  avgPairScore:  number;
  tier:          SynergyTier;
  /** True when this slot's roles satisfy the archetype slot template. */
  roleFit:       boolean;
  /** Sorted pair keys that this slot participates in. */
  pairKeys:      string[];
}

export interface TeamHealthReport {
  /** Composite team synergy score (0..1). */
  overallScore:      number;
  tier:              SynergyTier;

  /** Per-slot breakdown. */
  slots:             SlotHealth[];

  typeCoverage:      TypeCoverageReport;
  roleCoverage:      RoleCoverageReport;

  /** Top-N strongest pairs (sorted descending by totalScore). */
  topPairs:          PairSynergyResult[];
  /** Top-N weakest pairs (sorted ascending by totalScore). */
  weakestPairs:      PairSynergyResult[];

  combos:            StrategicCombo[];

  /**
   * The three types the team is most commonly weak to, sorted by weakness
   * count descending.  Derived from typeCoverage.weaknessCounts.
   */
  biggestThreats:    string[];   // PokemonType strings

  /** Plain-English one-liner summary. */
  summary:           string;
}

// ─── Main aggregator ──────────────────────────────────────────────────────────

/**
 * Builds a TeamHealthReport from a computed TeamSynergyResult.
 *
 * @param synergyResult  Output of computeTeamSynergy()
 * @param slugs          Ordered array of member slugs (index = slot index)
 * @param roles          Ordered array of each member's role tags
 * @param archetype      The team's chosen archetype (or null for free-form)
 * @param topN           How many top/weakest pairs to include (default 3)
 */
export function buildHealthReport(
  synergyResult: TeamSynergyResult,
  slugs:         string[],
  roles:         RoleTag[][],
  archetype:     Archetype | null,
  topN:          number = 3,
): TeamHealthReport {
  const pairs = Object.values(synergyResult.pairScores);

  // ── Per-slot aggregation ───────────────────────────────────────────────────
  const slots = buildSlotHealth(slugs, roles, archetype, pairs);

  // ── Top / weakest pairs ───────────────────────────────────────────────────
  const sorted = [...pairs].sort((a, b) => b.totalScore - a.totalScore);
  const topPairs     = sorted.slice(0, topN);
  const weakestPairs = sorted.slice(-topN).reverse();

  // ── Biggest threats ────────────────────────────────────────────────────────
  const biggestThreats = rankThreats(synergyResult.typeCoverage, 3);

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = buildSummary(synergyResult, biggestThreats);

  return {
    overallScore:  synergyResult.overallScore,
    tier:          synergyResult.tier,
    slots,
    typeCoverage:  synergyResult.typeCoverage,
    roleCoverage:  synergyResult.roleCoverage,
    topPairs,
    weakestPairs,
    combos:        synergyResult.combos,
    biggestThreats,
    summary,
  };
}

// ─── Slot health ──────────────────────────────────────────────────────────────

function buildSlotHealth(
  slugs:     string[],
  roles:     RoleTag[][],
  archetype: Archetype | null,
  pairs:     PairSynergyResult[],
): SlotHealth[] {
  const template = archetype ? ARCHETYPE_TEMPLATES[archetype] : null;

  return slugs.map((slug, i) => {
    // Pairs this slot participates in
    const myPairs = pairs.filter((p) => {
      const [a, b] = p.pairKey.split('+');
      return a === slug || b === slug;
    });

    const pairKeys = myPairs.map((p) => p.pairKey);
    const avgPairScore =
      myPairs.length > 0
        ? myPairs.reduce((sum, p) => sum + p.totalScore, 0) / myPairs.length
        : 0;

    // Role fit: does this slot satisfy its archetype slot template?
    const slotRoles  = roles[i] ?? [];
    const slotTpl    = template?.slots[i];
    const roleFit    = slotTpl
      ? slotRoles.some(
          (r) => r === slotTpl.primaryRole || slotTpl.alternatives.includes(r),
        )
      : true; // no template → always "fits"

    return {
      slotIndex:    i,
      avgPairScore,
      tier:         scoreToTier(avgPairScore),
      roleFit,
      pairKeys,
    };
  });
}

// ─── Threat ranking ───────────────────────────────────────────────────────────

/**
 * Returns the top-N attacking types by team weakness count, sorted
 * descending. Ties are broken alphabetically for stability.
 */
export function rankThreats(coverage: TypeCoverageReport, n: number): string[] {
  return Object.entries(coverage.weaknessCounts)
    .sort(([tA, cA], [tB, cB]) => cB - cA || tA.localeCompare(tB))
    .slice(0, n)
    .map(([type]) => type);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function buildSummary(
  result:        TeamSynergyResult,
  threats:       string[],
): string {
  const tier = result.tier;

  const tierPhrase: Record<SynergyTier, string> = {
    excellent: 'Excellent synergy',
    strong:    'Strong synergy',
    decent:    'Decent synergy',
    poor:      'Poor synergy',
  };

  const comboLabels = result.combos.map((c) => c.label);
  const comboPart   = comboLabels.length > 0
    ? ` — ${comboLabels.slice(0, 2).join(', ')} detected`
    : '';

  const missingRoles = result.roleCoverage.missing;
  const missingPart  = missingRoles.length > 0
    ? `; missing ${missingRoles.slice(0, 2).join(', ')}`
    : '';

  const threatPart = threats.length > 0
    ? `; watch out for ${threats.slice(0, 2).join(' and ')}`
    : '';

  return `${tierPhrase[tier]}${comboPart}${missingPart}${threatPart}.`;
}
