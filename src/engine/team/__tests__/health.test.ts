import { buildHealthReport, rankThreats } from '../health';
import type { TeamSynergyResult } from '../../synergy/types';
import type { Archetype } from '../../../types/team';

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeSynergyResult(overrides: Partial<TeamSynergyResult> = {}): TeamSynergyResult {
  return {
    pairScores: {
      'amoonguss+miraidon': {
        pairKey:         'amoonguss+miraidon',
        defensiveScore:  0.8,
        offensiveScore:  0.7,
        roleScore:       0.9,
        strategicScore:  0.6,
        totalScore:      0.75,
        tier:            'strong',
        defensiveDetail: {
          aCoveredByB: 0.8, bCoveredByA: 0.7,
          sharedWeaknesses: [], score: 0.8,
        },
        offensiveDetail: {
          seTypesA: ['Fire'], seTypesB: ['Water'],
          uniqueGapsFilled: ['Ice'], uncoveredTypes: [],
          score: 0.7,
        },
        combos:       [],
        explanation:  'Strong pair',
      },
      'amoonguss+incineroar': {
        pairKey:         'amoonguss+incineroar',
        defensiveScore:  0.3,
        offensiveScore:  0.4,
        roleScore:       0.5,
        strategicScore:  0.2,
        totalScore:      0.35,
        tier:            'decent',
        defensiveDetail: {
          aCoveredByB: 0.3, bCoveredByA: 0.4,
          sharedWeaknesses: ['Fire'], score: 0.3,
        },
        offensiveDetail: {
          seTypesA: [], seTypesB: ['Fire'],
          uniqueGapsFilled: [], uncoveredTypes: ['Dragon'],
          score: 0.4,
        },
        combos:       [],
        explanation:  'Decent pair',
      },
      'miraidon+incineroar': {
        pairKey:         'miraidon+incineroar',
        defensiveScore:  0.6,
        offensiveScore:  0.55,
        roleScore:       0.7,
        strategicScore:  0.5,
        totalScore:      0.60,
        tier:            'strong',
        defensiveDetail: {
          aCoveredByB: 0.6, bCoveredByA: 0.65,
          sharedWeaknesses: [], score: 0.6,
        },
        offensiveDetail: {
          seTypesA: ['Water'], seTypesB: ['Dragon'],
          uniqueGapsFilled: [], uncoveredTypes: [],
          score: 0.55,
        },
        combos:       [],
        explanation:  'Strong pair',
      },
    },
    overallScore: 0.57,
    tier:         'strong',
    typeCoverage: {
      offensivelyCovered:   ['Fire', 'Water'] as any,
      offensivelyUncovered: ['Ghost'] as any,
      weaknessCounts:       { Fire: 3, Ground: 2, Ice: 1 } as any,
    },
    roleCoverage: {
      present:   ['fake-out', 'bulky-support', 'win-condition'],
      missing:   ['setter:rain'],
      redundant: [],
    },
    combos: [
      {
        name:        'fake-out-protection',
        label:       'Fake Out Protection',
        description: 'Incineroar flinches opponents with Fake Out.',
        memberSlugs: ['incineroar'],
      },
    ],
    explanation: 'Strong team with good role coverage.',
    ...overrides,
  };
}

// ─── buildHealthReport ────────────────────────────────────────────────────────

describe('buildHealthReport', () => {
  const slugs    = ['amoonguss', 'miraidon', 'incineroar'];
  const roles    = [
    ['bulky-support'],
    ['win-condition'],
    ['fake-out'],
  ] as any[][];
  const archetype: Archetype = 'rain';

  test('overallScore and tier are forwarded from synergyResult', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    expect(report.overallScore).toBeCloseTo(0.57);
    expect(report.tier).toBe('strong');
  });

  test('produces one SlotHealth per member', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    expect(report.slots).toHaveLength(3);
  });

  test('slot avgPairScore reflects only pairs it participates in', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    // amoonguss is in pairs [0.75, 0.35] → avg = 0.55
    expect(report.slots[0].avgPairScore).toBeCloseTo(0.55, 5);
    // miraidon is in pairs [0.75, 0.60] → avg = 0.675
    expect(report.slots[1].avgPairScore).toBeCloseTo(0.675, 5);
  });

  test('topPairs sorted descending by totalScore', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype, 3);
    const scores = report.topPairs.map((p) => p.totalScore);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
    expect(scores[1]).toBeGreaterThanOrEqual(scores[2] ?? 0);
  });

  test('weakestPairs sorted ascending by totalScore (first is worst)', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype, 3);
    const scores = report.weakestPairs.map((p) => p.totalScore);
    expect(scores[0]).toBeLessThanOrEqual(scores[1] ?? 1);
  });

  test('biggestThreats lists top 3 weakness types in order', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    // weaknessCounts: Fire=3, Ground=2, Ice=1
    expect(report.biggestThreats[0]).toBe('Fire');
    expect(report.biggestThreats[1]).toBe('Ground');
    expect(report.biggestThreats[2]).toBe('Ice');
  });

  test('combos forwarded from synergyResult', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    expect(report.combos).toHaveLength(1);
    expect(report.combos[0].name).toBe('fake-out-protection');
  });

  test('summary is a non-empty string', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    expect(typeof report.summary).toBe('string');
    expect(report.summary.length).toBeGreaterThan(0);
  });

  test('summary includes the archetype combo when present', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    expect(report.summary).toContain('Fake Out Protection');
  });

  test('summary mentions missing role when present', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    expect(report.summary).toContain('setter:rain');
  });

  test('roleFit is true for slot whose roles match the archetype template', () => {
    // Rain slot[0] = Rain Setter. amoonguss has 'bulky-support' → not setter:rain → false
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, archetype);
    expect(report.slots[0].roleFit).toBe(false);
  });

  test('null archetype never fails role fit', () => {
    const report = buildHealthReport(makeSynergyResult(), slugs, roles, null);
    expect(report.slots.every((s) => s.roleFit)).toBe(true);
  });
});

// ─── rankThreats ──────────────────────────────────────────────────────────────

describe('rankThreats', () => {
  test('returns top N threats by weakness count', () => {
    const coverage = {
      offensivelyCovered:   [],
      offensivelyUncovered: [],
      weaknessCounts:       { Fire: 4, Ice: 1, Rock: 2 } as any,
    };
    const threats = rankThreats(coverage, 2);
    expect(threats[0]).toBe('Fire');
    expect(threats[1]).toBe('Rock');
    expect(threats).toHaveLength(2);
  });

  test('returns empty array when no weaknesses recorded', () => {
    const coverage = {
      offensivelyCovered:   [],
      offensivelyUncovered: [],
      weaknessCounts:       {},
    };
    expect(rankThreats(coverage, 3)).toHaveLength(0);
  });
});
