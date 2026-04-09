/**
 * Plain-English explanation generator for synergy scores.
 *
 * Template-based — no ML, no randomness. Given the structured intermediate
 * data from the scoring functions, produces a sentence that tells the user:
 *   1. The tier (Strong, Excellent, etc.)
 *   2. What specifically makes the pairing work
 *   3. The main drawback, if any
 *
 * Example output:
 *   "Strong — Amoonguss covers 3 of Miraidon's 4 weaknesses and draws
 *    single-target moves away from it; shared Fairy weakness is the main drawback."
 *
 * Pure functions — no side effects.
 */
import type { PokemonType } from '../../types/pokemon';
import type { PairSynergyResult, SynergyTier, TeamSynergyResult } from './types';

// ─── Pair explanation ─────────────────────────────────────────────────────────

/**
 * Generates the plain-English reason string for a pair synergy result.
 * Called by computePairSynergy — result.explanation is populated from here.
 */
export function explainPairSynergy(
  result:       Pick<PairSynergyResult, 'tier' | 'defensiveDetail' | 'offensiveDetail' | 'combos'>,
  slugA:        string,
  displayNameA: string,
  slugB:        string,
  displayNameB: string,
): string {
  const { tier, defensiveDetail, offensiveDetail, combos } = result;
  const tierLabel = TIER_LABELS[tier];

  const parts: string[] = [];

  // ── Lead with the most prominent strategic combo ───────────────────────────
  if (combos.length > 0) {
    parts.push(combos[0].description);
  }

  // ── Defensive synergy ──────────────────────────────────────────────────────
  const { aCoveredByB, bCoveredByA, sharedWeaknesses } = defensiveDetail;

  // The stronger coverage direction gets a sentence.
  if (aCoveredByB >= 0.75 || bCoveredByA >= 0.75) {
    if (aCoveredByB > bCoveredByA) {
      parts.push(defensiveSentence(displayNameB, displayNameA, aCoveredByB));
    } else {
      parts.push(defensiveSentence(displayNameA, displayNameB, bCoveredByA));
    }
  } else if (defensiveDetail.score >= 0.4 && combos.length === 0) {
    // Decent coverage but no combo — still mention it
    parts.push(
      `${displayNameA} and ${displayNameB} partially cover each other's weaknesses`,
    );
  }

  // ── Offensive coverage ────────────────────────────────────────────────────
  const gapsFilled = offensiveDetail.uniqueGapsFilled.length;
  if (gapsFilled >= 3 && combos.length === 0) {
    parts.push(
      `together they cover ${gapsFilled} additional type${gapsFilled > 1 ? 's' : ''} ` +
      `neither threatens alone`,
    );
  }

  // ── Shared weakness drawback ───────────────────────────────────────────────
  if (sharedWeaknesses.length > 0) {
    const typeNames = sharedWeaknesses.map(formatType).join('/');
    const plural    = sharedWeaknesses.length > 1 ? 'weaknesses are' : 'weakness is';
    parts.push(
      `shared ${typeNames} ${plural} the main drawback`,
    );
  }

  // Fallback when there's nothing specific to say.
  if (parts.length === 0) {
    parts.push(genericSentence(tier, displayNameA, displayNameB));
  }

  return `${tierLabel} — ${parts.join('; ')}.`;
}

// ─── Team explanation ─────────────────────────────────────────────────────────

/**
 * High-level summary sentence for a full team's synergy result.
 */
export function explainTeamSynergy(result: TeamSynergyResult): string {
  const { tier, typeCoverage, roleCoverage, combos } = result;
  const tierLabel = TIER_LABELS[tier];
  const parts: string[] = [];

  // Active combos
  if (combos.length > 0) {
    const comboLabels = combos.map((c) => c.label).join(' + ');
    parts.push(`${comboLabels} core active`);
  }

  // Offensive gaps
  if (typeCoverage.offensivelyUncovered.length > 0) {
    const uncovered = typeCoverage.offensivelyUncovered.map(formatType).join(', ');
    parts.push(`no super-effective coverage on ${uncovered}`);
  }

  // Missing roles
  if (roleCoverage.missing.length > 0) {
    const missing = roleCoverage.missing.map(formatRole).join(', ');
    parts.push(`no ${missing}`);
  }

  // Common threats (types ≥3 members are weak to)
  const bigThreats = Object.entries(typeCoverage.weaknessCounts)
    .filter(([, count]) => count >= 3)
    .map(([type]) => formatType(type as PokemonType));
  if (bigThreats.length > 0) {
    parts.push(`${bigThreats.join(' and ')} threatens ${bigThreats.length > 1 ? 'most' : 'many'} of your team`);
  }

  if (parts.length === 0) {
    return `${tierLabel} — well-balanced team with broad coverage and role diversity.`;
  }

  return `${tierLabel} — ${parts.join('; ')}.`;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

const TIER_LABELS: Record<SynergyTier, string> = {
  excellent: 'Excellent',
  strong:    'Strong',
  decent:    'Decent',
  poor:      'Poor',
};

function defensiveSentence(
  coveringName:  string,
  coveredName:   string,
  coverFraction: number,
): string {
  if (coverFraction >= 1.0) {
    return `${coveringName} fully covers ${coveredName}'s type weaknesses`;
  }
  if (coverFraction >= 0.75) {
    return `${coveringName} resists most of ${coveredName}'s weaknesses`;
  }
  return `${coveringName} covers some of ${coveredName}'s weaknesses`;
}

function genericSentence(
  tier:         SynergyTier,
  displayNameA: string,
  displayNameB: string,
): string {
  switch (tier) {
    case 'excellent':
      return `${displayNameA} and ${displayNameB} complement each other exceptionally well`;
    case 'strong':
      return `${displayNameA} and ${displayNameB} form a strong pairing`;
    case 'decent':
      return `${displayNameA} and ${displayNameB} work adequately together`;
    case 'poor':
      return `${displayNameA} and ${displayNameB} have limited synergy`;
  }
}

/** "Electric" → "Electric"; "Ghost" → "Ghost". Already capitalised in our types. */
function formatType(t: PokemonType | string): string {
  return t;
}

function formatRole(role: string): string {
  return role.replace(/-/g, ' ').replace(/:/g, ' ');
}
