/**
 * Teams tab — list of all saved teams.
 *
 * Each team card shows name, archetype, and member count.
 * Tapping a card navigates to /team/[id] (team editor).
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

// Placeholder — real data will come from useTeamList() once DB is wired into context
const PLACEHOLDER_TEAMS: Array<{
  id: string;
  name: string;
  archetype: string | null;
  memberCount: number;
  updatedAt: number;
}> = [];

const ARCHETYPE_ICONS: Record<string, string> = {
  rain:           '🌧️',
  sun:            '☀️',
  'trick-room':   '🔄',
  'hyper-offense':'⚡',
  balance:        '⚖️',
};

export default function TeamsScreen() {
  const router = useRouter();
  const teams  = PLACEHOLDER_TEAMS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: '#F0F0F0', fontSize: 22, fontWeight: '800' }}>
            My Teams
          </Text>
          <Pressable
            onPress={() => router.push('/team/new')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#B01C2E' : '#E8243C',
              borderRadius:    8,
              paddingHorizontal: 14,
              paddingVertical:   8,
              opacity:           pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>+ New</Text>
          </Pressable>
        </View>

        {teams.length === 0 ? (
          <View
            style={{
              backgroundColor: '#16213E',
              borderRadius:    14,
              borderWidth:     1,
              borderColor:     '#0F3460',
              padding:         32,
              alignItems:      'center',
              gap:             12,
            }}
          >
            <Text style={{ fontSize: 40 }}>🏟️</Text>
            <Text style={{ color: '#F0F0F0', fontSize: 16, fontWeight: '700' }}>
              No teams yet
            </Text>
            <Text style={{ color: '#7B9CB5', fontSize: 13, textAlign: 'center' }}>
              Build your first team to get started with synergy analysis.
            </Text>
            <Pressable
              onPress={() => router.push('/team/new')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#B01C2E' : '#E8243C',
                borderRadius:    10,
                paddingHorizontal: 20,
                paddingVertical:   10,
                marginTop:         8,
                opacity:           pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
                Build a Team
              </Text>
            </Pressable>
          </View>
        ) : (
          teams.map((team) => (
            <Pressable
              key={team.id}
              onPress={() => router.push(`/team/${team.id}`)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#1E2A3A' : '#16213E',
                borderRadius:    12,
                borderWidth:     1,
                borderColor:     '#0F3460',
                padding:         14,
                marginBottom:    8,
                flexDirection:   'row',
                alignItems:      'center',
                gap:             12,
                opacity:         pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 28 }}>
                {team.archetype ? ARCHETYPE_ICONS[team.archetype] ?? '🔵' : '🔵'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F0F0F0', fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                  {team.name}
                </Text>
                <Text style={{ color: '#7B9CB5', fontSize: 12, marginTop: 2 }}>
                  {team.memberCount}/6 Pokémon
                  {team.archetype ? ` · ${team.archetype}` : ''}
                </Text>
              </View>
              <Text style={{ color: '#4A6A80', fontSize: 18 }}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
