/**
 * Per-candidate legality checker for the Pokémon picker.
 *
 * Answers the question: "Can I add this Pokémon to my current team?"
 * Returns a plain-English reason when illegal so the UI can show it.
 *
 * Pure function — no DB access, no React.
 */
import type { Regulation } from '../../types/regulation';

export interface LegalityResult {
  legal:  boolean;
  /** null when legal; human-readable explanation when illegal. */
  reason: string | null;
}

/**
 * Checks whether a candidate Pokémon is legal to add to the team.
 *
 * @param candidateSlug   slug of the Pokémon the user wants to add
 * @param currentSlugs    slugs already on the team (may be empty)
 * @param regulation      active regulation object
 * @param championsRoster full roster for 'champions-roster' regulations
 */
export function checkCandidateLegality(
  candidateSlug:   string,
  currentSlugs:    string[],
  regulation:      Regulation,
  championsRoster: string[],
): LegalityResult {
  const display = displaySlug(candidateSlug);

  // ── 1. Species pool ────────────────────────────────────────────────────────
  if (regulation.speciesSource === 'champions-roster') {
    if (!championsRoster.includes(candidateSlug)) {
      return {
        legal:  false,
        reason: `${display} is not available in ${regulation.displayName}.`,
      };
    }
  } else if (Array.isArray(regulation.speciesSource)) {
    if (!(regulation.speciesSource as string[]).includes(candidateSlug)) {
      return {
        legal:  false,
        reason: `${display} is not in the allowed species list for ${regulation.displayName}.`,
      };
    }
  }
  // 'national-dex' → all allowed

  // ── 2. Species banlist ─────────────────────────────────────────────────────
  if (regulation.speciesBanlist.includes(candidateSlug)) {
    return {
      legal:  false,
      reason: `${display} is banned in ${regulation.displayName}.`,
    };
  }

  // ── 3. Species clause (no duplicates) ─────────────────────────────────────
  if (regulation.clauseList.includes('species-clause')) {
    if (currentSlugs.includes(candidateSlug)) {
      return {
        legal:  false,
        reason: `Species Clause — ${display} is already on your team.`,
      };
    }
  }

  // ── 4. Restricted legendary limit ─────────────────────────────────────────
  if (regulation.restrictedPool.includes(candidateSlug)) {
    const currentRestricted = currentSlugs.filter((s) =>
      regulation.restrictedPool.includes(s),
    );
    if (currentRestricted.length >= regulation.restrictedLimit) {
      const names = currentRestricted.map(displaySlug).join(', ');
      return {
        legal:  false,
        reason: `Restricted limit reached — you already have ${names}.`,
      };
    }
  }

  return { legal: true, reason: null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displaySlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
