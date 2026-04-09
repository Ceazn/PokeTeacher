/**
 * TypeBadge — small pill displaying a Pokémon type with its brand colour.
 *
 * Usage:
 *   <TypeBadge type="Fire" />
 *   <TypeBadge type="Water" size="sm" />
 */
import React from 'react';
import { View, Text } from 'react-native';
import type { PokemonType } from '../../types/pokemon';

// ─── Type colour map ──────────────────────────────────────────────────────────

const TYPE_COLORS: Record<PokemonType, string> = {
  Normal:   '#A8A878',
  Fire:     '#F08030',
  Water:    '#6890F0',
  Electric: '#F8D030',
  Grass:    '#78C850',
  Ice:      '#98D8D8',
  Fighting: '#C03028',
  Poison:   '#A040A0',
  Ground:   '#E0C068',
  Flying:   '#A890F0',
  Psychic:  '#F85888',
  Bug:      '#A8B820',
  Rock:     '#B8A038',
  Ghost:    '#705898',
  Dragon:   '#7038F8',
  Dark:     '#705848',
  Steel:    '#B8B8D0',
  Fairy:    '#EE99AC',
};

// ─── Size variants ────────────────────────────────────────────────────────────

type Size = 'sm' | 'md' | 'lg';

const SIZE_STYLES: Record<Size, { px: number; py: number; text: number; radius: number }> = {
  sm: { px: 6,  py: 2,  text: 10, radius: 4 },
  md: { px: 10, py: 3,  text: 12, radius: 6 },
  lg: { px: 14, py: 5,  text: 14, radius: 8 },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface TypeBadgeProps {
  type: PokemonType;
  size?: Size;
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const bg = TYPE_COLORS[type];
  const { px, py, text, radius } = SIZE_STYLES[size];

  return (
    <View
      style={{
        backgroundColor:  bg,
        paddingHorizontal: px,
        paddingVertical:   py,
        borderRadius:      radius,
        alignSelf:         'flex-start',
      }}
    >
      <Text
        style={{
          color:      '#FFFFFF',
          fontSize:   text,
          fontWeight: '700',
          textShadowColor:  'rgba(0,0,0,0.35)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1,
        }}
      >
        {type}
      </Text>
    </View>
  );
}
