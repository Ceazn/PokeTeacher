import { TYPE_CHART } from '../../../data/fixtures/typeChart';
import { computeOffensiveDetail } from '../offensive';
import type { PokemonType } from '../../../types/pokemon';

function score(a: PokemonType[], b: PokemonType[]): number {
  return computeOffensiveDetail(a, b, TYPE_CHART).score;
}
function detail(a: PokemonType[], b: PokemonType[]) {
  return computeOffensiveDetail(a, b, TYPE_CHART);
}

// ─── Coverage breadth ─────────────────────────────────────────────────────────

describe('coverage breadth', () => {
  test('same STAB on both Pokémon scores lower than complementary STABs', () => {
    const sameType = score(['Water'], ['Water']);
    const different = score(['Water'], ['Fire']);
    expect(different).toBeGreaterThan(sameType);
  });

  test('wide-coverage pair (Fighting + Ghost) leaves few types uncovered', () => {
    // Fighting SE vs: Normal, Ice, Rock, Dark, Steel
    // Ghost SE vs: Psychic, Ghost
    const d = detail(['Fighting'], ['Ghost']);
    expect(d.uncoveredTypes.length).toBeLessThan(12);
  });

  test('Ground + Electric combination covers many types', () => {
    // Ground SE vs: Fire, Electric, Poison, Rock, Steel
    // Electric SE vs: Flying, Water
    const d = detail(['Ground'], ['Electric']);
    const covered = new Set([...d.seTypesA, ...d.seTypesB]);
    expect(covered.size).toBeGreaterThanOrEqual(6);
  });
});

// ─── Gap-filling ──────────────────────────────────────────────────────────────

describe('gap-filling', () => {
  test('complementary types have non-empty uniqueGapsFilled', () => {
    // Fire and Water cover completely different types
    const d = detail(['Fire'], ['Water']);
    expect(d.uniqueGapsFilled.length).toBeGreaterThan(0);
  });

  test('identical STAB types have no gap-filling', () => {
    const d = detail(['Grass'], ['Grass']);
    expect(d.uniqueGapsFilled).toHaveLength(0);
  });

  test('seTypesA and seTypesB are populated correctly', () => {
    // Fire hits: Grass, Bug, Ice, Steel super-effectively
    const d = detail(['Fire'], ['Water']);
    expect(d.seTypesA).toContain('Grass');
    expect(d.seTypesA).toContain('Ice');
    expect(d.seTypesA).toContain('Steel');
    // Water hits: Fire, Ground, Rock
    expect(d.seTypesB).toContain('Fire');
    expect(d.seTypesB).toContain('Ground');
    expect(d.seTypesB).toContain('Rock');
  });
});

// ─── Symmetry ─────────────────────────────────────────────────────────────────

describe('symmetry', () => {
  const pairs: [PokemonType[], PokemonType[]][] = [
    [['Fire'], ['Water']],
    [['Grass'], ['Poison']],
    [['Fighting', 'Steel'], ['Ghost', 'Fairy']],
    [['Dragon'], ['Fairy']],
  ];
  test.each(pairs)('score(%s, %s) === score(%s, %s)', (a, b) => {
    expect(score(a, b)).toBeCloseTo(score(b, a), 10);
  });
});

// ─── Score bounds ─────────────────────────────────────────────────────────────

describe('score bounds', () => {
  const pairs: [PokemonType[], PokemonType[]][] = [
    [['Normal'], ['Normal']],
    [['Fighting'], ['Ghost']],
    [['Fire', 'Flying'], ['Water', 'Rock']],
    [['Psychic', 'Steel'], ['Dark', 'Fairy']],
  ];
  test.each(pairs)('score(%s, %s) is within [0, 1]', (a, b) => {
    const s = score(a, b);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

// ─── Uncovered types ─────────────────────────────────────────────────────────

describe('uncovered types', () => {
  test('a pair with good coverage leaves few uncovered types', () => {
    // Ground + Fire + Water coverage is broad
    const d = detail(['Ground', 'Fire'], ['Water', 'Electric']);
    expect(d.uncoveredTypes.length).toBeLessThan(8);
  });

  test('two Normal types leave many types uncovered (Normal has no SE coverage)', () => {
    // Normal type hits nothing SE — everything is uncovered
    const d = detail(['Normal'], ['Normal']);
    expect(d.seTypesA).toHaveLength(0);
    expect(d.seTypesB).toHaveLength(0);
    expect(d.uncoveredTypes.length).toBe(18);
    expect(d.score).toBeLessThan(0.2);
  });
});
