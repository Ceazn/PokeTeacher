/**
 * /team/[id] — Team editor.
 *
 * The main editing surface.  Shows all 6 role slots for the team's archetype,
 * a real-time synergy summary, and action buttons for health/calc/export.
 *
 * Data flow:
 *   DB → useTeam(id) → openDraft() → teamDraftStore → UI
 *   User edit → setMember() / removeMember() → [Save] → replaceAllMembers()
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
import { TeamSlot } from '../../../src/components/team/TeamSlot';
import { SynergyBadge } from '../../../src/components/team/SynergyBadge';
import { useTeamDraftStore } from '../../../src/store/teamDraftStore';
import { getSlotTemplate } from '../../../src/engine/team/archetypes';
import type { Archetype } from '../../../src/types/team';

export default function TeamEditorScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const draft    = useTeamDraftStore((s) => s.draft);
  const isDirty  = useTeamDraftStore((s) => s.isDirty);

  // TODO: load team from DB via useTeam(id) and call openDraft() when data arrives.
  // For now render the draft if it's set, otherwise show a loading placeholder.

  if (!draft) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#7B9CB5', fontSize: 16 }}>Loading team…</Text>
      </SafeAreaView>
    );
  }

  const archetype = draft.archetype as Archetype | null;

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
          <Text style={{ color: '#7B9CB5', fontSize: 16 }}>‹</Text>
        </Pressable>
        <Text style={{ color: '#F0F0F0', fontSize: 17, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {draft.name}
        </Text>
        {isDirty ? (
          <Pressable
            onPress={() => {
              // TODO: persist via useReplaceTeamMembers()
              useTeamDraftStore.getState().markSaved();
            }}
            style={{ backgroundColor: '#E8243C', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 }}
          >
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Save</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Synergy summary bar */}
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            padding:         14,
            flexDirection:   'row',
            alignItems:      'center',
            marginBottom:    16,
            gap:             12,
          }}
        >
          <Text style={{ color: '#7B9CB5', fontSize: 13, flex: 1 }}>
            Team Synergy
          </Text>
          <SynergyBadge tier="decent" />
          <Pressable
            onPress={() => router.push(`/team/${id}/health`)}
            style={{ backgroundColor: '#0F3460', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: '#93C5FD', fontSize: 12, fontWeight: '600' }}>Details</Text>
          </Pressable>
        </View>

        {/* Role slots */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const slot   = archetype ? getSlotTemplate(archetype, i) : {
            label: `Slot ${i + 1}`, description: 'Any Pokémon.',
            primaryRole: 'flex' as const, alternatives: [], required: false,
          };
          const member = draft.members.find((m) => m.slot === i + 1);

          return (
            <TeamSlot
              key={i}
              slotIndex={i}
              roleSlot={slot}
              member={member}
              onPress={() => {
                useTeamDraftStore.getState().setActiveSlot(i);
                // TODO: open Pokémon picker bottom sheet
              }}
            />
          );
        })}

        {/* Action row */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Pressable
            onPress={() => router.push(`/team/${id}/health`)}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: pressed ? '#1E2A3A' : '#16213E',
              borderRadius: 10, borderWidth: 1, borderColor: '#0F3460',
              padding: 12, alignItems: 'center', opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#93C5FD', fontSize: 13, fontWeight: '700' }}>📊 Health</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(`/team/${id}/calc`)}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: pressed ? '#1E2A3A' : '#16213E',
              borderRadius: 10, borderWidth: 1, borderColor: '#0F3460',
              padding: 12, alignItems: 'center', opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#93C5FD', fontSize: 13, fontWeight: '700' }}>⚡ Calc</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
