/**
 * PokemonCard — compact card showing a Pokémon's sprite, name, types, and
 * synergy tier badge.  Tappable — calls onPress when the user selects it.
 *
 * Usage:
 *   <PokemonCard pokemon={p} onPress={() => addToTeam(p)} />
 *   <PokemonCard pokemon={p} tier="strong" onPress={...} />
 */
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import type { PokemonWithRole } from '../../engine/synergy/types';
import type { SynergyTier } from '../../engine/synergy/types';
import { TypeBadge } from './TypeBadge';

// ─── Tier colour map ──────────────────────────────────────────────────────────

const TIER_COLORS: Record<SynergyTier, string> = {
  excellent: '#22C55E',  // green-500
  strong:    '#3B82F6',  // blue-500
  decent:    '#F59E0B',  // amber-500
  poor:      '#EF4444',  // red-500
};

const TIER_LABELS: Record<SynergyTier, string> = {
  excellent: 'Excellent',
  strong:    'Strong',
  decent:    'Decent',
  poor:      'Poor',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PokemonCardProps {
  pokemon:   PokemonWithRole;
  /** Optional synergy tier to show as a colour accent. */
  tier?:     SynergyTier;
  onPress?:  () => void;
  /** Whether the card is in a selected / active state. */
  selected?: boolean;
}

export function PokemonCard({ pokemon, tier, onPress, selected = false }: PokemonCardProps) {
  const borderColor = tier ? TIER_COLORS[tier] : selected ? '#E8243C' : '#0F3460';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#1E2A3A' : '#16213E',
        borderRadius:    12,
        borderWidth:     2,
        borderColor,
        padding:         12,
        flexDirection:   'row',
        alignItems:      'center',
        gap:             12,
        opacity:         pressed ? 0.85 : 1,
      })}
    >
      {/* Sprite */}
      <View
        style={{
          width:           56,
          height:          56,
          borderRadius:    8,
          backgroundColor: '#0F3460',
          justifyContent:  'center',
          alignItems:      'center',
          overflow:        'hidden',
        }}
      >
        {pokemon.slug ? (
          <Text style={{ fontSize: 28 }}>
            {/* Fallback emoji — real sprites come from the data layer */}
            {'🔵'}
          </Text>
        ) : null}
      </View>

      {/* Name + types */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            color:      '#F0F0F0',
            fontSize:   15,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {pokemon.displayName}
        </Text>

        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
          {pokemon.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </View>
      </View>

      {/* Tier badge */}
      {tier ? (
        <View
          style={{
            backgroundColor: TIER_COLORS[tier],
            paddingHorizontal: 8,
            paddingVertical:   3,
            borderRadius:      6,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
            {TIER_LABELS[tier]}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
