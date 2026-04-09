import type { Regulation } from '../../types/regulation';
import type { TeamMember } from '../../types/team';

// ─── Validation result types ─────────────────────────────────────────────────

export type ViolationCode =
  /** Species appears in the banlist. */
  | 'SPECIES_BANNED'
  /** Species is not in the allowed pool (roster or allowlist). */
  | 'SPECIES_NOT_ALLOWED'
  /** Team contains more restricted legendaries than the limit allows. */
  | 'RESTRICTED_LIMIT_EXCEEDED'
  /** A specific restricted Pokémon appears more than once. */
  | 'RESTRICTED_DUPLICATE'
  /** Same species appears twice (species clause). */
  | 'SPECIES_CLAUSE'
  /** Same item held by two or more Pokémon (item clause — future). */
  | 'ITEM_CLAUSE'
  /** A banned move is in the moveset. */
  | 'MOVE_BANNED'
  /** A banned item is held. */
  | 'ITEM_BANNED'
  /** Team has fewer Pokémon than the minimum. */
  | 'TEAM_TOO_SMALL'
  /** Team has more Pokémon than the maximum. */
  | 'TEAM_TOO_LARGE';

/** A single rule violation, always attached to a specific slot or the team. */
export interface Violation {
  /** Which rule was broken. */
  code: ViolationCode;
  /** Plain-English explanation shown to the user. */
  reason: string;
  /**
   * Slot index (1–6) of the offending member, or null for team-wide violations
   * (e.g. TEAM_TOO_SMALL, RESTRICTED_LIMIT_EXCEEDED).
   */
  slot: number | null;
  /** The species slug or item name that caused the violation, if applicable. */
  subject: string | null;
}

export interface ValidationResult {
  isValid:    boolean;
  violations: Violation[];
}

// ─── Context passed in to the validator ──────────────────────────────────────

/**
 * The minimal data the validator needs from outside.
 * Passed in explicitly so the engine has no database dependency.
 */
export interface ValidationContext {
  regulation:       Regulation;
  /** Set of species slugs currently in the Champions roster. Ignored when
   *  speciesSource is "national-dex". */
  championsRoster:  ReadonlySet<string>;
}

// ─── Re-export Regulation so callers only need one import ────────────────────
export type { Regulation };
