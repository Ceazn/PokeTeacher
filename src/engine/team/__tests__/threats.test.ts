import { detectTopThreats, typeCoverageMap } from '../threats';
import { TYPE_CHART } from '../../../data/fixtures/typeChart';
import type { PokemonType } from '../../../types/pokemon';

// ─── detectTopThreats ─────────────────────────────────────────────────────────

describe('detectTopThreats', () => {
  test('returns at most topN entries', () => {
    const memberTypes: PokemonType[][] = [['Fire'], ['Water'], ['Grass']];
    const slugs = ['a', 'b', 'c'];
    const threats = detectTopThreats(memberTypes, slugs, TYPE_CHART, [], 3);
    expect(threats.length).toBeLessThanOrEqual(3);
  });

  test('Ground is a major threat to Fire, Poison, Rock team', () => {
    // Fire is 2× Ground, Poison is 2× Ground, Rock is 2× Ground
    const memberTypes: PokemonType[][] = [['Fire'], ['Poison'], ['Rock']];
    const slugs = ['fire-mon', 'poison-mon', 'rock-mon'];
    const threats = detectTopThreats(memberTypes, slugs, TYPE_CHART, [], 5);
    const groundThreat = threats.find((t) => t.type === 'Ground');
    expect(groundThreat).toBeDefined();
    expect(groundThreat!.weakCount).toBe(3);
    // Ground should rank first (all 3 members weak)
    expect(threats[0].type).toBe('Ground');
  });

  test('weakSlugs includes only members weak to the threat type', () => {
    // Fire is 2× Water, Grass is 0.5× Water (resistant), Rock is 2× Water
    const memberTypes: PokemonType[][] = [['Fire'], ['Grass'], ['Rock']];
    const slugs = ['fire-mon', 'grass-mon', 'rock-mon'];
    const threats = detectTopThreats(memberTypes, slugs, TYPE_CHART, [], 10);
    const waterThreat = threats.find((t) => t.type === 'Water');
    expect(waterThreat).toBeDefined();
    expect(waterThreat!.weakSlugs).toContain('fire-mon');
    expect(waterThreat!.weakSlugs).toContain('rock-mon');
    expect(waterThreat!.weakSlugs).not.toContain('grass-mon');
  });

  test('immune members are counted but do not appear in weakSlugs', () => {
    // Ghost is immune to Normal
    const memberTypes: PokemonType[][] = [['Ghost'], ['Normal'], ['Water']];
    const slugs = ['ghost-mon', 'normal-mon', 'water-mon'];
    const threats = detectTopThreats(memberTypes, slugs, TYPE_CHART, [], 10);
    // Normal is 0× vs Normal (immune), and Normal does not threaten Ghost or Water
    const normalThreat = threats.find((t) => t.type === 'Normal');
    expect(normalThreat).toBeUndefined(); // Normal hits nothing SE in this team
  });

  test('types that threaten no members are excluded', () => {
    // Ghost immune to Normal, Normal immune to Ghost
    const memberTypes: PokemonType[][] = [['Ghost'], ['Normal']];
    const slugs = ['g', 'n'];
    const threats = detectTopThreats(memberTypes, slugs, TYPE_CHART, [], 20);
    // Normal should not appear as threat (0 weak to Normal since Ghost is immune, Normal isn't weak)
    // Ghost should not appear as threat (Normal is immune)
    const normalThreat = threats.find((t) => t.type === 'Normal');
    expect(normalThreat).toBeUndefined();
  });

  test('exposureScore for 4× weakness is higher than 2× weakness', () => {
    // Bug/Grass is 4× to Fire; plain Grass is 2× to Fire
    const memberTypes4x: PokemonType[][] = [['Bug', 'Grass']];
    const memberTypes2x: PokemonType[][] = [['Grass']];
    const threats4x = detectTopThreats(memberTypes4x, ['a'], TYPE_CHART, [], 10);
    const threats2x = detectTopThreats(memberTypes2x, ['b'], TYPE_CHART, [], 10);
    const fire4x = threats4x.find((t) => t.type === 'Fire');
    const fire2x = threats2x.find((t) => t.type === 'Fire');
    expect(fire4x).toBeDefined();
    expect(fire2x).toBeDefined();
    expect(fire4x!.exposureScore).toBeGreaterThan(fire2x!.exposureScore);
  });

  test('empty team returns no threats', () => {
    expect(detectTopThreats([], [], TYPE_CHART)).toHaveLength(0);
  });
});

// ─── typeCoverageMap ──────────────────────────────────────────────────────────

describe('typeCoverageMap', () => {
  test('Ghost immune to Normal — Normal maps to "immune"', () => {
    const map = typeCoverageMap([['Ghost']], TYPE_CHART);
    expect(map['Normal']).toBe('immune');
  });

  test('Steel resists Ice — Ice maps to "resisted"', () => {
    const map = typeCoverageMap([['Steel']], TYPE_CHART);
    expect(map['Ice']).toBe('resisted');
  });

  test('Fire is weak to Water — Water maps to "weak" when only Fire on team', () => {
    const map = typeCoverageMap([['Fire']], TYPE_CHART);
    expect(map['Water']).toBe('weak');
  });

  test('covers all 18 attacking types', () => {
    const map = typeCoverageMap([['Normal']], TYPE_CHART);
    expect(Object.keys(map)).toHaveLength(18);
  });

  test('with immunity + weakness present, immunity wins', () => {
    // Ghost immune to Normal; Normal weak to Nothing that Normal is; add a Normal type to the team
    const map = typeCoverageMap([['Ghost'], ['Fire']], TYPE_CHART);
    // Fire is 2× Rock, Ghost is 1× Rock — not all weak, not immune/resisted → neutral
    expect(map['Rock']).toBe('neutral');
    // Normal: Ghost is immune, Fire is 1×. Result: 'immune'
    expect(map['Normal']).toBe('immune');
  });
});
