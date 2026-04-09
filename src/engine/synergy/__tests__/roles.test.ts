import { computeRoleCompatibility, inferRoles } from '../roles';
import type { AbilityTag, BaseStats, MoveTag } from '../../../types/pokemon';
import type { RoleTag } from '../../../types/team';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseStats(overrides: Partial<BaseStats> = {}): BaseStats {
  return { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80, ...overrides };
}

function infer(
  abilityTags: AbilityTag[] = [],
  moveTags:    MoveTag[]    = [],
  stats:       Partial<BaseStats> = {},
): RoleTag[] {
  return inferRoles(abilityTags, moveTags, baseStats(stats));
}

// ─── Role inference — weather ──────────────────────────────────────────────

describe('inferRoles — weather setters and abusers', () => {
  test('Drizzle ability → setter:rain', () => {
    expect(infer(['weather-setter:rain'])).toContain('setter:rain');
  });

  test('Drought ability → setter:sun', () => {
    expect(infer(['weather-setter:sun'])).toContain('setter:sun');
  });

  test('Rain Dance move → setter:rain', () => {
    expect(infer([], ['weather:rain'])).toContain('setter:rain');
  });

  test('Swift Swim ability → abuser:rain', () => {
    expect(infer(['weather-abuser:rain'])).toContain('abuser:rain');
  });

  test('Chlorophyll ability → abuser:sun', () => {
    expect(infer(['weather-abuser:sun'])).toContain('abuser:sun');
  });

  test('both setter and abuser of same weather can coexist (rare but valid)', () => {
    const roles = infer(['weather-setter:rain', 'weather-abuser:rain']);
    expect(roles).toContain('setter:rain');
    expect(roles).toContain('abuser:rain');
  });
});

// ─── Role inference — Trick Room ──────────────────────────────────────────────

describe('inferRoles — Trick Room', () => {
  test('Trick Room move → setter:trick-room', () => {
    expect(infer([], ['trick-room'])).toContain('setter:trick-room');
  });

  test('base speed ≤ 60 → abuser:trick-room', () => {
    expect(infer([], [], { spe: 30 })).toContain('abuser:trick-room');
    expect(infer([], [], { spe: 60 })).toContain('abuser:trick-room');
  });

  test('base speed > 60 → no abuser:trick-room', () => {
    expect(infer([], [], { spe: 61 })).not.toContain('abuser:trick-room');
    expect(infer([], [], { spe: 100 })).not.toContain('abuser:trick-room');
  });

  test('Reuniclus-like (speed 30, Trick Room move) gets both setter and abuser roles', () => {
    const roles = infer([], ['trick-room'], { spe: 30 });
    expect(roles).toContain('setter:trick-room');
    expect(roles).toContain('abuser:trick-room');
  });
});

// ─── Role inference — support moves ──────────────────────────────────────────

describe('inferRoles — support', () => {
  test('redirect move → redirector', () => {
    expect(infer([], ['redirect'])).toContain('redirector');
  });

  test('Storm Drain ability → redirector', () => {
    expect(infer(['redirection'])).toContain('redirector');
  });

  test('fake-out move → fake-out role', () => {
    expect(infer([], ['fake-out'])).toContain('fake-out');
  });

  test('tailwind move → setter:tailwind', () => {
    expect(infer([], ['tailwind'])).toContain('setter:tailwind');
  });

  test('setup move → setup-sweeper', () => {
    expect(infer([], ['setup'])).toContain('setup-sweeper');
  });
});

// ─── Role inference — stat-based ─────────────────────────────────────────────

describe('inferRoles — stat-based', () => {
  test('very high Atk with frail bulk → frail-attacker', () => {
    // e.g., Flutter Mane: high SpA (135), low HP (55), low Def (55)
    const roles = infer([], [], { spa: 135, hp: 55, def: 55 });
    expect(roles).toContain('frail-attacker');
  });

  test('moderate stats → no frail-attacker', () => {
    const roles = infer([], [], { atk: 90, hp: 90, def: 90 });
    expect(roles).not.toContain('frail-attacker');
  });

  test('very high Atk (≥130) → win-condition (when no setup move)', () => {
    const roles = infer([], [], { atk: 135 });
    expect(roles).toContain('win-condition');
  });

  test('setup move overrides win-condition with setup-sweeper', () => {
    const roles = infer([], ['setup'], { atk: 135 });
    expect(roles).toContain('setup-sweeper');
    // win-condition is only added when NOT a setup-sweeper
    expect(roles).not.toContain('win-condition');
  });

  test('bulky support: high HP×Def and support ability → bulky-support', () => {
    // Amoonguss-like: 114 HP, 70 Def, spore (redirect via Rage Powder)
    const roles = infer(['redirection'], [], { hp: 114, def: 70, spd: 80 });
    expect(roles).toContain('bulky-support');
    expect(roles).toContain('redirector');
  });
});

// ─── Role inference — flex fallback ──────────────────────────────────────────

describe('inferRoles — flex fallback', () => {
  test('no tags and average stats → flex', () => {
    const roles = infer([], [], { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 });
    expect(roles).toContain('flex');
  });

  test('once any role is inferred, flex is not added', () => {
    const roles = infer(['weather-setter:rain']);
    expect(roles).not.toContain('flex');
  });
});

// ─── Role compatibility ───────────────────────────────────────────────────────

describe('computeRoleCompatibility', () => {
  test('weather setter + matching abuser → score close to 1', () => {
    const s = computeRoleCompatibility(['setter:rain'], ['abuser:rain']);
    expect(s).toBeCloseTo(1.0, 5);
  });

  test('Trick Room setter + abuser → score close to 1', () => {
    const s = computeRoleCompatibility(['setter:trick-room'], ['abuser:trick-room']);
    expect(s).toBeCloseTo(1.0, 5);
  });

  test('fake-out + frail-attacker → high score', () => {
    const s = computeRoleCompatibility(['fake-out'], ['frail-attacker']);
    expect(s).toBeGreaterThan(0.8);
  });

  test('redirector + frail-attacker → highest non-weather score', () => {
    const s = computeRoleCompatibility(['redirector'], ['frail-attacker']);
    expect(s).toBeGreaterThanOrEqual(0.9);
  });

  test('two identical setters → low score (redundancy)', () => {
    const s = computeRoleCompatibility(['setter:rain'], ['setter:rain']);
    expect(s).toBeLessThan(0.15);
  });

  test('two redirectors → moderate penalty', () => {
    const s = computeRoleCompatibility(['redirector'], ['redirector']);
    expect(s).toBeLessThan(0.35);
  });

  test('mismatched weather → default compatibility (not a bonus, not a penalty)', () => {
    // setter:rain with abuser:sun — not synergistic but not actively harmful
    const s = computeRoleCompatibility(['setter:rain'], ['abuser:sun']);
    expect(s).toBeCloseTo(ROLE_DEFAULT_COMPAT, 1);
  });

  test('empty role arrays → default compatibility', () => {
    const s = computeRoleCompatibility([], []);
    expect(s).toBeCloseTo(ROLE_DEFAULT_COMPAT, 5);
  });

  test('symmetric: score(A, B) === score(B, A)', () => {
    const pairs: [RoleTag[], RoleTag[]][] = [
      [['setter:rain'],       ['abuser:rain']],
      [['redirector'],        ['frail-attacker']],
      [['fake-out'],          ['setup-sweeper']],
      [['setter:tailwind'],   ['win-condition']],
    ];
    for (const [a, b] of pairs) {
      expect(computeRoleCompatibility(a, b)).toBeCloseTo(
        computeRoleCompatibility(b, a),
        10,
      );
    }
  });

  test('score is within [0, 1]', () => {
    const cases: [RoleTag[], RoleTag[]][] = [
      [['setter:rain', 'fake-out'], ['abuser:rain', 'frail-attacker']],
      [['setter:trick-room', 'bulky-support'], ['abuser:trick-room', 'win-condition']],
      [['redirector', 'bulky-support'], ['redirector', 'frail-attacker']],
    ];
    for (const [a, b] of cases) {
      const s = computeRoleCompatibility(a, b);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});

// ─── Helpers local to test ────────────────────────────────────────────────────

const ROLE_DEFAULT_COMPAT = 0.55;
