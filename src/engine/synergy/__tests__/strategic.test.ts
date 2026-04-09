import { combosToScore, detectCombos } from '../strategic';
import type { PokemonWithRole } from '../types';
import type { PokemonType } from '../../../types/pokemon';
import type { RoleTag } from '../../../types/team';

// ─── Fixture factory ─────────────────────────────────────────────────────────

function makeMon(
  slug:        string,
  roles:       RoleTag[],
  abilityTags: PokemonWithRole['abilityTags'] = [],
): PokemonWithRole {
  return {
    slug,
    displayName: slug.charAt(0).toUpperCase() + slug.slice(1),
    types:          ['Normal'] as PokemonType[],
    offensiveTypes: ['Normal'] as PokemonType[],
    baseStats:      { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
    abilityTags,
    moveTags:       [],
    roles,
    teraType:       null,
  };
}

// ─── Weather cores ────────────────────────────────────────────────────────────

describe('weather combos', () => {
  test('rain setter + rain abuser → weather:rain combo', () => {
    const politoed  = makeMon('politoed', ['setter:rain']);
    const kingdra   = makeMon('kingdra',  ['abuser:rain']);
    const combos    = detectCombos([politoed, kingdra]);
    expect(combos.map((c) => c.name)).toContain('weather:rain');
  });

  test('sun setter + sun abuser → weather:sun combo', () => {
    const ninetales = makeMon('ninetales',  ['setter:sun']);
    const venusaur  = makeMon('venusaur',   ['abuser:sun']);
    const combos    = detectCombos([ninetales, venusaur]);
    expect(combos.map((c) => c.name)).toContain('weather:sun');
  });

  test('rain setter + sun abuser → NO weather combo (wrong weather match)', () => {
    const politoed  = makeMon('politoed', ['setter:rain']);
    const venusaur  = makeMon('venusaur', ['abuser:sun']);
    const combos    = detectCombos([politoed, venusaur]);
    const weatherCombos = combos.filter((c) => c.name.startsWith('weather:'));
    expect(weatherCombos).toHaveLength(0);
  });

  test('two rain abusers with no setter → NO weather:rain combo', () => {
    const kingdra   = makeMon('kingdra',   ['abuser:rain']);
    const ludicolo  = makeMon('ludicolo',  ['abuser:rain']);
    const combos    = detectCombos([kingdra, ludicolo]);
    expect(combos.map((c) => c.name)).not.toContain('weather:rain');
  });

  test('weather combo includes correct memberSlugs', () => {
    const politoed  = makeMon('politoed', ['setter:rain']);
    const kingdra   = makeMon('kingdra',  ['abuser:rain']);
    const combos    = detectCombos([politoed, kingdra]);
    const rainCombo = combos.find((c) => c.name === 'weather:rain')!;
    expect(rainCombo.memberSlugs).toContain('politoed');
    expect(rainCombo.memberSlugs).toContain('kingdra');
  });
});

// ─── Trick Room ───────────────────────────────────────────────────────────────

describe('trick-room combo', () => {
  test('TR setter + TR abuser → trick-room combo', () => {
    const reuniclus = makeMon('reuniclus', ['setter:trick-room']);
    const hatterene = makeMon('hatterene', ['setter:trick-room', 'abuser:trick-room']);
    // reuniclus is the setter; trick-room fires if any member is an abuser
    const slowbro   = makeMon('slowbro',   ['abuser:trick-room']);
    const combos    = detectCombos([reuniclus, slowbro]);
    expect(combos.map((c) => c.name)).toContain('trick-room');
  });

  test('a Pokémon that is both setter and abuser does NOT fire a self-combo', () => {
    // A single mon can be setter:trick-room + abuser:trick-room, but the pair combo
    // requires two DIFFERENT members.
    const reuniclus = makeMon('reuniclus', ['setter:trick-room', 'abuser:trick-room']);
    const random    = makeMon('random',    ['flex']);
    const combos    = detectCombos([reuniclus, random]);
    expect(combos.map((c) => c.name)).not.toContain('trick-room');
  });
});

// ─── Fake Out protection ──────────────────────────────────────────────────────

describe('fake-out-protection combo', () => {
  test('fake-out + frail-attacker → fake-out-protection', () => {
    const incineroar   = makeMon('incineroar',  ['fake-out', 'bulky-support']);
    const flutterMane  = makeMon('flutter-mane', ['frail-attacker', 'win-condition']);
    const combos       = detectCombos([incineroar, flutterMane]);
    expect(combos.map((c) => c.name)).toContain('fake-out-protection');
  });

  test('fake-out + setup-sweeper → fake-out-protection', () => {
    const incineroar   = makeMon('incineroar', ['fake-out']);
    const dragonite    = makeMon('dragonite',  ['setup-sweeper']);
    const combos       = detectCombos([incineroar, dragonite]);
    expect(combos.map((c) => c.name)).toContain('fake-out-protection');
  });

  test('two fake-out users → NO fake-out-protection (no frail-attacker or setup-sweeper)', () => {
    const incin1 = makeMon('incineroar',  ['fake-out']);
    const incin2 = makeMon('incineroar-2', ['fake-out']);
    const combos = detectCombos([incin1, incin2]);
    expect(combos.map((c) => c.name)).not.toContain('fake-out-protection');
  });
});

// ─── Redirection core ────────────────────────────────────────────────────────

describe('redirection-core combo', () => {
  test('redirector + frail-attacker → redirection-core', () => {
    const amoonguss  = makeMon('amoonguss', ['redirector', 'bulky-support'], ['redirection']);
    const miraidon   = makeMon('miraidon',  ['frail-attacker', 'win-condition']);
    const combos     = detectCombos([amoonguss, miraidon]);
    expect(combos.map((c) => c.name)).toContain('redirection-core');
  });

  test('redirector + setup-sweeper → redirection-core', () => {
    const amoonguss = makeMon('amoonguss', ['redirector'], ['redirection']);
    const gyarados  = makeMon('gyarados',  ['setup-sweeper']);
    const combos    = detectCombos([amoonguss, gyarados]);
    expect(combos.map((c) => c.name)).toContain('redirection-core');
  });
});

// ─── Intimidate chain ────────────────────────────────────────────────────────

describe('intimidate-chain combo', () => {
  test('two Intimidate users → intimidate-chain', () => {
    const incineroar = makeMon('incineroar', ['bulky-support'], ['intimidate']);
    const landorusT  = makeMon('landorus-t', ['pivot'],         ['intimidate']);
    const combos     = detectCombos([incineroar, landorusT]);
    expect(combos.map((c) => c.name)).toContain('intimidate-chain');
  });

  test('one Intimidate user → no intimidate-chain', () => {
    const incineroar = makeMon('incineroar', ['bulky-support'], ['intimidate']);
    const miraidon   = makeMon('miraidon',   ['win-condition']);
    const combos     = detectCombos([incineroar, miraidon]);
    expect(combos.map((c) => c.name)).not.toContain('intimidate-chain');
  });
});

// ─── Deduplication ───────────────────────────────────────────────────────────

describe('deduplication', () => {
  test('same combo does not appear twice in a 3-member group', () => {
    // rain setter + two rain abusers → weather:rain fires for both pairs
    // but should only appear once after deduplication.
    const politoed = makeMon('politoed', ['setter:rain']);
    const kingdra  = makeMon('kingdra',  ['abuser:rain']);
    const ludicolo = makeMon('ludicolo', ['abuser:rain']);
    const combos   = detectCombos([politoed, kingdra, ludicolo]);
    const rainCombos = combos.filter((c) => c.name === 'weather:rain');
    expect(rainCombos).toHaveLength(1);
  });
});

// ─── combosToScore ────────────────────────────────────────────────────────────

describe('combosToScore', () => {
  test('no combos → score 0', () => {
    expect(combosToScore([])).toBe(0);
  });

  test('one combo → COMBO_SCORE_PER_COMBO', () => {
    const politoed = makeMon('politoed', ['setter:rain']);
    const kingdra  = makeMon('kingdra',  ['abuser:rain']);
    const combos   = detectCombos([politoed, kingdra]);
    expect(combosToScore(combos)).toBeGreaterThan(0);
    expect(combosToScore(combos)).toBeLessThanOrEqual(1);
  });

  test('many combos are capped at COMBO_SCORE_MAX', () => {
    const fakeMany = Array.from({ length: 10 }, (_, i) =>
      makeMon(`mon-${i}`, ['setter:rain', 'abuser:rain', 'redirector', 'frail-attacker']),
    );
    const combos = detectCombos(fakeMany);
    expect(combosToScore(combos)).toBeLessThanOrEqual(1);
  });
});
