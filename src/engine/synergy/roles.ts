/**
 * Role inference and compatibility scoring.
 *
 * Roles are inferred from a Pokémon's ability tags, move tags, and base stats.
 * The user can override the inferred role per slot (stored in TeamMember.roles
 * with roleOverridden = true); the engine respects that override.
 *
 * Pure functions — no side effects, no DB access, no React.
 */
import type { AbilityTag, BaseStats, MoveTag } from '../../types/pokemon';
import type { RoleTag } from '../../types/team';
import {
  ROLE_COMPATIBILITY,
  ROLE_DEFAULT_COMPATIBILITY,
  ROLE_REDUNDANCY_PENALTY,
  TRICK_ROOM_SLOW_THRESHOLD,
} from './config';

// ─── Role inference ───────────────────────────────────────────────────────────

/**
 * Infers a list of roles from a Pokémon's ability tags, move tags, and stats.
 *
 * Multiple roles can be inferred (e.g., Incineroar can be both "fake-out" and
 * "bulky-support"). The order has no significance.
 */
export function inferRoles(
  abilityTags: AbilityTag[],
  moveTags:    MoveTag[],
  baseStats:   BaseStats,
): RoleTag[] {
  const roles = new Set<RoleTag>();

  // ── Weather setters (ability-based) ────────────────────────────────────────
  if (abilityTags.includes('weather-setter:rain'))  roles.add('setter:rain');
  if (abilityTags.includes('weather-setter:sun'))   roles.add('setter:sun');
  if (abilityTags.includes('weather-setter:sand'))  roles.add('setter:sand');
  if (abilityTags.includes('weather-setter:snow'))  roles.add('setter:snow');

  // ── Weather setters (move-based — manual setup) ────────────────────────────
  if (moveTags.includes('weather:rain'))  roles.add('setter:rain');
  if (moveTags.includes('weather:sun'))   roles.add('setter:sun');
  if (moveTags.includes('weather:sand'))  roles.add('setter:sand');
  if (moveTags.includes('weather:snow'))  roles.add('setter:snow');

  // ── Weather abusers (ability-based) ───────────────────────────────────────
  if (abilityTags.includes('weather-abuser:rain'))  roles.add('abuser:rain');
  if (abilityTags.includes('weather-abuser:sun'))   roles.add('abuser:sun');
  if (abilityTags.includes('weather-abuser:sand'))  roles.add('abuser:sand');
  if (abilityTags.includes('weather-abuser:snow'))  roles.add('abuser:snow');

  // ── Trick Room ─────────────────────────────────────────────────────────────
  if (moveTags.includes('trick-room'))              roles.add('setter:trick-room');
  if (baseStats.spe <= TRICK_ROOM_SLOW_THRESHOLD)   roles.add('abuser:trick-room');

  // ── Tailwind ──────────────────────────────────────────────────────────────
  if (moveTags.includes('tailwind'))                roles.add('setter:tailwind');

  // ── Redirection ───────────────────────────────────────────────────────────
  if (abilityTags.includes('redirection') || moveTags.includes('redirect')) {
    roles.add('redirector');
  }

  // ── Fake Out ──────────────────────────────────────────────────────────────
  if (moveTags.includes('fake-out'))                roles.add('fake-out');

  // ── Pivot ─────────────────────────────────────────────────────────────────
  if (moveTags.includes('priority') && !moveTags.includes('fake-out')) {
    // Priority moves that aren't Fake Out suggest a pivot-like offensive role
    // (Extreme Speed, Aqua Jet, Bullet Punch, etc.)
  }
  // U-turn / Volt Switch would be encoded as a separate move tag in future;
  // for now the "pivot" role must be assigned manually or via usage data.

  // ── Setup sweeper ─────────────────────────────────────────────────────────
  if (moveTags.includes('setup'))                   roles.add('setup-sweeper');

  // ── Bulky support ─────────────────────────────────────────────────────────
  // Defined as: high physical bulk (HP × Def product) and at least one
  // support move tag (recovery, redirection, or screen-setting ability).
  const physBulk = baseStats.hp * baseStats.def;
  const specBulk = baseStats.hp * baseStats.spd;
  const hasSupportMove = moveTags.includes('recovery') || moveTags.includes('redirect');
  const hasSupportAbility =
    abilityTags.includes('redirection') ||
    abilityTags.includes('intimidate') ||
    abilityTags.includes('screen-setter');

  if ((physBulk > 7_000 || specBulk > 7_000) && (hasSupportMove || hasSupportAbility)) {
    roles.add('bulky-support');
  }

  // ── Win condition ─────────────────────────────────────────────────────────
  // High offensive stats with a direct damage setup.
  const offStat = Math.max(baseStats.atk, baseStats.spa);
  if (offStat >= 130 && !roles.has('setup-sweeper')) {
    roles.add('win-condition');
  }

  // ── Frail attacker ────────────────────────────────────────────────────────
  // High offense, low physical bulk — needs protection.
  if (offStat >= 110 && baseStats.hp < 70 && baseStats.def < 80) {
    roles.add('frail-attacker');
  }

  // ── Speed control ────────────────────────────────────────────────────────
  // Has a move tag that controls opponent speed (Icy Wind, Thunder Wave, etc.)
  // encoded under the broad "speed-control" concept.
  // Currently mapped from the 'tailwind' tag only; extend when speed-control
  // move tags are added.

  // Fallback: if no role inferred, assign 'flex'.
  if (roles.size === 0) {
    roles.add('flex');
  }

  return [...roles];
}

// ─── Atypical set detection ───────────────────────────────────────────────────

export interface AtypicalRoleWarning {
  /** The role the engine expects based on the species' typical usage. */
  typicalRole: RoleTag;
  /** The role inferred from the actual moveset/ability. */
  inferredRole: RoleTag;
  /** Plain-English message shown to the user. */
  message: string;
}

/**
 * Checks whether a Pokémon's inferred roles diverge from a set of
 * "expected" roles (caller-supplied, e.g. from usage data).
 *
 * Returns null if no atypical divergence is detected.
 *
 * Currently a thin stub — full implementation requires usage data
 * mapping species slugs to typical role sets.
 */
export function detectAtypicalRole(
  _slug:          string,
  _inferredRoles: RoleTag[],
  _expectedRoles: RoleTag[],
): AtypicalRoleWarning | null {
  // TODO: implement when usage data is integrated.
  // Example: Incineroar without 'fake-out' in moveTags → warn.
  return null;
}

// ─── Role compatibility ───────────────────────────────────────────────────────

/**
 * Computes a compatibility score (0..1) for a pair of role lists.
 *
 * Strategy:
 *   - For each role in A, find the best-matching role in B using the
 *     ROLE_COMPATIBILITY lookup table.
 *   - Average across all A×B pairs.
 *   - Apply a redundancy penalty if the same role appears in both A and B.
 */
export function computeRoleCompatibility(
  rolesA: RoleTag[],
  rolesB: RoleTag[],
): number {
  if (rolesA.length === 0 || rolesB.length === 0) {
    return ROLE_DEFAULT_COMPATIBILITY;
  }

  let totalScore = 0;
  let pairCount = 0;

  for (const rA of rolesA) {
    for (const rB of rolesB) {
      totalScore += lookupCompatibility(rA, rB);
      pairCount++;
    }
  }

  let score = pairCount > 0 ? totalScore / pairCount : ROLE_DEFAULT_COMPATIBILITY;

  // Redundancy penalty: roles that are identical in both members.
  const redundant = rolesA.filter((r) => rolesB.includes(r));
  if (redundant.length > 0) {
    // The more redundant roles, the steeper the penalty.
    const redundancyFraction = redundant.length / Math.min(rolesA.length, rolesB.length);
    score *= 1 - redundancyFraction * (1 - ROLE_REDUNDANCY_PENALTY);
  }

  return Math.max(0, Math.min(1, score));
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function lookupCompatibility(rA: RoleTag, rB: RoleTag): number {
  // Try both orderings.
  const key1 = `${rA}+${rB}`;
  const key2 = `${rB}+${rA}`;
  return (
    ROLE_COMPATIBILITY[key1] ??
    ROLE_COMPATIBILITY[key2] ??
    ROLE_DEFAULT_COMPATIBILITY
  );
}
