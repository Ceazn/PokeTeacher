/**
 * /team/[id]/calc — Damage Calculator.
 *
 * Attacker and defender are picked from the current team draft.
 * Move is picked from the attacker's moveset.
 * Field modifiers: Tailwind, Helping Hand (attacker side).
 * Result: @smogon/calc description, damage range, and KO label.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTeamDraftStore, selectTeamPokemon } from '../../../src/store/teamDraftStore';
import { runCalc } from '../../../src/engine/calc/smogonBridge';
import type { TeamMember } from '../../../src/types/team';
import type { PokemonWithRole } from '../../../src/engine/synergy/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugToDisplay(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberButton({
  label,
  member,
  data,
  selected,
  onPress,
}: {
  label:    string;
  member?:  TeamMember;
  data?:    PokemonWithRole;
  selected: boolean;
  onPress:  () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex:            1,
        backgroundColor: selected ? '#1E2A4A' : '#16213E',
        borderRadius:    10,
        borderWidth:     2,
        borderColor:     selected ? '#E8243C' : '#0F3460',
        padding:         10,
        alignItems:      'center',
        opacity:         pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: '#7B9CB5', fontSize: 10, fontWeight: '700', marginBottom: 2 }}>{label}</Text>
      <Text style={{ color: '#F0F0F0', fontSize: 13, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
        {data?.displayName ?? '—'}
      </Text>
    </Pressable>
  );
}

function MoveChip({
  move,
  selected,
  onPress,
}: {
  move:     string;
  selected: boolean;
  onPress:  () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor:   selected ? '#E8243C' : '#16213E',
        borderRadius:      8,
        borderWidth:       1,
        borderColor:       selected ? '#E8243C' : '#0F3460',
        paddingHorizontal: 12,
        paddingVertical:   7,
        opacity:           pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: selected ? '#FFF' : '#A0B8C8', fontSize: 13, fontWeight: selected ? '700' : '500' }}>
        {slugToDisplay(move)}
      </Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label:    string;
  value:    boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: '#A0B8C8', fontSize: 14 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#0F3460', true: '#E8243C' }}
        thumbColor="#FFF"
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CalcScreen() {
  const router = useRouter();

  const draft       = useTeamDraftStore((s) => s.draft);
  const teamPokemon = useTeamDraftStore(selectTeamPokemon);
  const pokemonData = useTeamDraftStore((s) => s.pokemonData);

  // Pair team members with their PokemonWithRole data.
  const teamSlots: Array<{ member: TeamMember; data: PokemonWithRole }> = useMemo(
    () =>
      (draft?.members ?? []).flatMap((m) => {
        const data = pokemonData[m.speciesId];
        return data ? [{ member: m, data }] : [];
      }),
    [draft?.members, pokemonData],
  );

  const [atkIdx,       setAtkIdx]       = useState<number>(0);
  const [defIdx,       setDefIdx]       = useState<number>(Math.min(1, teamSlots.length - 1));
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [tailwind,     setTailwind]     = useState(false);
  const [helpingHand,  setHelpingHand]  = useState(false);

  const atk = teamSlots[atkIdx];
  const def = teamSlots[defIdx];

  // Available moves from the attacker's slot (non-empty slugs).
  const atkMoves = useMemo(
    () => (atk?.member.moves ?? []).filter(Boolean),
    [atk],
  );

  // Auto-select first move when attacker changes.
  const effectiveMove = selectedMove && atkMoves.includes(selectedMove)
    ? selectedMove
    : atkMoves[0] ?? null;

  // Run the calculation.
  const result = useMemo(() => {
    if (!atk || !def || !effectiveMove) return null;
    return runCalc({
      attacker:     atk.member,
      attackerData: atk.data,
      defender:     def.member,
      defenderData: def.data,
      moveSlug:     effectiveMove,
      modifiers:    { tailwind, helpingHand },
    });
  }, [atk, def, effectiveMove, tailwind, helpingHand]);

  // ── Insufficient data state ──────────────────────────────────────────────
  if (teamSlots.length < 2) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: '#0F3460', gap: 12,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: '#7B9CB5', fontSize: 16 }}>‹ Back</Text>
          </Pressable>
          <Text style={{ color: '#F0F0F0', fontSize: 17, fontWeight: '700', flex: 1 }}>
            Damage Calculator
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 }}>
          <Text style={{ fontSize: 40 }}>⚡</Text>
          <Text style={{ color: '#F0F0F0', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            Add at least 2 Pokémon
          </Text>
          <Text style={{ color: '#7B9CB5', fontSize: 13, textAlign: 'center' }}>
            The damage calculator needs species data for at least two team members.
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
          Damage Calculator
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Attacker / Defender pickers */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>
          MATCHUP
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {teamSlots.map((slot, i) => (
            <View key={slot.member.id} style={{ flex: 1, gap: 6 }}>
              <MemberButton
                label="ATTACKER"
                member={slot.member}
                data={slot.data}
                selected={atkIdx === i}
                onPress={() => { setAtkIdx(i); setSelectedMove(null); }}
              />
              <MemberButton
                label="DEFENDER"
                member={slot.member}
                data={slot.data}
                selected={defIdx === i}
                onPress={() => setDefIdx(i)}
              />
            </View>
          ))}
        </View>

        {/* Move picker */}
        {atkMoves.length > 0 ? (
          <>
            <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>
              MOVE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {atkMoves.map((m) => (
                <MoveChip
                  key={m}
                  move={m}
                  selected={effectiveMove === m}
                  onPress={() => setSelectedMove(m)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={{ backgroundColor: '#16213E', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <Text style={{ color: '#7B9CB5', fontSize: 13 }}>
              No moves recorded for this Pokémon. Edit the team to add moves.
            </Text>
          </View>
        )}

        {/* Field modifiers */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
          FIELD (ATTACKER SIDE)
        </Text>
        <View
          style={{
            backgroundColor: '#16213E',
            borderRadius:    12,
            borderWidth:     1,
            borderColor:     '#0F3460',
            paddingHorizontal: 16,
            marginBottom:    20,
          }}
        >
          <ToggleRow label="Tailwind"     value={tailwind}    onToggle={setTailwind} />
          <ToggleRow label="Helping Hand" value={helpingHand} onToggle={setHelpingHand} />
        </View>

        {/* Result */}
        <Text style={{ color: '#7B9CB5', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>
          RESULT
        </Text>

        {result ? (
          <View
            style={{
              backgroundColor: '#16213E',
              borderRadius:    12,
              borderWidth:     1,
              borderColor:     '#0F3460',
              padding:         16,
              gap:             12,
            }}
          >
            {/* Description */}
            <Text style={{ color: '#F0F0F0', fontSize: 13, lineHeight: 20 }}>
              {result.desc}
            </Text>

            {/* Damage range */}
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View>
                <Text style={{ color: '#7B9CB5', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                  DAMAGE %
                </Text>
                <Text style={{ color: '#F0F0F0', fontSize: 18, fontWeight: '800' }}>
                  {result.damagePercent[0]}% – {result.damagePercent[1]}%
                </Text>
              </View>
              <View>
                <Text style={{ color: '#7B9CB5', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                  KO CHANCE
                </Text>
                <Text
                  style={{
                    fontSize:   18,
                    fontWeight: '800',
                    color:      result.koChance >= 1 ? '#EF4444'
                              : result.koChance > 0  ? '#F59E0B'
                              : '#22C55E',
                  }}
                >
                  {result.koLabel}
                </Text>
              </View>
            </View>

            {/* Roll breakdown */}
            <View>
              <Text style={{ color: '#7B9CB5', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
                DAMAGE ROLLS ({result.damageRolls.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {result.damageRolls.map((d, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: '#0F3460',
                      borderRadius:    4,
                      paddingHorizontal: 6,
                      paddingVertical:   3,
                    }}
                  >
                    <Text style={{ color: '#93C5FD', fontSize: 11, fontWeight: '600' }}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#16213E',
              borderRadius:    12,
              borderWidth:     1,
              borderColor:     '#0F3460',
              padding:         20,
              alignItems:      'center',
            }}
          >
            <Text style={{ color: '#7B9CB5', fontSize: 13 }}>
              {effectiveMove
                ? 'Could not calculate — check that the move name is valid for Gen 9.'
                : 'Select a move to see the damage calculation.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
