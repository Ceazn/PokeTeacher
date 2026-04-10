/**
 * /team/[id] — Team editor.
 *
 * Data flow:
 *   DB (useTeam) → openDraft() once on load → teamDraftStore drives UI
 *   User edits    → setMember() / removeMember() / setArchetype()
 *   Save button   → useReplaceTeamMembers() → invalidates cache → markSaved()
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TeamSlot } from '../../../src/components/team/TeamSlot';
import { SynergyBadge } from '../../../src/components/team/SynergyBadge';
import { useTeamDraftStore } from '../../../src/store/teamDraftStore';
import { useTeam, useReplaceTeamMembers } from '../../../src/data/queries/useTeams';
import { getSlotTemplate } from '../../../src/engine/team/archetypes';
import type { Archetype, TeamSnapshot } from '../../../src/types/team';

export default function TeamEditorScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  // ── DB query ──────────────────────────────────────────────────────────────
  const { data: team, isLoading } = useTeam(id ?? null);

  // ── Draft store ────────────────────────────────────────────────────────────
  const { openDraft, closeDraft, draft, isDirty, markSaved } = useTeamDraftStore();
  const loadedIdRef = useRef<string | null>(null);

  // Load team into draft once per team id (not on every re-render).
  useEffect(() => {
    if (team && loadedIdRef.current !== team.id) {
      openDraft(team);
      loadedIdRef.current = team.id;
    }
  }, [team, openDraft]);

  // Clear draft when navigating away.
  useEffect(() => () => { closeDraft(); }, [closeDraft]);

  // ── Save mutation ─────────────────────────────────────────────────────────
  const { mutateAsync: replaceMembers, isPending: isSaving } = useReplaceTeamMembers();

  async function handleSave() {
    if (!draft) return;
    const snapshot: TeamSnapshot = {
      team:    { ...draft, members: undefined as never },
      members: draft.members,
      savedAt: Date.now(),
    };
    try {
      await replaceMembers({ teamId: draft.id, members: draft.members, snapshot });
      markSaved();
    } catch (err) {
      Alert.alert('Save failed', 'Your changes could not be saved. Please try again.');
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading || (!draft && !isLoading)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        {isLoading
          ? <ActivityIndicator color="#E8243C" size="large" />
          : <Text style={{ color: '#EF4444', fontSize: 15 }}>Team not found.</Text>
        }
      </SafeAreaView>
    );
  }

  const archetype = draft!.archetype as Archetype | null;

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
          {draft!.name}
        </Text>

        {(isDirty || isSaving) && (
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? '#7A1220' : '#E8243C',
              borderRadius:    8,
              paddingHorizontal: 14,
              paddingVertical:   7,
              flexDirection:   'row',
              alignItems:      'center',
              gap:             6,
            }}
          >
            {isSaving && <ActivityIndicator color="#FFF" size="small" />}
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>
              {isSaving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Synergy summary bar — will be live in step 2 */}
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
          {/* Placeholder — replaced in step 2 */}
          <SynergyBadge tier={draft!.members.length > 0 ? 'decent' : 'poor'} />
          <Pressable
            onPress={() => router.push(`/team/${id}/health`)}
            style={{ backgroundColor: '#0F3460', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: '#93C5FD', fontSize: 12, fontWeight: '600' }}>Details</Text>
          </Pressable>
        </View>

        {/* Role slots */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const slotDef = archetype
            ? getSlotTemplate(archetype, i)
            : { label: `Slot ${i + 1}`, description: 'Any Pokémon.', primaryRole: 'flex' as const, alternatives: [], required: false };
          const member = draft!.members.find((m) => m.slot === i + 1);

          return (
            <TeamSlot
              key={i}
              slotIndex={i}
              roleSlot={slotDef}
              member={member}
              onPress={() => {
                useTeamDraftStore.getState().setActiveSlot(i);
                // Pokémon picker wired in a future step
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
