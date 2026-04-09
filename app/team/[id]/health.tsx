/**
 * /team/[id]/health — Team health dashboard.
 *
 * Shows type coverage grid, role distribution, strongest/weakest pairs,
 * and the team's top threats.
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TypeCoverageGrid } from '../../../src/components/team/TypeCoverageGrid';
import { SynergyBadge } from '../../../src/components/team/SynergyBadge';
import type { PokemonType } from '../../../src/types/pokemon';

// Placeholder data until synergy engine is wired to the draft store
const PLACEHOLDER_COVERAGE: Partial<Record<PokemonType, number>> = {
  Fire: 3, Ice: 2, Ground: 2, Poison: 1, Flying: 1,
};

export default function TeamHealthScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

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
          Team Health
        </Text>
        <SynergyBadge tier="decent" />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            padding:         16,
            marginBottom:    20,
          }}
        >
          <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
            SUMMARY
          </Text>
          <Text style={{ color: '#F0F0F0', fontSize: 14, lineHeight: 20 }}>
            Decent synergy — Fake Out Protection detected; missing setter:rain; watch out for Fire and Ice.
          </Text>
        </View>

        {/* Type coverage grid */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>
          DEFENSIVE EXPOSURE
        </Text>
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            padding:         16,
            marginBottom:    20,
          }}
        >
          <Text style={{ color: '#4A6A80', fontSize: 11, marginBottom: 10 }}>
            Number = how many team members are weak to that type
          </Text>
          <TypeCoverageGrid weaknessCounts={PLACEHOLDER_COVERAGE} />
        </View>

        {/* Role coverage */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>
          ROLE COVERAGE
        </Text>
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            padding:         16,
            marginBottom:    20,
            gap:             10,
          }}
        >
          <RoleLine label="Present" roles={['fake-out', 'bulky-support', 'win-condition']} color="#BBF7D0" />
          <RoleLine label="Missing" roles={['setter:rain']} color="#FCA5A5" />
          <RoleLine label="Redundant" roles={[]} color="#FDE68A" />
        </View>

        {/* Biggest threats */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>
          TOP THREATS
        </Text>
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            padding:         16,
            marginBottom:    20,
            gap:             8,
          }}
        >
          {['Fire', 'Ice', 'Ground'].map((t, i) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: '#E8243C', fontSize: 14, fontWeight: '700', width: 20 }}>
                {i + 1}.
              </Text>
              <Text style={{ color: '#F0F0F0', fontSize: 14, fontWeight: '600', flex: 1 }}>
                {t}
              </Text>
              <Text style={{ color: '#7B9CB5', fontSize: 12 }}>
                {i === 0 ? '3 weak' : i === 1 ? '2 weak' : '2 weak'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleLine({ label, roles, color }: { label: string; roles: string[]; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Text style={{ color: '#7B9CB5', fontSize: 13, width: 70 }}>{label}:</Text>
      <Text style={{ color, fontSize: 13, flex: 1, lineHeight: 18 }}>
        {roles.length > 0 ? roles.join(', ') : '—'}
      </Text>
    </View>
  );
}
