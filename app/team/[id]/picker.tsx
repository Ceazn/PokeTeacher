/**
 * /team/[id]/picker?slot=N — Pokémon picker.
 *
 * Full-screen route opened when the user taps an empty (or filled) team slot.
 * On selection the new member is committed to teamDraftStore, which triggers
 * live synergy recalculation in useLiveSynergy.
 *
 * Data flow:
 *   usePokemonList()  → all champion-legal Pokémon (DB or fixture fallback)
 *   checkCandidateLegality() → per-row legal / illegal + reason
 *   onSelect → build TeamMember with sensible defaults → setMember() → router.back()
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { usePokemonList } from '../../../src/data/queries/usePokemonList';
import { useTeamDraftStore } from '../../../src/store/teamDraftStore';
import { useRegulationStore } from '../../../src/store/regulationStore';
import { checkCandidateLegality } from '../../../src/engine/regulation/legalityChecker';
import { PokemonPickerRow } from '../../../src/components/pokemon/PokemonPickerRow';
import { FIXTURE_REGULATION_M_A, FIXTURE_CHAMPIONS_ROSTER } from '../../../src/data/fixtures/regulation';
import type { TeamMember, Nature } from '../../../src/types/team';
import type { PickerEntry } from '../../../src/types/picker';

// ─── Types ────────────────────────────────────────────────────────────────────

type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_FILTER_COLORS: Record<string, string> = {
  Normal:   '#A8A878', Fire:     '#F08030', Water:    '#6890F0',
  Electric: '#F8D030', Grass:    '#78C850', Ice:      '#98D8D8',
  Fighting: '#C03028', Poison:   '#A040A0', Ground:   '#E0C068',
  Flying:   '#A890F0', Psychic:  '#F85888', Bug:      '#A8B820',
  Rock:     '#B8A038', Ghost:    '#705898', Dragon:   '#7038F8',
  Dark:     '#705848', Steel:    '#B8B8D0', Fairy:    '#EE99AC',
};

const SPICY_THRESHOLD = 10;  // usage% below this = "spicy"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultMember(
  entry:  PickerEntry,
  teamId: string,
  slot:   number,
): TeamMember {
  return {
    id:             uuidv4(),
    teamId,
    slot:           slot as TeamMember['slot'],
    speciesId:      entry.speciesId,
    formName:       null,
    nickname:       null,
    level:          50,
    item:           null,
    ability:        entry.pokemon.abilityTags[0] ?? '',
    teraType:       entry.pokemon.teraType ?? null,
    nature:         'Hardy' as Nature,
    evSpread:       { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivSpread:       { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves:          ['', '', '', ''],
    roles:          entry.pokemon.roles,
    roleOverridden: false,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PickerScreen() {
  const router = useRouter();
  const { slot: slotParam } = useLocalSearchParams<{ slot: string }>();
  const slotNumber = parseInt(slotParam ?? '1', 10);

  const draft        = useTeamDraftStore((s) => s.draft);
  const pokemonData  = useTeamDraftStore((s) => s.pokemonData);
  const setMember    = useTeamDraftStore((s) => s.setMember);
  const activeReg    = useRegulationStore((s) => s.activeRegulation);

  const regulation    = activeReg ?? FIXTURE_REGULATION_M_A;
  const rosterList    = FIXTURE_CHAMPIONS_ROSTER;

  const { data: allEntries = [], isLoading, isError } = usePokemonList();

  // Current team slugs (for legality checks).
  const currentSlugs: string[] = useMemo(
    () => (draft?.members ?? []).map((m) => pokemonData[m.speciesId]?.slug ?? String(m.speciesId)),
    [draft?.members, pokemonData],
  );

  // Derive unique types from the loaded entries for the filter bar.
  const availableTypes = useMemo<PokemonType[]>(() => {
    const seen = new Set<string>();
    for (const e of allEntries) {
      for (const t of e.pokemon.types) seen.add(t);
    }
    return Array.from(seen).sort() as PokemonType[];
  }, [allEntries]);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState<PokemonType | null>(null);
  const [spicyOnly,   setSpicyOnly]   = useState(false);

  // ── Filtered list with legality ───────────────────────────────────────────
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEntries
      .filter((e) => {
        if (q && !e.pokemon.displayName.toLowerCase().includes(q)) return false;
        if (typeFilter && !e.pokemon.types.includes(typeFilter)) return false;
        if (spicyOnly && (e.usagePct === null || e.usagePct >= SPICY_THRESHOLD)) return false;
        return true;
      })
      .map((e) => ({
        entry:    e,
        legality: checkCandidateLegality(e.slug, currentSlugs, regulation, rosterList),
      }));
  }, [allEntries, search, typeFilter, spicyOnly, currentSlugs, regulation, rosterList]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback((entry: PickerEntry) => {
    if (!draft) return;
    const member = buildDefaultMember(entry, draft.id, slotNumber);
    setMember(member, entry.pokemon);
    router.back();
  }, [draft, slotNumber, setMember, router]);

  const handleIllegalPress = useCallback((reason: string) => {
    Alert.alert('Cannot add Pokémon', reason);
  }, []);

  const toggleTypeFilter = useCallback((t: PokemonType) => {
    setTypeFilter((prev) => (prev === t ? null : t));
  }, []);

  // ── Loading / error ───────────────────────────────────────────────────────
  const slotLabel = `Slot ${slotNumber}`;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <ActivityIndicator color="#E8243C" size="large" />
        <Text style={{ color: '#7B9CB5', fontSize: 13 }}>Loading Pokémon…</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 36 }}>⚠️</Text>
        <Text style={{ color: '#EF4444', fontSize: 14 }}>Failed to load Pokémon data.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: '#93C5FD', fontSize: 14 }}>Go back</Text>
        </Pressable>
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
          paddingHorizontal: 16,
          paddingVertical:   14,
          borderBottomWidth: 1,
          borderBottomColor: '#0F3460',
          gap:               12,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: '#7B9CB5', fontSize: 16 }}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F0F0F0', fontSize: 17, fontWeight: '700' }}>
            Add Pokémon
          </Text>
          <Text style={{ color: '#4A6A80', fontSize: 12, marginTop: 1 }}>
            {slotLabel}
          </Text>
        </View>
        {/* Spicy toggle */}
        <Pressable
          onPress={() => setSpicyOnly((v) => !v)}
          style={{
            backgroundColor:   spicyOnly ? '#7C3AED' : '#16213E',
            borderRadius:      8,
            borderWidth:       1,
            borderColor:       spicyOnly ? '#7C3AED' : '#0F3460',
            paddingHorizontal: 10,
            paddingVertical:   6,
          }}
        >
          <Text style={{ color: spicyOnly ? '#FFF' : '#A0B8C8', fontSize: 12, fontWeight: '700' }}>
            🌶 Spicy
          </Text>
        </Pressable>
      </View>

      {/* Search bar */}
      <View
        style={{
          flexDirection:     'row',
          alignItems:        'center',
          marginHorizontal:  16,
          marginVertical:    12,
          backgroundColor:   '#16213E',
          borderRadius:      10,
          borderWidth:       1,
          borderColor:       '#0F3460',
          paddingHorizontal: 12,
          gap:               8,
        }}
      >
        <Text style={{ color: '#4A6A80', fontSize: 15 }}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name…"
          placeholderTextColor="#4A6A80"
          style={{ flex: 1, color: '#F0F0F0', fontSize: 14, paddingVertical: 10 }}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Type filter pills */}
      {availableTypes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6, paddingBottom: 8, flexDirection: 'row' }}
        >
          {availableTypes.map((t) => {
            const active = typeFilter === t;
            const color  = TYPE_FILTER_COLORS[t] ?? '#4A6A80';
            return (
              <Pressable
                key={t}
                onPress={() => toggleTypeFilter(t)}
                style={{
                  backgroundColor:   active ? color : '#16213E',
                  borderRadius:      6,
                  borderWidth:       1,
                  borderColor:       active ? color : '#0F3460',
                  paddingHorizontal: 10,
                  paddingVertical:   5,
                }}
              >
                <Text
                  style={{
                    color:      active ? '#FFF' : '#A0B8C8',
                    fontSize:   11,
                    fontWeight: '700',
                  }}
                >
                  {t.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Separator */}
      <View style={{ height: 1, backgroundColor: '#0F3460' }} />

      {/* Results count */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <Text style={{ color: '#4A6A80', fontSize: 11 }}>
          {rows.length} Pokémon
          {spicyOnly ? ' · spicy only (<10% usage)' : ''}
          {typeFilter ? ` · ${typeFilter}` : ''}
        </Text>
      </View>

      {/* List */}
      {rows.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 }}>
          <Text style={{ fontSize: 36 }}>🔭</Text>
          <Text style={{ color: '#F0F0F0', fontSize: 15, fontWeight: '700' }}>No results</Text>
          <Text style={{ color: '#7B9CB5', fontSize: 13, textAlign: 'center' }}>
            Try a different search or remove a filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.entry.speciesId)}
          renderItem={({ item }) => (
            <PokemonPickerRow
              entry={item.entry}
              legality={item.legality}
              onSelect={handleSelect}
              onIllegalPress={handleIllegalPress}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: '#0F3460', marginLeft: 72 }} />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
        />
      )}
    </SafeAreaView>
  );
}
