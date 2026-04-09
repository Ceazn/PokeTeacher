import { explainPairSynergy, explainTeamSynergy } from '../explainer';
import type { DefensiveDetail, OffensiveDetail, PairSynergyResult, TeamSynergyResult } from '../types';
import type { PokemonType } from '../../../types/pokemon';

// ─── Fixture builders ────────────────────────────────────────────────────────

function makeDefDetail(overrides: Partial<DefensiveDetail> = {}): DefensiveDetail {
  return {
    aCoveredByB:     0.5,
    bCoveredByA:     0.5,
    sharedWeaknesses: [],
    score:           0.5,
    ...overrides,
  };
}

function makeOffDetail(overrides: Partial<OffensiveDetail> = {}): OffensiveDetail {
  return {
    seTypesA:         [],
    seTypesB:         [],
    uniqueGapsFilled: [],
    uncoveredTypes:   [],
    score:            0.5,
    ...overrides,
  };
}

function pairInput(
  tier: PairSynergyResult['tier'],
  def:  Partial<DefensiveDetail> = {},
  off:  Partial<OffensiveDetail> = {},
  combos: PairSynergyResult['combos'] = [],
) {
  return {
    tier,
    defensiveDetail:  makeDefDetail(def),
    offensiveDetail:  makeOffDetail(off),
    combos,
  };
}

// ─── Pair explanation — tier labels ──────────────────────────────────────────

describe('explainPairSynergy — tier labels', () => {
  test('excellent tier starts with "Excellent"', () => {
    const result = explainPairSynergy(pairInput('excellent'), 'a', 'A', 'b', 'B');
    expect(result).toMatch(/^Excellent/);
  });

  test('strong tier starts with "Strong"', () => {
    const result = explainPairSynergy(pairInput('strong'), 'a', 'A', 'b', 'B');
    expect(result).toMatch(/^Strong/);
  });

  test('decent tier starts with "Decent"', () => {
    const result = explainPairSynergy(pairInput('decent'), 'a', 'A', 'b', 'B');
    expect(result).toMatch(/^Decent/);
  });

  test('poor tier starts with "Poor"', () => {
    const result = explainPairSynergy(pairInput('poor'), 'a', 'A', 'b', 'B');
    expect(result).toMatch(/^Poor/);
  });
});

// ─── Pair explanation — defensive coverage sentences ─────────────────────────

describe('explainPairSynergy — defensive coverage', () => {
  test('full defensive coverage mentions the covering mon', () => {
    const result = explainPairSynergy(
      pairInput('excellent', { aCoveredByB: 1.0, bCoveredByA: 0.3 }),
      'amoonguss', 'Amoonguss', 'miraidon', 'Miraidon',
    );
    expect(result).toContain('Miraidon');
    expect(result).toContain('fully covers');
  });

  test('high coverage (≥0.75) uses "resists most" phrasing', () => {
    const result = explainPairSynergy(
      pairInput('strong', { aCoveredByB: 0.8, bCoveredByA: 0.3 }),
      'a', 'A', 'b', 'B',
    );
    expect(result).toContain('B');
    expect(result).toContain('resists most');
  });
});

// ─── Pair explanation — shared weaknesses ────────────────────────────────────

describe('explainPairSynergy — shared weaknesses', () => {
  test('single shared weakness mentions "drawback"', () => {
    const result = explainPairSynergy(
      pairInput('strong', { sharedWeaknesses: ['Fire' as PokemonType] }),
      'a', 'A', 'b', 'B',
    );
    expect(result).toContain('drawback');
    expect(result).toContain('Fire');
  });

  test('multiple shared weaknesses are listed', () => {
    const result = explainPairSynergy(
      pairInput('decent', {
        sharedWeaknesses: ['Ice', 'Rock'] as PokemonType[],
        score: 0.4,
      }),
      'a', 'A', 'b', 'B',
    );
    expect(result).toContain('Ice');
    expect(result).toContain('Rock');
  });

  test('no shared weaknesses → no drawback mention', () => {
    const result = explainPairSynergy(
      pairInput('excellent', { sharedWeaknesses: [] }),
      'a', 'A', 'b', 'B',
    );
    expect(result).not.toContain('drawback');
  });
});

// ─── Pair explanation — combos ────────────────────────────────────────────────

describe('explainPairSynergy — combos', () => {
  test('rain combo description appears in explanation', () => {
    const result = explainPairSynergy(
      pairInput('excellent', {}, {}, [{
        name:        'weather:rain',
        label:       'Rain Core',
        description: 'Politoed sets Rain; Kingdra benefits.',
        memberSlugs: ['politoed', 'kingdra'],
      }]),
      'politoed', 'Politoed', 'kingdra', 'Kingdra',
    );
    expect(result).toContain('Politoed sets Rain');
  });

  test('output ends with a period', () => {
    const result = explainPairSynergy(pairInput('strong'), 'a', 'A', 'b', 'B');
    expect(result.endsWith('.')).toBe(true);
  });
});

// ─── Team explanation ─────────────────────────────────────────────────────────

describe('explainTeamSynergy', () => {
  function makeTeamResult(overrides: Partial<TeamSynergyResult> = {}): TeamSynergyResult {
    return {
      pairScores:   {},
      overallScore: 0.6,
      tier:         'strong',
      typeCoverage: {
        offensivelyCovered:   [],
        offensivelyUncovered: [],
        weaknessCounts:       {},
      },
      roleCoverage: { present: [], missing: [], redundant: [] },
      combos:       [],
      explanation:  '',
      ...overrides,
    };
  }

  test('starts with tier label', () => {
    const result = explainTeamSynergy(makeTeamResult({ tier: 'strong' }));
    expect(result).toMatch(/^Strong/);
  });

  test('mentions uncovered types when present', () => {
    const result = explainTeamSynergy(makeTeamResult({
      typeCoverage: {
        offensivelyCovered:   [],
        offensivelyUncovered: ['Normal', 'Dragon'] as PokemonType[],
        weaknessCounts:       {},
      },
    }));
    expect(result).toContain('Normal');
    expect(result).toContain('Dragon');
  });

  test('mentions missing roles', () => {
    const result = explainTeamSynergy(makeTeamResult({
      roleCoverage: { present: [], missing: ['setter:rain'], redundant: [] },
    }));
    expect(result).toContain('setter rain');
  });

  test('mentions dominant threats (≥3 weak members)', () => {
    const result = explainTeamSynergy(makeTeamResult({
      typeCoverage: {
        offensivelyCovered:   [],
        offensivelyUncovered: [],
        weaknessCounts:       { Ice: 4 },
      },
    }));
    expect(result).toContain('Ice');
  });

  test('balanced team produces a generic positive message', () => {
    const result = explainTeamSynergy(makeTeamResult({
      tier: 'excellent',
      typeCoverage: { offensivelyCovered: [], offensivelyUncovered: [], weaknessCounts: {} },
      roleCoverage: { present: [], missing: [], redundant: [] },
      combos: [],
    }));
    expect(result).toContain('Excellent');
  });
});
