/**
 * All tunable constants for the Synergy Engine.
 *
 * This is the single place to adjust weightings without touching logic.
 * Every constant is `as const` so TypeScript catches accidental mutations.
 */
import type { RoleTag } from '../../types/team';
import type { SynergyTier } from './types';

// ─── Component weights (must sum to 1.0) ─────────────────────────────────────

export const SYNERGY_WEIGHTS = {
  defensive:           0.35,
  offensive:           0.25,
  roleCompatibility:   0.25,
  strategicEnablement: 0.15,
} as const satisfies Record<string, number>;

// ─── Defensive scoring ────────────────────────────────────────────────────────

/** Penalty multiplier applied per shared weakness as a fraction of total. */
export const SHARED_WEAKNESS_PENALTY = 0.45;

// ─── Offensive scoring ────────────────────────────────────────────────────────

/** Bonus weight for gap-filling (covering types the partner can't). */
export const OFFENSIVE_GAP_FILL_BONUS = 0.3;

// ─── Role scoring ─────────────────────────────────────────────────────────────

/** Multiplier applied when two members have an identical role (redundancy). */
export const ROLE_REDUNDANCY_PENALTY = 0.35;

/**
 * Compatibility scores between pairs of roles.
 * Symmetric — only one direction needs to be listed.
 * Unlisted pairs fall back to ROLE_DEFAULT_COMPATIBILITY.
 */
export const ROLE_COMPATIBILITY: Partial<Record<string, number>> = {
  // Weather cores — setter + abuser of same weather
  'setter:rain+abuser:rain':    1.0,
  'setter:sun+abuser:sun':      1.0,
  'setter:sand+abuser:sand':    1.0,
  'setter:snow+abuser:snow':    1.0,

  // Trick Room core
  'setter:trick-room+abuser:trick-room': 1.0,

  // Tailwind + speed-dependent sweeper
  'setter:tailwind+win-condition':  0.9,
  'setter:tailwind+frail-attacker': 0.85,

  // Fake Out provides a free turn for these roles
  'fake-out+setup-sweeper':    0.9,
  'fake-out+frail-attacker':   0.9,
  'fake-out+win-condition':    0.85,

  // Redirection shields vulnerable attackers
  'redirector+frail-attacker': 0.95,
  'redirector+setup-sweeper':  0.9,
  'redirector+win-condition':  0.85,

  // Speed control helps sweepers
  'speed-control+win-condition':  0.8,
  'speed-control+frail-attacker': 0.75,

  // Pivots work with almost anything
  'pivot+win-condition':    0.75,
  'pivot+frail-attacker':   0.75,
  'pivot+setup-sweeper':    0.7,

  // Redundant pairs (penalty)
  'setter:rain+setter:rain':           0.05,
  'setter:sun+setter:sun':             0.05,
  'setter:trick-room+setter:trick-room': 0.05,
  'setter:tailwind+setter:tailwind':   0.05,
  'redirector+redirector':             0.25,
  'fake-out+fake-out':                 0.20,
} as const;

export const ROLE_DEFAULT_COMPATIBILITY = 0.55;

// ─── Strategic scoring ────────────────────────────────────────────────────────

/** Score added when a named strategic combo is detected for a pair. */
export const COMBO_SCORE_PER_COMBO = 0.35;
/** Cap on the combined strategic score, regardless of combo count. */
export const COMBO_SCORE_MAX = 1.0;

// ─── Trick Room threshold ────────────────────────────────────────────────────

/** Pokémon with base speed at or below this are considered Trick Room abusers. */
export const TRICK_ROOM_SLOW_THRESHOLD = 60;

// ─── Tier thresholds ─────────────────────────────────────────────────────────

/** Maps a total score (0..1) to a display tier. */
export const TIER_THRESHOLDS: Record<SynergyTier, number> = {
  excellent: 0.72,
  strong:    0.52,
  decent:    0.32,
  poor:      0,
} as const;

export function scoreToTier(score: number): SynergyTier {
  if (score >= TIER_THRESHOLDS.excellent) return 'excellent';
  if (score >= TIER_THRESHOLDS.strong)    return 'strong';
  if (score >= TIER_THRESHOLDS.decent)    return 'decent';
  return 'poor';
}

// ─── Creativity dial ─────────────────────────────────────────────────────────

/**
 * At max off-meta creativity (factor = 1), a low-usage mon gets this additive
 * boost on its suggestion score. Scales linearly with creativityFactor.
 */
export const CREATIVITY_OFFMETA_BOOST = 0.2;

/** Usage threshold below which a Pokémon is considered "off-meta". */
export const OFFMETA_USAGE_THRESHOLD = 5.0; // percent

// ─── Usage tiebreaker ────────────────────────────────────────────────────────

/** How much usage nudges suggestion scores (secondary signal, not primary). */
export const USAGE_TIEBREAKER_WEIGHT = 0.07;
