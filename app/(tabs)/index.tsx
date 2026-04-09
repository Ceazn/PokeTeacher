/**
 * Build tab — home screen with archetype picker CTA and recent team shortcuts.
 *
 * Tapping "New Team" navigates to /team/new (archetype picker modal).
 * Recent teams link directly to /team/[id].
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ALL_ARCHETYPES } from '../../src/engine/team/archetypes';

const ARCHETYPE_ICONS: Record<string, string> = {
  rain:           '🌧️',
  sun:            '☀️',
  'trick-room':   '🔄',
  'hyper-offense':'⚡',
  balance:        '⚖️',
};

export default function BuildScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ color: '#E8243C', fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>
            SYNERGY
          </Text>
          <Text style={{ color: '#F0F0F0', fontSize: 26, fontWeight: '800', marginTop: 4 }}>
            Build Your Team
          </Text>
          <Text style={{ color: '#7B9CB5', fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            Pick an archetype to get started. The engine will guide each role slot.
          </Text>
        </View>

        {/* New team CTA */}
        <Pressable
          onPress={() => router.push('/team/new')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#B01C2E' : '#E8243C',
            borderRadius:    14,
            padding:         18,
            alignItems:      'center',
            marginBottom:    28,
            opacity:         pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>
            + New Team
          </Text>
        </Pressable>

        {/* Archetype quick-start cards */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>
          ARCHETYPES
        </Text>

        {ALL_ARCHETYPES.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => router.push({ pathname: '/team/new', params: { archetype: a.id } })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#1E2A3A' : '#16213E',
              borderRadius:    12,
              borderWidth:     1,
              borderColor:     '#0F3460',
              padding:         14,
              marginBottom:    8,
              flexDirection:   'row',
              alignItems:      'center',
              gap:             14,
              opacity:         pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 28 }}>{ARCHETYPE_ICONS[a.id] ?? '🔵'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F0F0F0', fontSize: 15, fontWeight: '700' }}>
                {a.displayName}
              </Text>
              <Text style={{ color: '#7B9CB5', fontSize: 12, marginTop: 2 }}>
                {a.tagline}
              </Text>
            </View>
            <Text style={{ color: '#4A6A80', fontSize: 18 }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
