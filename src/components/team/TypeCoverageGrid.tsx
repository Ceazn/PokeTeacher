/**
 * TypeCoverageGrid — 18-cell grid showing the team's defensive exposure.
 *
 * Each cell represents an attacking type.  The cell is colour-coded by
 * how many team members are weak to that type (0 = good, 3+ = danger).
 *
 * Usage:
 *   <TypeCoverageGrid weaknessCounts={report.typeCoverage.weaknessCounts} />
 */
import React from 'react';
import { View, Text } from 'react-native';
import type { PokemonType } from '../../types/pokemon';

const ALL_TYPES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

/** Short labels that fit in a small cell */
const SHORT_LABEL: Record<PokemonType, string> = {
  Normal:   'NRM', Fire:     'FIR', Water:    'WAT', Electric: 'ELE',
  Grass:    'GRS', Ice:      'ICE', Fighting: 'FGT', Poison:   'PSN',
  Ground:   'GRD', Flying:   'FLY', Psychic:  'PSY', Bug:      'BUG',
  Rock:     'RCK', Ghost:    'GHO', Dragon:   'DRG', Dark:     'DRK',
  Steel:    'STL', Fairy:    'FAI',
};

function countToColor(count: number): string {
  if (count === 0) return '#166534';  // none weak → green
  if (count === 1) return '#1E3A5F';  // 1 weak → blue (manageable)
  if (count === 2) return '#78350F';  // 2 weak → amber (caution)
  return '#7F1D1D';                    // 3+ weak → red (danger)
}

function countToTextColor(count: number): string {
  if (count === 0) return '#BBF7D0';
  if (count === 1) return '#93C5FD';
  if (count === 2) return '#FDE68A';
  return '#FCA5A5';
}

interface TypeCoverageGridProps {
  weaknessCounts: Partial<Record<PokemonType, number>>;
}

export function TypeCoverageGrid({ weaknessCounts }: TypeCoverageGridProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap:      'wrap',
        gap:           4,
      }}
    >
      {ALL_TYPES.map((type) => {
        const count = weaknessCounts[type] ?? 0;
        return (
          <View
            key={type}
            style={{
              backgroundColor:   countToColor(count),
              borderRadius:      6,
              paddingHorizontal: 6,
              paddingVertical:   5,
              alignItems:        'center',
              minWidth:          44,
            }}
          >
            <Text style={{ color: countToTextColor(count), fontSize: 9, fontWeight: '700' }}>
              {SHORT_LABEL[type]}
            </Text>
            <Text style={{ color: countToTextColor(count), fontSize: 13, fontWeight: '800' }}>
              {count}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
