/**
 * SynergyBadge — colour-coded pill showing a synergy tier label.
 *
 * Usage:
 *   <SynergyBadge tier="strong" />
 *   <SynergyBadge tier="excellent" score={0.78} />
 */
import React from 'react';
import { View, Text } from 'react-native';
import type { SynergyTier } from '../../engine/synergy/types';

const TIER_CONFIG: Record<SynergyTier, { label: string; bg: string; text: string }> = {
  excellent: { label: 'Excellent', bg: '#166534', text: '#BBF7D0' },
  strong:    { label: 'Strong',    bg: '#1E3A5F', text: '#93C5FD' },
  decent:    { label: 'Decent',    bg: '#78350F', text: '#FDE68A' },
  poor:      { label: 'Poor',      bg: '#7F1D1D', text: '#FCA5A5' },
};

interface SynergyBadgeProps {
  tier:   SynergyTier;
  /** Optional raw score to display in parentheses (shown only in debug mode). */
  score?: number;
  debug?: boolean;
}

export function SynergyBadge({ tier, score, debug = false }: SynergyBadgeProps) {
  const { label, bg, text } = TIER_CONFIG[tier];

  return (
    <View
      style={{
        backgroundColor:   bg,
        paddingHorizontal: 10,
        paddingVertical:   4,
        borderRadius:      8,
        alignSelf:         'flex-start',
      }}
    >
      <Text style={{ color: text, fontSize: 12, fontWeight: '700' }}>
        {label}
        {debug && score !== undefined ? ` (${score.toFixed(2)})` : ''}
      </Text>
    </View>
  );
}
