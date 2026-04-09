import { importFromShowdown, exportToShowdown, parsedMemberToTeamMember } from '../showdown';
import type { TeamMember } from '../../../types/team';

// ─── Sample pastes ────────────────────────────────────────────────────────────

const AMOONGUSS_PASTE = `\
Amoonguss @ Rocky Helmet
Ability: Regenerator
Level: 50
Tera Type: Water
EVs: 236 HP / 76 Def / 4 SpA / 116 SpD / 76 Spe
Calm Nature
IVs: 0 Atk
- Spore
- Rage Powder
- Giga Drain
- Clear Smog`;

const MIRAIDON_PASTE = `\
Miraidon @ Choice Specs
Ability: Hadron Engine
Level: 50
Tera Type: Electric
EVs: 252 SpA / 4 SpD / 252 Spe
Modest Nature
- Thunderbolt
- Draco Meteor
- Volt Switch
- Parabolic Charge`;

const NICKNAMED_PASTE = `\
Soggy (Politoed) @ Damp Rock
Ability: Drizzle
Level: 50
Tera Type: Water
EVs: 252 HP / 4 Def / 252 SpD
Calm Nature
- Scald
- Helping Hand
- Encore
- Protect`;

const TWO_MON_PASTE = `${AMOONGUSS_PASTE}\n\n${MIRAIDON_PASTE}`;

// ─── Import tests ─────────────────────────────────────────────────────────────

describe('importFromShowdown', () => {
  test('parses species slug correctly', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members).toHaveLength(1);
    expect(members[0].speciesSlug).toBe('amoonguss');
  });

  test('parses item', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members[0].item).toBe('rocky-helmet');
  });

  test('parses ability', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members[0].ability).toBe('regenerator');
  });

  test('parses level', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members[0].level).toBe(50);
  });

  test('parses tera type', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members[0].teraType).toBe('Water');
  });

  test('parses nature', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members[0].nature).toBe('Calm');
  });

  test('parses EVs', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    const evs = members[0].evSpread;
    expect(evs.hp).toBe(236);
    expect(evs.def).toBe(76);
    expect(evs.spa).toBe(4);
    expect(evs.spd).toBe(116);
    expect(evs.spe).toBe(76);
    expect(evs.atk).toBe(0);  // not listed → defaults to 0
  });

  test('parses IVs (non-31 values)', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members[0].ivSpread.atk).toBe(0);
    expect(members[0].ivSpread.hp).toBe(31);  // not listed → defaults to 31
  });

  test('parses all 4 moves', () => {
    const { members } = importFromShowdown(AMOONGUSS_PASTE);
    expect(members[0].moves).toEqual(['spore', 'rage-powder', 'giga-drain', 'clear-smog']);
  });

  test('parses nickname from "Name (Species)" format', () => {
    const { members } = importFromShowdown(NICKNAMED_PASTE);
    expect(members[0].nickname).toBe('Soggy');
    expect(members[0].speciesSlug).toBe('politoed');
  });

  test('parses a two-Pokémon paste into two members', () => {
    const { members } = importFromShowdown(TWO_MON_PASTE);
    expect(members).toHaveLength(2);
    expect(members[0].speciesSlug).toBe('amoonguss');
    expect(members[1].speciesSlug).toBe('miraidon');
  });

  test('no item is null', () => {
    const paste = `Pikachu\nAbility: Static\nNature Hardy Nature\n- Thunderbolt\n- Quick Attack\n- Iron Tail\n- Charm`;
    const { members } = importFromShowdown(paste);
    expect(members[0].item).toBeNull();
  });

  test('produces no warnings on a clean paste', () => {
    const { warnings } = importFromShowdown(AMOONGUSS_PASTE);
    expect(warnings).toHaveLength(0);
  });

  test('returns empty members for empty input', () => {
    const { members } = importFromShowdown('');
    expect(members).toHaveLength(0);
  });

  test('pads moves to 4 when fewer than 4 are listed', () => {
    const paste = `Amoonguss\nAbility: Regenerator\nCalm Nature\n- Spore`;
    const { members } = importFromShowdown(paste);
    expect(members[0].moves).toHaveLength(4);
    expect(members[0].moves[1]).toBe('');
  });
});

// ─── Export tests ─────────────────────────────────────────────────────────────

describe('exportToShowdown', () => {
  const slugMap: Record<number, string> = { 1: 'Amoonguss', 2: 'Miraidon' };

  function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
    return {
      id:             'test-id',
      teamId:         'team-id',
      slot:           1,
      speciesId:      1,
      formName:       null,
      nickname:       null,
      level:          50,
      item:           'rocky-helmet',
      ability:        'regenerator',
      teraType:       'Water',
      nature:         'Calm',
      evSpread:       { hp: 236, atk: 0, def: 76, spa: 4, spd: 116, spe: 76 },
      ivSpread:       { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
      moves:          ['spore', 'rage-powder', 'giga-drain', 'clear-smog'],
      roles:          [],
      roleOverridden: false,
      ...overrides,
    };
  }

  test('includes species name and item on first line', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).toMatch(/^Amoonguss @ Rocky Helmet/);
  });

  test('includes ability line', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).toContain('Ability: Regenerator');
  });

  test('includes tera type when set', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).toContain('Tera Type: Water');
  });

  test('includes EVs with only non-zero stats', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).toContain('EVs:');
    expect(out).not.toContain('0 HP'); // hp is 236, but atk (0) should be absent
    expect(out).toContain('236 HP');
  });

  test('includes IVs line only when a stat is non-31', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).toContain('IVs: 0 Atk');
  });

  test('omits IVs line when all stats are 31', () => {
    const m = makeMember({ ivSpread: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } });
    const out = exportToShowdown([m], slugMap);
    expect(out).not.toContain('IVs:');
  });

  test('includes nature line', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).toContain('Calm Nature');
  });

  test('includes all 4 moves', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).toContain('- Spore');
    expect(out).toContain('- Rage Powder');
    expect(out).toContain('- Giga Drain');
    expect(out).toContain('- Clear Smog');
  });

  test('omits level line when level is 50', () => {
    const out = exportToShowdown([makeMember()], slugMap);
    expect(out).not.toContain('Level:');
  });

  test('includes level line when level differs from 50', () => {
    const out = exportToShowdown([makeMember({ level: 100 })], slugMap);
    expect(out).toContain('Level: 100');
  });

  test('includes nickname in "Nickname (Species)" format', () => {
    const m = makeMember({ nickname: 'Soggy' });
    const out = exportToShowdown([m], slugMap);
    expect(out).toMatch(/^Soggy \(Amoonguss\)/);
  });

  test('two members are separated by a blank line', () => {
    const m1 = makeMember({ speciesId: 1 });
    const m2 = makeMember({ speciesId: 2, slot: 2 });
    const out = exportToShowdown([m1, m2], slugMap);
    expect(out).toContain('\n\n');
  });
});

// ─── Round-trip test ──────────────────────────────────────────────────────────

describe('round-trip (import → export → import)', () => {
  test('Amoonguss paste survives a full round-trip', () => {
    const { members: imported } = importFromShowdown(AMOONGUSS_PASTE);
    const teamMember = parsedMemberToTeamMember(imported[0], 999, 'team-1', 1);
    // Export using the same display name we'd resolve from the slug
    const exported = exportToShowdown(
      [teamMember],
      { 999: 'Amoonguss' },
    );
    const { members: reimported } = importFromShowdown(exported);
    expect(reimported[0].speciesSlug).toBe('amoonguss');
    expect(reimported[0].nature).toBe(imported[0].nature);
    expect(reimported[0].evSpread).toEqual(imported[0].evSpread);
    expect(reimported[0].moves).toEqual(imported[0].moves);
  });
});
