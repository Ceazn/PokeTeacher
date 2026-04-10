/**
 * PokemonPickerRow — one row in the Pokémon picker list.
 *
 * Shows sprite placeholder, name, type badges, and usage %.
 * When the entry is illegal, the row is dimmed and pressing it shows the
 * reason via the `onIllegalPress` callback (caller handles the alert/toast).
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { PickerEntry } from '../../types/picker';
import type { LegalityResult } from '../../engine/regulation/legalityChecker';

// ─── Type badge colours (subset of Pokémon types) ─────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Normal:   '#A8A878', Fire:     '#F08030', Water:    '#6890F0',
  Electric: '#F8D030', Grass:    '#78C850', Ice:      '#98D8D8',
  Fighting: '#C03028', Poison:   '#A040A0', Ground:   '#E0C068',
  Flying:   '#A890F0', Psychic:  '#F85888', Bug:      '#A8B820',
  Rock:     '#B8A038', Ghost:    '#705898', Dragon:   '#7038F8',
  Dark:     '#705848', Steel:    '#B8B8D0', Fairy:    '#EE99AC',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PokemonPickerRowProps {
  entry:          PickerEntry;
  legality:       LegalityResult;
  onSelect:       (entry: PickerEntry) => void;
  onIllegalPress: (reason: string) => void;
}

export function PokemonPickerRow({
  entry,
  legality,
  onSelect,
  onIllegalPress,
}: PokemonPickerRowProps) {
  const isIllegal = !legality.legal;

  function handlePress() {
    if (isIllegal) {
      onIllegalPress(legality.reason ?? 'This Pokémon cannot be added.');
    } else {
      onSelect(entry);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection:     'row',
        alignItems:        'center',
        gap:               12,
        paddingHorizontal: 16,
        paddingVertical:   12,
        backgroundColor:   pressed && !isIllegal ? '#1E2A4A' : 'transparent',
        opacity:           isIllegal ? 0.45 : 1,
      })}
    >
      {/* Sprite placeholder — circular with first letter */}
      <View
        style={{
          width:           44,
          height:          44,
          borderRadius:    22,
          backgroundColor: '#0F3460',
          justifyContent:  'center',
          alignItems:      'center',
          borderWidth:     1,
          borderColor:     '#1A3A6A',
        }}
      >
        <Text style={{ color: '#93C5FD', fontSize: 16, fontWeight: '700' }}>
          {entry.pokemon.displayName.charAt(0)}
        </Text>
      </View>

      {/* Name + types */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{ color: '#F0F0F0', fontSize: 14, fontWeight: '600' }}
          numberOfLines={1}
        >
          {entry.pokemon.displayName}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {entry.pokemon.types.map((t) => (
            <View
              key={t}
              style={{
                backgroundColor:   TYPE_COLORS[t] ?? '#4A6A80',
                borderRadius:      4,
                paddingHorizontal: 6,
                paddingVertical:   2,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                {t.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Usage % or illegal badge */}
      <View style={{ alignItems: 'flex-end', gap: 3, minWidth: 52 }}>
        {isIllegal ? (
          <View
            style={{
              backgroundColor:   '#7F1D1D',
              borderRadius:      4,
              paddingHorizontal: 6,
              paddingVertical:   2,
            }}
          >
            <Text style={{ color: '#FCA5A5', fontSize: 10, fontWeight: '700' }}>
              ILLEGAL
            </Text>
          </View>
        ) : entry.usagePct !== null ? (
          <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '600' }}>
            {entry.usagePct.toFixed(1)}%
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
