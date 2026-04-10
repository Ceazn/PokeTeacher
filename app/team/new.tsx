/**
 * /team/new — Archetype picker modal.
 *
 * Flow: user picks archetype + name → taps "Create Team" → team row inserted
 * in DB → navigates to /team/[id] (the persisted editor).
 *
 * When launched from the Build tab with ?archetype=rain the picker pre-selects
 * that archetype so the user can confirm with one tap.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ARCHETYPE_TEMPLATES, ALL_ARCHETYPES } from '../../src/engine/team/archetypes';
import { useCreateTeam } from '../../src/data/queries/useTeams';
import { useRegulationStore } from '../../src/store/regulationStore';
import type { Archetype } from '../../src/types/team';

const ARCHETYPE_ICONS: Record<Archetype, string> = {
  rain:           '🌧️',
  sun:            '☀️',
  'trick-room':   '🔄',
  'hyper-offense':'⚡',
  balance:        '⚖️',
};

export default function NewTeamScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ archetype?: string }>();

  const [selected, setSelected] = useState<Archetype | null>(
    (params.archetype as Archetype) ?? null,
  );
  const [name, setName] = useState('');

  const { mutateAsync: createTeam, isPending } = useCreateTeam();
  const activeRegulation = useRegulationStore((s) => s.activeRegulation);

  async function handleCreate() {
    const teamName     = name.trim() ||
      (selected ? ARCHETYPE_TEMPLATES[selected].displayName + ' Team' : 'New Team');
    const regulationId = activeRegulation?.id ?? 'champions-m-a';

    const teamId = await createTeam({
      name:         teamName,
      regulationId,
      archetype:    selected,
      notes:        null,
    });

    // Navigate to the persisted editor; replace so Back doesn't return here.
    router.replace(`/team/${teamId}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            flexDirection:  'row',
            alignItems:     'center',
            padding:         20,
            borderBottomWidth: 1,
            borderBottomColor: '#0F3460',
          }}
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ color: '#7B9CB5', fontSize: 16 }}>‹ Back</Text>
          </Pressable>
          <Text style={{ color: '#F0F0F0', fontSize: 18, fontWeight: '700', flex: 1 }}>
            New Team
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Team name */}
          <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
            TEAM NAME
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={selected ? `${ARCHETYPE_TEMPLATES[selected].displayName} Team` : 'My Team'}
            placeholderTextColor="#4A6A80"
            style={{
              backgroundColor: '#16213E',
              borderRadius:    10,
              borderWidth:     1,
              borderColor:     '#0F3460',
              color:           '#F0F0F0',
              fontSize:        16,
              padding:         14,
              marginBottom:    28,
            }}
            maxLength={40}
          />

          {/* Archetype picker */}
          <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>
            ARCHETYPE
          </Text>

          {ALL_ARCHETYPES.map((a) => {
            const isSelected = selected === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelected(isSelected ? null : a.id)}
                style={({ pressed }) => ({
                  backgroundColor: isSelected ? '#1E2A4A' : '#16213E',
                  borderRadius:    12,
                  borderWidth:     2,
                  borderColor:     isSelected ? '#E8243C' : '#0F3460',
                  padding:         14,
                  marginBottom:    8,
                  flexDirection:   'row',
                  alignItems:      'center',
                  gap:             14,
                  opacity:         pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 28 }}>{ARCHETYPE_ICONS[a.id]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F0F0F0', fontSize: 15, fontWeight: '700' }}>
                    {a.displayName}
                  </Text>
                  <Text style={{ color: '#7B9CB5', fontSize: 12, marginTop: 2 }}>
                    {a.gameplan}
                  </Text>
                </View>
                {isSelected && (
                  <Text style={{ color: '#E8243C', fontSize: 20, fontWeight: '700' }}>✓</Text>
                )}
              </Pressable>
            );
          })}

          {/* Free-form option */}
          <Pressable
            onPress={() => setSelected(null)}
            style={({ pressed }) => ({
              backgroundColor: selected === null ? '#1E2A4A' : '#16213E',
              borderRadius:    12,
              borderWidth:     2,
              borderColor:     selected === null ? '#E8243C' : '#0F3460',
              padding:         14,
              marginBottom:    28,
              flexDirection:   'row',
              alignItems:      'center',
              gap:             14,
              opacity:         pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 28 }}>🎲</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F0F0F0', fontSize: 15, fontWeight: '700' }}>
                Free-form
              </Text>
              <Text style={{ color: '#7B9CB5', fontSize: 12, marginTop: 2 }}>
                No archetype — build freely without role slot guidance.
              </Text>
            </View>
            {selected === null && (
              <Text style={{ color: '#E8243C', fontSize: 20, fontWeight: '700' }}>✓</Text>
            )}
          </Pressable>

          {/* Create button */}
          <Pressable
            onPress={handleCreate}
            disabled={isPending}
            style={({ pressed }) => ({
              backgroundColor: isPending ? '#7A1220' : pressed ? '#B01C2E' : '#E8243C',
              borderRadius:    14,
              padding:         18,
              alignItems:      'center',
              flexDirection:   'row',
              justifyContent:  'center',
              gap:             10,
              opacity:         isPending ? 0.7 : pressed ? 0.9 : 1,
            })}
          >
            {isPending && <ActivityIndicator color="#FFF" size="small" />}
            <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>
              {isPending ? 'Creating…' : 'Create Team'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
