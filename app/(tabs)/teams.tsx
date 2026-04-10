/**
 * Teams tab — list of all saved teams.
 *
 * Uses useTeamList() for real DB data.  Each card shows name, archetype,
 * and member count.  Tapping navigates to /team/[id] (team editor).
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTeamList, useDeleteTeam } from '../../src/data/queries/useTeams';
import type { Archetype } from '../../src/types/team';

const ARCHETYPE_ICONS: Record<Archetype, string> = {
  rain:           '🌧️',
  sun:            '☀️',
  'trick-room':   '🔄',
  'hyper-offense':'⚡',
  balance:        '⚖️',
};

export default function TeamsScreen() {
  const router = useRouter();
  const { data: teams = [], isLoading } = useTeamList();
  const { mutate: deleteTeam } = useDeleteTeam();

  function confirmDelete(id: string, name: string) {
    // React Native Alert works natively; on web it falls back to window.confirm.
    const { Alert } = require('react-native');
    Alert.alert(
      `Delete "${name}"?`,
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTeam(id) },
      ],
    );
  }

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

        {isLoading ? (
          <ActivityIndicator color="#E8243C" size="large" style={{ marginTop: 60 }} />
        ) : teams.length === 0 ? (
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
              onLongPress={() => confirmDelete(team.id, team.name)}
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
                {team.archetype ? (ARCHETYPE_ICONS[team.archetype] ?? '🔵') : '🔵'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F0F0F0', fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                  {team.name}
                </Text>
                <Text style={{ color: '#7B9CB5', fontSize: 12, marginTop: 2 }}>
                  {team.archetype ?? 'Free-form'}
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
