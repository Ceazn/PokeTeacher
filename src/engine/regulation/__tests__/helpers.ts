/**
 * Test helpers for the Regulation engine.
 * Builds minimal fixture objects so tests read like specs, not boilerplate.
 */
import type { Regulation } from '../../../types/regulation';
import type { TeamMember } from '../../../types/team';
import type { ValidationContext } from '../types';

// ─── Default Champions M-A regulation ────────────────────────────────────────

export const CHAMPIONS_M_A: Regulation = {
  id:            'champions-m-a',
  displayName:   'Pokémon Champions Regulation M-A',
  game:          'champions',
  format:        'doubles',
  levelCap:      50,
  teamSize:      { min: 4, max: 6, battleSize: 4 },
  speciesSource: 'champions-roster',
  speciesBanlist:   [],
  restrictedPool:   ['miraidon', 'koraidon', 'zacian', 'zamazenta',
                     'calyrex-ice', 'calyrex-shadow'],
  restrictedLimit:  2,
  itemBanlist:      [],
  moveBanlist:      [],
  clauseList:       ['species-clause'],
  gimmicks:         { mega: true, tera: true, dynamax: false, zMove: false },
  effectiveFrom:    '2026-04-01',
  effectiveTo:      null,
  source:           'https://www.pokemon.com/',
  notes:            'Launch regulation.',
};

/** A roster containing a small set of slugs for unit tests. */
export const TEST_ROSTER = new Set([
  'pikachu', 'charizard', 'blastoise', 'venusaur',
  'amoonguss', 'incineroar', 'flutter-mane', 'great-tusk',
  'miraidon', 'koraidon', 'zacian', 'zamazenta',
  'calyrex-ice', 'calyrex-shadow', 'iron-bundle',
]);

export function makeContext(
  overrides: Partial<Regulation> = {},
  roster:    ReadonlySet<string> = TEST_ROSTER,
): ValidationContext {
  return {
    regulation:      { ...CHAMPIONS_M_A, ...overrides },
    championsRoster: roster,
  };
}

// ─── TeamMember factory ───────────────────────────────────────────────────────

let _slotCounter = 1;

/** Resets the auto-incrementing slot counter between tests. */
export function resetSlot(): void { _slotCounter = 1; }

/**
 * Creates a minimal TeamMember for tests.
 * Pass `slug` — the engine validator reads `_resolvedSlug` internally.
 */
export function makeMember(
  slug:     string,
  overrides: Partial<TeamMember> = {},
): TeamMember & { _resolvedSlug: string } {
  const slot = (_slotCounter++ as 1 | 2 | 3 | 4 | 5 | 6);
  return {
    id:             `member-${slot}`,
    teamId:         'team-1',
    slot,
    speciesId:      0,       // not used by validator
    formName:       null,
    nickname:       null,
    level:          50,
    item:           null,
    ability:        'none',
    teraType:       null,
    nature:         'Hardy',
    evSpread:       { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivSpread:       { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves:          ['', '', '', ''],
    roles:          [],
    roleOverridden: false,
    _resolvedSlug:  slug,
    ...overrides,
  };
}

export function makeTeam(slugs: string[]): ReturnType<typeof makeMember>[] {
  resetSlot();
  return slugs.map((s) => makeMember(s));
}
