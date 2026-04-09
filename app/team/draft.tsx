/**
 * /team/draft — Ephemeral draft screen.
 *
 * Created from /team/new before a team has been persisted.  Once the user
 * saves, this redirects to /team/[id].
 *
 * Params:
 *   archetype — optional, pre-selected archetype slug
 *   name      — team name
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TeamSlot } from '../../src/components/team/TeamSlot';
import { SynergyBadge } from '../../src/components/team/SynergyBadge';
import { useTeamDraftStore } from '../../src/store/teamDraftStore';
import { getSlotTemplate } from '../../src/engine/team/archetypes';
import type { Archetype } from '../../src/types/team';

export default function DraftScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ archetype?: string; name?: string }>();
  const archetype = (params.archetype || null) as Archetype | null;
  const teamName  = params.name || 'New Team';

  const { openDraft, draft, isDirty } = useTeamDraftStore();

  // Seed an empty draft on mount
  useEffect(() => {
    if (!draft) {
      openDraft({
        id:           'draft',
        name:         teamName,
        regulationId: '',
        archetype,
        notes:        null,
        createdAt:    Date.now(),
        updatedAt:    Date.now(),
        version:      1,
        members:      [],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!draft) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#7B9CB5' }}>Initialising…</Text>
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
          {draft.name}
        </Text>
        <Pressable
          onPress={() => {
            // TODO: persist to DB then navigate to /team/[newId]
            useTeamDraftStore.getState().markSaved();
            router.replace('/(tabs)/teams');
          }}
          style={{ backgroundColor: '#E8243C', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 }}
        >
          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Synergy summary */}
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
          <SynergyBadge tier="poor" />
        </View>

        {/* Slots */}
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
                // TODO: open Pokémon picker
              }}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
