/**
 * Strategic combo detection.
 *
 * Identifies named synergistic patterns across a group of Pokémon.
 * Combos fire on pairs, not the full team, so they compose naturally when
 * computing team-wide synergy.
 *
 * Pure functions — no side effects, no DB access, no React.
 */
import type { RoleTag } from '../../types/team';
import { COMBO_SCORE_MAX, COMBO_SCORE_PER_COMBO } from './config';
import type { ComboName, PokemonWithRole, StrategicCombo } from './types';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detects all named combos present in a group of Pokémon (usually a pair,
 * but works with any size). Each combo is returned at most once.
 */
export function detectCombos(members: PokemonWithRole[]): StrategicCombo[] {
  const combos: StrategicCombo[] = [];

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      combos.push(...detectPairCombos(members[i], members[j]));
    }
  }

  // Deduplicate by combo name (same combo shouldn't fire twice on the team).
  const seen = new Set<ComboName>();
  return combos.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}

/**
 * Converts a list of combos into a strategic score in [0, 1].
 * Each combo contributes COMBO_SCORE_PER_COMBO; the total is capped at
 * COMBO_SCORE_MAX.
 */
export function combosToScore(combos: StrategicCombo[]): number {
  return Math.min(COMBO_SCORE_MAX, combos.length * COMBO_SCORE_PER_COMBO);
}

// ─── Pair-level combo detection ───────────────────────────────────────────────

function detectPairCombos(a: PokemonWithRole, b: PokemonWithRole): StrategicCombo[] {
  const combos: StrategicCombo[] = [];
  const rolesA = new Set(a.roles);
  const rolesB = new Set(b.roles);

  // Helper: does the pair have role X (in either member)?
  const either = (role: RoleTag) => rolesA.has(role) || rolesB.has(role);
  const both   = (role: RoleTag) => rolesA.has(role) && rolesB.has(role);

  // ── Weather cores ──────────────────────────────────────────────────────────

  const weathers = ['rain', 'sun', 'sand', 'snow'] as const;
  for (const w of weathers) {
    const setter  = `setter:${w}`  as RoleTag;
    const abuser  = `abuser:${w}`  as RoleTag;
    const comboName = `weather:${w}` as ComboName;

    if (either(setter) && either(abuser) && setter !== abuser) {
      const setterMon = rolesA.has(setter) ? a : b;
      const abuserMon = rolesA.has(abuser) ? a : b;
      combos.push({
        name:        comboName,
        label:       `${capitalize(w)} Core`,
        description: `${setterMon.displayName} sets ${capitalize(w)}; ` +
                     `${abuserMon.displayName} benefits from the ${w} condition.`,
        memberSlugs: [setterMon.slug, abuserMon.slug],
      });
    }
  }

  // ── Trick Room core ────────────────────────────────────────────────────────

  if (either('setter:trick-room') && either('abuser:trick-room')) {
    const setterMon = rolesA.has('setter:trick-room') ? a : b;
    const abuserMon = rolesA.has('abuser:trick-room') ? a : b;
    // Only fire if these are different members (a mon can be both setter + abuser,
    // but that doesn't form a PAIR combo by itself).
    if (setterMon.slug !== abuserMon.slug) {
      combos.push({
        name:        'trick-room',
        label:       'Trick Room Core',
        description: `${setterMon.displayName} sets Trick Room; ` +
                     `${abuserMon.displayName} moves first in reversed speed order.`,
        memberSlugs: [setterMon.slug, abuserMon.slug],
      });
    }
  }

  // ── Tailwind offense ───────────────────────────────────────────────────────

  if (either('setter:tailwind') && either('win-condition')) {
    const setterMon = rolesA.has('setter:tailwind') ? a : b;
    const winConMon = rolesA.has('win-condition') ? a : b;
    if (setterMon.slug !== winConMon.slug) {
      combos.push({
        name:        'tailwind-offense',
        label:       'Tailwind Offense',
        description: `${setterMon.displayName} sets Tailwind; ` +
                     `${winConMon.displayName} outspeeds nearly everything for 3 turns.`,
        memberSlugs: [setterMon.slug, winConMon.slug],
      });
    }
  }

  // ── Fake Out protection ────────────────────────────────────────────────────

  if (either('fake-out') && (either('frail-attacker') || either('setup-sweeper'))) {
    const fakeOutMon  = rolesA.has('fake-out') ? a : b;
    const protectedMon = (rolesA.has('frail-attacker') || rolesA.has('setup-sweeper'))
      ? a : b;
    if (fakeOutMon.slug !== protectedMon.slug) {
      combos.push({
        name:        'fake-out-protection',
        label:       'Fake Out Protection',
        description: `${fakeOutMon.displayName}'s Fake Out flinches a threat, ` +
                     `buying ${protectedMon.displayName} a free turn to attack or set up.`,
        memberSlugs: [fakeOutMon.slug, protectedMon.slug],
      });
    }
  }

  // ── Redirection core ──────────────────────────────────────────────────────

  if (either('redirector') && (either('frail-attacker') || either('setup-sweeper'))) {
    const redirectorMon = rolesA.has('redirector') ? a : b;
    const shieldedMon   = (rolesA.has('frail-attacker') || rolesA.has('setup-sweeper'))
      ? a : b;
    if (redirectorMon.slug !== shieldedMon.slug) {
      combos.push({
        name:        'redirection-core',
        label:       'Redirection Core',
        description: `${redirectorMon.displayName} draws single-target moves away from ` +
                     `${shieldedMon.displayName}, letting it attack freely.`,
        memberSlugs: [redirectorMon.slug, shieldedMon.slug],
      });
    }
  }

  // ── Intimidate chain ──────────────────────────────────────────────────────

  const aHasIntimidate = a.abilityTags.includes('intimidate');
  const bHasIntimidate = b.abilityTags.includes('intimidate');
  if (aHasIntimidate && bHasIntimidate) {
    combos.push({
      name:        'intimidate-chain',
      label:       'Intimidate Chain',
      description: `${a.displayName} and ${b.displayName} both carry Intimidate, ` +
                   `halving the opposing Attack stat on switch-in and stacking ` +
                   `Atk drops throughout the game.`,
      memberSlugs: [a.slug, b.slug],
    });
  }

  // ── Speed control + sweep ─────────────────────────────────────────────────

  if (either('speed-control') && either('frail-attacker')) {
    const controlMon  = rolesA.has('speed-control') ? a : b;
    const attackerMon = rolesA.has('frail-attacker') ? a : b;
    if (controlMon.slug !== attackerMon.slug) {
      combos.push({
        name:        'speed-control-sweep',
        label:       'Speed Control + Sweep',
        description: `${controlMon.displayName} slows the opposing team; ` +
                     `${attackerMon.displayName} outspeeds threats it otherwise couldn't.`,
        memberSlugs: [controlMon.slug, attackerMon.slug],
      });
    }
  }

  return combos;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
