/**
 * /team/new — Archetype picker modal.
 *
 * The user picks an archetype (or skips for free-form), optionally names the team,
 * then navigates to /team/[id] with the draft pre-seeded.
 *
 * When launched from the Build tab with ?archetype=rain, the picker pre-selects
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ARCHETYPE_TEMPLATES, ALL_ARCHETYPES } from '../../src/engine/team/archetypes';
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

  const [selected, setSelected]  = useState<Archetype | null>(
    (params.archetype as Archetype) ?? null,
  );
  const [name, setName] = useState('');

  function handleCreate() {
    // TODO: create team in DB via useCreateTeam(), then navigate to editor.
    // For now we navigate with query params so the editor can set up the draft.
    const teamName = name.trim() || (selected ? ARCHETYPE_TEMPLATES[selected].displayName + ' Team' : 'New Team');
    router.replace({
      pathname: '/team/draft',
      params:   { archetype: selected ?? '', name: teamName },
    });
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
                {isSelected ? (
                  <Text style={{ color: '#E8243C', fontSize: 20, fontWeight: '700' }}>✓</Text>
                ) : null}
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
            {selected === null ? (
              <Text style={{ color: '#E8243C', fontSize: 20, fontWeight: '700' }}>✓</Text>
            ) : null}
          </Pressable>

          {/* Create button */}
          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#B01C2E' : '#E8243C',
              borderRadius:    14,
              padding:         18,
              alignItems:      'center',
              opacity:         pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>
              Create Team
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
