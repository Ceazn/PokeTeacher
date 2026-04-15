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
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TeamSlot } from '../../../src/components/team/TeamSlot';
import { SynergyBadge } from '../../../src/components/team/SynergyBadge';
import { useTeamDraftStore } from '../../../src/store/teamDraftStore';
import { useTeam, useReplaceTeamMembers } from '../../../src/data/queries/useTeams';
import { useLiveSynergyWithRoles } from '../../../src/hooks/useLiveSynergy';
import { getSlotTemplate } from '../../../src/engine/team/archetypes';
import { exportToShowdown } from '../../../src/engine/team/showdown';
import { FIXTURE_PICKER_ENTRIES } from '../../../src/data/fixtures/pokemon';
import type { Archetype, TeamMember, TeamSnapshot } from '../../../src/types/team';

export default function TeamEditorScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  // ── DB query ──────────────────────────────────────────────────────────────
  const { data: team, isLoading } = useTeam(id ?? null);

  // ── Draft store ────────────────────────────────────────────────────────────
  const { openDraft, closeDraft, draft, isDirty, markSaved, removeMember } = useTeamDraftStore();
  const pokemonData  = useTeamDraftStore((s) => s.pokemonData);
  const loadedIdRef  = useRef<string | null>(null);

  // ── Live synergy (recomputes on every member change) ──────────────────────
  const archetype  = draft?.archetype as Archetype | null;
  const synergy    = useLiveSynergyWithRoles(archetype);

  // Load team into draft once per team id; restore pokemonData from fixtures
  // so display names and synergy are available immediately without re-picking.
  useEffect(() => {
    if (team && loadedIdRef.current !== team.id) {
      openDraft(team);
      loadedIdRef.current = team.id;

      // openDraft clears pokemonData — restore each member from fixture lookup.
      const { setPokemonData } = useTeamDraftStore.getState();
      for (const member of team.members) {
        const entry = FIXTURE_PICKER_ENTRIES.find((e) => e.speciesId === member.speciesId);
        if (entry) setPokemonData(member.speciesId, entry.pokemon);
      }
    }
  }, [team, openDraft]);

  // Clear draft when navigating away.
  useEffect(() => () => { closeDraft(); }, [closeDraft]);

  // ── Save mutation ─────────────────────────────────────────────────────────
  const { mutateAsync: replaceMembers, isPending: isSaving } = useReplaceTeamMembers();

  async function handleSave() {
    if (!draft) return;
    const { members, ...teamHead } = draft;
    const snapshot: TeamSnapshot = {
      team:    teamHead,
      members,
      savedAt: Date.now(),
    };
    try {
      await replaceMembers({ teamId: draft.id, members: draft.members, snapshot });
      markSaved();
    } catch {
      Alert.alert('Save failed', 'Your changes could not be saved. Please try again.');
    }
  }

  // ── Showdown export ───────────────────────────────────────────────────────
  function handleExport() {
    if (!draft || draft.members.length === 0) {
      Alert.alert('Nothing to export', 'Add some Pokémon first.');
      return;
    }
    const nameMap: Record<number, string> = Object.fromEntries(
      Object.entries(pokemonData).map(([id, p]) => [Number(id), p.displayName]),
    );
    const paste = exportToShowdown(draft.members, nameMap);
    Share.share({ message: paste, title: `${draft.name} — Showdown Export` });
  }

  // ── Slot press — change or remove ─────────────────────────────────────────
  function handleSlotPress(slotIndex: number, member: TeamMember | undefined) {
    useTeamDraftStore.getState().setActiveSlot(slotIndex);

    if (!member) {
      router.push(`/team/${id}/picker?slot=${slotIndex + 1}`);
      return;
    }

    const displayName = pokemonData[member.speciesId]?.displayName
      ?? `Slot ${slotIndex + 1}`;

    Alert.alert(displayName, undefined, [
      {
        text:    'Change Pokémon',
        onPress: () => router.push(`/team/${id}/picker?slot=${slotIndex + 1}`),
      },
      {
        text:    'Remove from team',
        style:   'destructive',
        onPress: () => removeMember(member.slot),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
          <SynergyBadge tier={synergy?.tier ?? 'poor'} />
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
          const member     = draft!.members.find((m) => m.slot === i + 1);
          const memberName = member
            ? pokemonData[member.speciesId]?.displayName
            : undefined;

          return (
            <TeamSlot
              key={i}
              slotIndex={i}
              roleSlot={slotDef}
              member={member}
              memberName={memberName}
              onPress={() => handleSlotPress(i, member)}
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

          <Pressable
            onPress={handleExport}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: pressed ? '#1E2A3A' : '#16213E',
              borderRadius: 10, borderWidth: 1, borderColor: '#0F3460',
              padding: 12, alignItems: 'center', opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#93C5FD', fontSize: 13, fontWeight: '700' }}>↗ Export</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
