/**
 * /team/[id]/health — Team health dashboard.
 *
 * All data comes from buildHealthReport() which aggregates the live
 * TeamSynergyResult from useLiveSynergy.  No placeholders.
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
import { useLiveSynergyWithRoles } from '../../../src/hooks/useLiveSynergy';
import { buildHealthReport, rankThreats } from '../../../src/engine/team/health';
import { useTeamDraftStore, selectTeamPokemon } from '../../../src/store/teamDraftStore';
import type { Archetype, RoleTag } from '../../../src/types/team';
import type { PairSynergyResult } from '../../../src/engine/synergy/types';

export default function TeamHealthScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const draft        = useTeamDraftStore((s) => s.draft);
  const teamPokemon  = useTeamDraftStore(selectTeamPokemon);
  const archetype    = draft?.archetype as Archetype | null;
  const synergy      = useLiveSynergyWithRoles(archetype);

  // Build the full health report when synergy is available.
  const report = synergy
    ? buildHealthReport(
        synergy,
        teamPokemon.map((p) => p.slug),
        teamPokemon.map((p) => p.roles),
        archetype,
      )
    : null;

  const threats = report
    ? rankThreats(synergy!.typeCoverage, 5)
    : [];

  // ── Insufficient data state ───────────────────────────────────────────────
  if (!synergy || !report) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
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
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 }}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ color: '#F0F0F0', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            Add at least 2 Pokémon
          </Text>
          <Text style={{ color: '#7B9CB5', fontSize: 13, textAlign: 'center' }}>
            Synergy analysis requires at least two members with resolved species data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <SynergyBadge tier={report.tier} score={report.overallScore} debug={false} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Section title="SUMMARY">
          <Text style={{ color: '#F0F0F0', fontSize: 14, lineHeight: 20 }}>
            {report.summary}
          </Text>
          {report.combos.length > 0 && (
            <View style={{ marginTop: 10, gap: 6 }}>
              {report.combos.map((c) => (
                <View key={c.name} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Text style={{ color: '#22C55E', fontSize: 12, marginTop: 1 }}>✓</Text>
                  <Text style={{ color: '#A0B8C8', fontSize: 12, flex: 1 }}>
                    <Text style={{ fontWeight: '700' }}>{c.label}:</Text> {c.description}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* Defensive exposure grid */}
        <SectionLabel label="DEFENSIVE EXPOSURE" />
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
            Cell = number of members weak to that attacking type. Green = none. Red = 3+.
          </Text>
          <TypeCoverageGrid weaknessCounts={synergy.typeCoverage.weaknessCounts} />
        </View>

        {/* Role coverage */}
        <Section title="ROLE COVERAGE">
          <RoleLine label="Present"   roles={report.roleCoverage.present}   color="#BBF7D0" />
          <RoleLine label="Missing"   roles={report.roleCoverage.missing}   color="#FCA5A5" />
          <RoleLine label="Redundant" roles={report.roleCoverage.redundant} color="#FDE68A" />
        </Section>

        {/* Top threats */}
        {threats.length > 0 && (
          <Section title="TOP THREATS">
            {threats.map((type, i) => {
              const count = synergy.typeCoverage.weaknessCounts[type as keyof typeof synergy.typeCoverage.weaknessCounts] ?? 0;
              return (
                <View key={type} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Text style={{ color: '#E8243C', fontSize: 14, fontWeight: '700', width: 22 }}>
                    {i + 1}.
                  </Text>
                  <Text style={{ color: '#F0F0F0', fontSize: 14, fontWeight: '600', flex: 1 }}>
                    {type}
                  </Text>
                  <Text style={{ color: '#7B9CB5', fontSize: 12 }}>
                    {count} weak
                  </Text>
                </View>
              );
            })}
          </Section>
        )}

        {/* Best / weakest pairs */}
        {report.topPairs.length > 0 && (
          <Section title="STRONGEST PAIRS">
            {report.topPairs.map((pair) => <PairRow key={pair.pairKey} pair={pair} />)}
          </Section>
        )}

        {report.weakestPairs.length > 0 && (
          <Section title="PAIRS TO IMPROVE">
            {report.weakestPairs.map((pair) => <PairRow key={pair.pairKey} pair={pair} />)}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>
      {label}
    </Text>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SectionLabel label={title} />
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
        {children}
      </View>
    </>
  );
}

function RoleLine({ label, roles, color }: { label: string; roles: RoleTag[]; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Text style={{ color: '#7B9CB5', fontSize: 13, width: 70 }}>{label}:</Text>
      <Text style={{ color, fontSize: 13, flex: 1, lineHeight: 18 }}>
        {roles.length > 0 ? roles.join(', ') : '—'}
      </Text>
    </View>
  );
}

function PairRow({ pair }: { pair: PairSynergyResult }) {
  const [a, b] = pair.pairKey.split('+');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <SynergyBadge tier={pair.tier} />
      <Text style={{ color: '#F0F0F0', fontSize: 13, flex: 1 }} numberOfLines={1}>
        {a} + {b}
      </Text>
      <Text style={{ color: '#7B9CB5', fontSize: 12 }}>
        {(pair.totalScore * 100).toFixed(0)}
      </Text>
    </View>
  );
}
