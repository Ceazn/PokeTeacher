/**
 * Settings tab — app preferences.
 *
 * Tier 1 scope: regulation info display, placeholder for future settings.
 */
import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { useRegulationStore } from '../../src/store/regulationStore';

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection:   'row',
        justifyContent:  'space-between',
        alignItems:      'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#0F3460',
      }}
    >
      <Text style={{ color: '#A0B8C8', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#F0F0F0', fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { activeRegulation } = useRegulationStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: '#F0F0F0', fontSize: 22, fontWeight: '800', marginBottom: 24 }}>
          Settings
        </Text>

        {/* Regulation section */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
          REGULATION
        </Text>
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            paddingHorizontal: 16,
            marginBottom:    24,
          }}
        >
          <SettingsRow
            label="Active Regulation"
            value={activeRegulation?.displayName ?? 'Not loaded'}
          />
          <SettingsRow
            label="Format"
            value={activeRegulation?.game ?? '—'}
          />
          <SettingsRow
            label="Team Size"
            value={
              activeRegulation
                ? `${activeRegulation.teamSize.battleSize} / ${activeRegulation.teamSize.max}`
                : '—'
            }
          />
        </View>

        {/* App section */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
          APP
        </Text>
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            paddingHorizontal: 16,
            marginBottom:    24,
          }}
        >
          <SettingsRow label="Version"    value="0.1.0" />
          <SettingsRow label="Data Model" value="Champions" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
