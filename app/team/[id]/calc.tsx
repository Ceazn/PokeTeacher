/**
 * /team/[id]/calc — Damage calculator.
 *
 * Wraps @smogon/calc.  Tier 1 scope: pick attacker + defender from the team
 * (or a free-input Pokémon), show damage range, and explain the EV spread
 * thresholds that were hit.
 *
 * The full @smogon/calc integration will be wired in Tier 1.6; this screen
 * serves as the placeholder route so navigation doesn't 404.
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function CalcScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
      {/* Header */}
      <View
        style={{
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: 20,
          paddingVertical:   14,
          borderBottomWidth: 1,
          borderBottomColor: '#0F3460',
          gap:               12,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: '#7B9CB5', fontSize: 16 }}>‹ Back</Text>
        </Pressable>
        <Text style={{ color: '#F0F0F0', fontSize: 17, fontWeight: '700', flex: 1 }}>
          Damage Calculator
        </Text>
      </View>

      {/* Placeholder */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 }}>
        <Text style={{ fontSize: 48 }}>⚡</Text>
        <Text style={{ color: '#F0F0F0', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          Damage Calculator
        </Text>
        <Text style={{ color: '#7B9CB5', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
          Full @smogon/calc integration coming in Tier 1.6.{'\n'}
          Damage ranges, KO thresholds, and EV spread explanations.
        </Text>
      </View>
    </SafeAreaView>
  );
}
