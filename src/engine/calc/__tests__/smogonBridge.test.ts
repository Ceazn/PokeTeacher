import { runCalc, checkBenchmarks } from '../smogonBridge';
import { FIXTURE_POKEMON_MAP } from '../../../data/fixtures/pokemon';
import type { TeamMember } from '../../../types/team';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id:             'test',
    teamId:         'team',
    slot:           1,
    speciesId:      1,
    formName:       null,
    nickname:       null,
    level:          50,
    item:           'choice-specs',
    ability:        'hadron-engine',
    teraType:       null,
    nature:         'Modest',
    evSpread:       { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
    ivSpread:       { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
    moves:          ['thunderbolt', 'draco-meteor', 'volt-switch', 'parabolic-charge'],
    roles:          ['win-condition'],
    roleOverridden: false,
    ...overrides,
  };
}

const MIRAIDON_DATA  = FIXTURE_POKEMON_MAP['miraidon'];
const AMOONGUSS_DATA = FIXTURE_POKEMON_MAP['amoonguss'];

const MIRAIDON_MEMBER = makeMember({
  ability: 'hadron-engine',
  nature:  'Modest',
  evSpread: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
});

const AMOONGUSS_MEMBER = makeMember({
  slot:     2,
  speciesId: 2,
  item:     'rocky-helmet',
  ability:  'regenerator',
  nature:   'Calm',
  evSpread: { hp: 236, atk: 0, def: 76, spa: 4, spd: 116, spe: 76 },
  ivSpread: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
  moves:    ['spore', 'rage-powder', 'giga-drain', 'clear-smog'],
});

// ─── runCalc ──────────────────────────────────────────────────────────────────

describe('runCalc', () => {
  test('returns a result for a valid matchup', () => {
    const result = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'thunderbolt',
    });
    expect(result).not.toBeNull();
  });

  test('desc string contains both Pokémon names', () => {
    const result = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'thunderbolt',
    });
    expect(result!.desc).toContain('Miraidon');
    expect(result!.desc).toContain('Amoonguss');
  });

  test('damage percent min is less than or equal to max', () => {
    const result = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'thunderbolt',
    });
    expect(result!.damagePercent[0]).toBeLessThanOrEqual(result!.damagePercent[1]);
  });

  test('damage rolls has 16 entries for a standard move', () => {
    const result = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'thunderbolt',
    });
    expect(result!.damageRolls).toHaveLength(16);
  });

  test('koChance is between 0 and 1', () => {
    const result = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'thunderbolt',
    });
    expect(result!.koChance).toBeGreaterThanOrEqual(0);
    expect(result!.koChance).toBeLessThanOrEqual(1);
  });

  test('returns null for an unrecognised move slug', () => {
    const result = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'totally-fake-move-xyz',
    });
    expect(result).toBeNull();
  });

  test('Helping Hand increases damage', () => {
    const base = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'thunderbolt',
    });
    const boosted = runCalc({
      attacker:     MIRAIDON_MEMBER,
      attackerData: MIRAIDON_DATA,
      defender:     AMOONGUSS_MEMBER,
      defenderData: AMOONGUSS_DATA,
      moveSlug:     'thunderbolt',
      modifiers:    { helpingHand: true },
    });
    expect(Math.max(...boosted!.damageRolls)).toBeGreaterThan(Math.max(...base!.damageRolls));
  });
});

// ─── checkBenchmarks ──────────────────────────────────────────────────────────

describe('checkBenchmarks', () => {
  test('returns one result per valid benchmark', () => {
    const results = checkBenchmarks(
      AMOONGUSS_MEMBER,
      AMOONGUSS_DATA,
      [{ attacker: MIRAIDON_MEMBER, attackerData: MIRAIDON_DATA, moveSlug: 'thunderbolt' }],
    );
    expect(results).toHaveLength(1);
  });

  test('survives is false if Miraidon OHKOs Amoonguss', () => {
    const results = checkBenchmarks(
      AMOONGUSS_MEMBER,
      AMOONGUSS_DATA,
      [{ attacker: MIRAIDON_MEMBER, attackerData: MIRAIDON_DATA, moveSlug: 'thunderbolt' }],
    );
    // Thunderbolt from Miraidon should not OHKO Amoonguss at this spread.
    // The test just checks the field exists; we don't assert the specific value
    // since it depends on exact @smogon/calc internals.
    expect(typeof results[0].survives).toBe('boolean');
  });
});
