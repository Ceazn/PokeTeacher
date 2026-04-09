import { validateTeam } from '../validator';
import {
  makeContext,
  makeTeam,
  makeMember,
  resetSlot,
  TEST_ROSTER,
} from './helpers';

beforeEach(() => resetSlot());

// ─── Team size ────────────────────────────────────────────────────────────────

describe('team size', () => {
  test('valid 6-member team passes', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise', 'venusaur', 'amoonguss', 'incineroar']);
    const result = validateTeam(members, makeContext());
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('valid 4-member team passes (minimum)', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise', 'amoonguss']);
    const result = validateTeam(members, makeContext());
    expect(result.isValid).toBe(true);
  });

  test('3-member team fails TEAM_TOO_SMALL', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise']);
    const result = validateTeam(members, makeContext());
    expect(result.isValid).toBe(false);
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'TEAM_TOO_SMALL', slot: null }),
    );
  });

  test('7-member team fails TEAM_TOO_LARGE', () => {
    resetSlot();
    const members = [
      makeMember('pikachu'),
      makeMember('charizard'),
      makeMember('blastoise'),
      makeMember('venusaur'),
      makeMember('amoonguss'),
      makeMember('incineroar'),
      // Hack slot to 6 to force a 7th without slot constraint
      { ...makeMember('flutter-mane'), slot: 6 as const },
    ];
    const result = validateTeam(members as any, makeContext({ teamSize: { min: 4, max: 6, battleSize: 4 } }));
    expect(result.violations.some((v) => v.code === 'TEAM_TOO_LARGE')).toBe(true);
  });
});

// ─── Species ban ─────────────────────────────────────────────────────────────

describe('species ban', () => {
  test('banned species triggers SPECIES_BANNED', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise', 'mew']);
    const result = validateTeam(
      members,
      makeContext({ speciesBanlist: ['mew'] }, new Set([...TEST_ROSTER, 'mew'])),
    );
    expect(result.isValid).toBe(false);
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'SPECIES_BANNED', subject: 'mew', slot: 4 }),
    );
  });

  test('non-banned species does not trigger SPECIES_BANNED', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise', 'amoonguss']);
    const result = validateTeam(members, makeContext({ speciesBanlist: ['mew'] }));
    expect(result.violations.some((v) => v.code === 'SPECIES_BANNED')).toBe(false);
  });
});

// ─── Species pool (roster) ───────────────────────────────────────────────────

describe('species pool', () => {
  test('species not in Champions roster triggers SPECIES_NOT_ALLOWED', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise', 'deoxys']);
    const result = validateTeam(members, makeContext());  // TEST_ROSTER has no deoxys
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'SPECIES_NOT_ALLOWED', subject: 'deoxys' }),
    );
  });

  test('national-dex speciesSource allows anything', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise', 'deoxys']);
    const result = validateTeam(
      members,
      makeContext({ speciesSource: 'national-dex' }),
    );
    expect(result.violations.some((v) => v.code === 'SPECIES_NOT_ALLOWED')).toBe(false);
  });

  test('explicit allowlist rejects species not in list', () => {
    const members = makeTeam(['pikachu', 'charizard', 'blastoise', 'amoonguss']);
    const result = validateTeam(
      members,
      makeContext({ speciesSource: ['pikachu', 'charizard', 'blastoise', 'iron-bundle'] }),
    );
    // amoonguss not in the allowlist
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'SPECIES_NOT_ALLOWED', subject: 'amoonguss' }),
    );
  });
});

// ─── Restricted pool ─────────────────────────────────────────────────────────

describe('restricted pool', () => {
  test('two restricted Pokémon is within the limit', () => {
    const members = makeTeam(['miraidon', 'koraidon', 'amoonguss', 'incineroar']);
    const result = validateTeam(members, makeContext());
    expect(result.violations.some((v) => v.code === 'RESTRICTED_LIMIT_EXCEEDED')).toBe(false);
  });

  test('three restricted Pokémon exceeds the limit', () => {
    const members = makeTeam(['miraidon', 'koraidon', 'zacian', 'incineroar']);
    const result = validateTeam(members, makeContext());
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'RESTRICTED_LIMIT_EXCEEDED', slot: null }),
    );
  });

  test('same restricted Pokémon twice triggers RESTRICTED_DUPLICATE', () => {
    const members = makeTeam(['miraidon', 'miraidon', 'amoonguss', 'incineroar']);
    const result = validateTeam(members, makeContext());
    expect(result.violations.some((v) => v.code === 'RESTRICTED_DUPLICATE')).toBe(true);
  });

  test('restricted limit of 0 rejects any restricted Pokémon', () => {
    const members = makeTeam(['miraidon', 'pikachu', 'amoonguss', 'incineroar']);
    const result = validateTeam(members, makeContext({ restrictedLimit: 0 }));
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'RESTRICTED_LIMIT_EXCEEDED' }),
    );
  });
});

// ─── Species clause ───────────────────────────────────────────────────────────

describe('species clause', () => {
  test('duplicate species triggers SPECIES_CLAUSE', () => {
    const members = makeTeam(['pikachu', 'pikachu', 'amoonguss', 'incineroar']);
    const result = validateTeam(members, makeContext());
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'SPECIES_CLAUSE', subject: 'pikachu' }),
    );
  });

  test('no duplicate species passes species clause', () => {
    const members = makeTeam(['pikachu', 'charizard', 'amoonguss', 'incineroar']);
    const result = validateTeam(members, makeContext());
    expect(result.violations.some((v) => v.code === 'SPECIES_CLAUSE')).toBe(false);
  });

  test('species clause inactive when not in clauseList', () => {
    const members = makeTeam(['pikachu', 'pikachu', 'amoonguss', 'incineroar']);
    const result = validateTeam(members, makeContext({ clauseList: [] }));
    expect(result.violations.some((v) => v.code === 'SPECIES_CLAUSE')).toBe(false);
  });
});

// ─── Banned moves ─────────────────────────────────────────────────────────────

describe('banned moves', () => {
  test('banned move triggers MOVE_BANNED with correct slot', () => {
    resetSlot();
    const members = [
      makeMember('pikachu'),
      makeMember('charizard'),
      makeMember('amoonguss'),
      { ...makeMember('incineroar'), moves: ['fake-out', 'u-turn', 'dark-pulse', 'baton-pass'] as [string,string,string,string] },
    ];
    const result = validateTeam(
      members,
      makeContext({ moveBanlist: ['baton-pass'] }),
    );
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'MOVE_BANNED', subject: 'baton-pass', slot: 4 }),
    );
  });
});

// ─── Banned items ─────────────────────────────────────────────────────────────

describe('banned items', () => {
  test('banned item triggers ITEM_BANNED', () => {
    resetSlot();
    const members = [
      makeMember('pikachu'),
      makeMember('charizard'),
      makeMember('amoonguss'),
      { ...makeMember('incineroar'), item: 'soul-dew' },
    ];
    const result = validateTeam(
      members,
      makeContext({ itemBanlist: ['soul-dew'] }),
    );
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: 'ITEM_BANNED', subject: 'soul-dew', slot: 4 }),
    );
  });
});

// ─── Multiple violations ─────────────────────────────────────────────────────

describe('multiple violations', () => {
  test('collects all violations in one pass', () => {
    resetSlot();
    const members = [
      // banned species
      { ...makeMember('mew'), _resolvedSlug: 'mew' } as any,
      // not in roster
      { ...makeMember('deoxys'), _resolvedSlug: 'deoxys' } as any,
      makeMember('amoonguss'),
      makeMember('incineroar'),
    ];
    const result = validateTeam(
      members,
      makeContext(
        { speciesBanlist: ['mew'] },
        new Set([...TEST_ROSTER, 'mew']),  // mew is in roster but also banned
      ),
    );
    const codes = result.violations.map((v) => v.code);
    expect(codes).toContain('SPECIES_BANNED');
    expect(codes).toContain('SPECIES_NOT_ALLOWED');
    expect(result.isValid).toBe(false);
  });
});
