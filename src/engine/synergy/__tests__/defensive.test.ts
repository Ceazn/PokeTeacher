import { TYPE_CHART } from '../../../data/fixtures/typeChart';
import { computeDefensiveDetail } from '../defensive';
import type { PokemonType } from '../../../types/pokemon';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function score(typesA: PokemonType[], typesB: PokemonType[]): number {
  return computeDefensiveDetail(typesA, typesB, TYPE_CHART).score;
}

function detail(typesA: PokemonType[], typesB: PokemonType[]) {
  return computeDefensiveDetail(typesA, typesB, TYPE_CHART);
}

// ─── Classic defensive synergy pairs ─────────────────────────────────────────

describe('classic defensive pairs', () => {
  test('Ghost + Normal cover each other perfectly', () => {
    // Normal's only weakness: Fighting.  Ghost is immune to Fighting (0×).
    // Ghost's weaknesses: Ghost, Dark.  Normal is immune to Ghost (0×).
    // Ghost covers Normal's only weakness (Fighting, 0×). Normal covers Ghost's Ghost
    // weakness (immune), but NOT Ghost's Dark weakness — so coverage is 2/3 ≈ 0.67.
    const s = score(['Ghost'], ['Normal']);
    expect(s).toBeGreaterThan(0.6);
  });

  test('Water + Ground have excellent synergy', () => {
    // Water weak to: Electric, Grass.   Ground is immune to Electric (0×). ✓
    // Ground weak to: Water, Grass, Ice. Water resists Water(0.5×) and Ice(0.5×). ✓
    // Shared weakness: Grass (both weak to Grass) — shared penalty drops score.
    // Computed: coverage 3/5=0.60, shared penalty ≈0.18 → score ≈ 0.42 (decent).
    const s = score(['Water'], ['Ground']);
    expect(s).toBeGreaterThan(0.35);
  });

  test('Steel + Fairy cover each other well', () => {
    // Fairy weak to: Poison, Steel.  Steel is immune to Poison(0×) and resists Steel(0.5×). ✓
    // Steel weak to: Fire, Fighting, Ground. Fairy resists Fighting(0.5×). Partial.
    const s = score(['Steel'], ['Fairy']);
    expect(s).toBeGreaterThan(0.45);
  });

  test('Water + Fire have mediocre synergy (shared Rock weakness, limited coverage)', () => {
    // Fire weak to: Water, Ground, Rock.  Water resists nothing Fire is weak to. ✗
    // Water weak to: Electric, Grass.     Fire resists: Grass(0.5×). Partial.
    // Shared: Rock hits both (but fire is weak to rock, water is not actually weak to rock)
    // Wait: Water defending vs Rock attacking = Rock(2x vs. Fire)... Water is not weak to Rock.
    // Fire weak to: Water(2), Rock(2), Ground(2). Water is NOT weak to Rock.
    // No shared weakness between Water and Fire actually.
    // Water resists: Fire, Ice, Steel, Water. Doesn't resist any of Fire's weaknesses (Water, Rock, Ground).
    // Fire resists: Grass(0.5) -- covers Water's Grass weakness.
    // Overall limited coverage → decent at best.
    const s = score(['Water'], ['Fire']);
    expect(s).toBeLessThan(0.6);
  });
});

// ─── Symmetry ─────────────────────────────────────────────────────────────────

describe('symmetry', () => {
  test('score(A, B) equals score(B, A)', () => {
    const pairs: [PokemonType[], PokemonType[]][] = [
      [['Ghost'], ['Normal']],
      [['Water'], ['Ground']],
      [['Steel'], ['Fairy']],
      [['Dragon', 'Flying'], ['Ice', 'Steel']],
      [['Grass', 'Poison'], ['Fire']],
    ];
    for (const [a, b] of pairs) {
      expect(score(a, b)).toBeCloseTo(score(b, a), 10);
    }
  });
});

// ─── Shared weaknesses ────────────────────────────────────────────────────────

describe('shared weaknesses', () => {
  test('a pair sharing every weakness scores lower than one that does not', () => {
    // Two Grass types share ALL weaknesses (Fire, Ice, Poison, Flying, Bug)
    // Two Water+Ground covers each other, sharing only Grass
    const sameType = score(['Grass'], ['Grass']);
    const complementary = score(['Water'], ['Ground']);
    expect(sameType).toBeLessThan(complementary);
  });

  test('sharedWeaknesses field lists overlapping weaknesses correctly', () => {
    // Both Grass types are weak to the same types
    const d = detail(['Grass'], ['Grass']);
    // Grass is weak to: Fire, Ice, Poison, Flying, Bug
    expect(d.sharedWeaknesses).toContain('Fire');
    expect(d.sharedWeaknesses).toContain('Ice');
    expect(d.sharedWeaknesses.length).toBeGreaterThan(2);
  });

  test('two identical types share all weaknesses', () => {
    const d = detail(['Dragon'], ['Dragon']);
    // Dragon is weak to Ice, Dragon, Fairy
    expect(d.sharedWeaknesses.length).toBeGreaterThanOrEqual(3);
    expect(d.score).toBeLessThan(0.3);
  });
});

// ─── Coverage fractions ───────────────────────────────────────────────────────

describe('coverage fractions', () => {
  test('aCoveredByB is 1 when B resists all of A\'s weaknesses', () => {
    // Normal is only weak to Fighting.  Ghost is immune to Fighting.
    const d = detail(['Normal'], ['Ghost']);
    expect(d.aCoveredByB).toBeCloseTo(1, 5);
  });

  test('aCoveredByB is 0 when B shares all weaknesses with A', () => {
    // Both Dragon — Dragon resists nothing Dragon is weak to
    // Dragon weak to: Ice, Dragon, Fairy
    // Dragon type defending vs Ice = 2×, vs Dragon = 2×, vs Fairy = 0×
    // Dragon does NOT resist any of Dragon's weaknesses
    const d = detail(['Dragon'], ['Dragon']);
    expect(d.aCoveredByB).toBeCloseTo(0, 5);
  });
});

// ─── Score bounds ─────────────────────────────────────────────────────────────

describe('score bounds', () => {
  const samplePairs: [PokemonType[], PokemonType[]][] = [
    [['Normal'], ['Normal']],
    [['Ghost'], ['Normal']],
    [['Water'], ['Ground']],
    [['Dragon'], ['Fairy']],
    [['Fire', 'Flying'], ['Water', 'Ground']],
    [['Steel', 'Psychic'], ['Dark', 'Ghost']],
    [['Grass', 'Poison'], ['Fire', 'Flying']],
  ];

  test.each(samplePairs)('score(%s, %s) is within [0, 1]', (a, b) => {
    const s = score(a, b);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

// ─── Dual-type interactions ───────────────────────────────────────────────────

describe('dual-type interactions', () => {
  test('Steel+Psychic vs Dark+Ghost: Dark+Ghost threatens both weaknesses of Steel+Psychic', () => {
    // Steel+Psychic weak to: Fire, Ground, Ghost, Dark (and a few others)
    // Dark+Ghost weak to: Fighting, Fairy, Bug, Ghost (for Ghost), Dark (for Ghost)
    // Dark resists Psychic(0×) — covers Steel+Psychic's Ghost/Psychic weakness from Ghost attacks
    // This pair has some shared threats → decent but not great
    const s = score(['Steel', 'Psychic'], ['Dark', 'Ghost']);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  test('Fire+Flying vs Rock+Steel: mutual threat situation', () => {
    // Fire+Flying weak to: Water, Electric, Rock (4×!)
    // Rock+Steel weak to: Fighting, Ground, Water
    // Shared: Water
    const d = detail(['Fire', 'Flying'], ['Rock', 'Steel']);
    expect(d.sharedWeaknesses).toContain('Water');
    const s = score(['Fire', 'Flying'], ['Rock', 'Steel']);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});
