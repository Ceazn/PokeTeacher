/**
 * Zustand store for the active team draft.
 *
 * Holds the full Team (for DB persistence) alongside PokemonWithRole data
 * (for synergy computation).  The two are kept in sync: setMember() adds
 * the team member row; setPokemonData() provides the engine-ready species data.
 *
 * Synergy computation happens outside the store in useLiveSynergy() (a hook
 * that reads from the store and memoises the result).
 */
import { create } from 'zustand';
import type { Team, TeamMember } from '../types/team';
import type { Archetype } from '../types/team';
import type { PokemonWithRole } from '../engine/synergy/types';

// ─── State ────────────────────────────────────────────────────────────────────

export interface TeamDraftState {
  /** The team currently being edited. Null when no team is open. */
  draft: Team | null;

  /** Index (0-based) of the slot the user has focused (for editing). */
  activeSlotIndex: number | null;

  /** True when the draft has unsaved changes. */
  isDirty: boolean;

  /**
   * Species data for each placed member, keyed by speciesId.
   * Populated by setPokemonData() whenever a member is added.
   * Cleared when closeDraft() is called.
   */
  pokemonData: Record<number, PokemonWithRole>;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Load a team into the draft (clears dirty flag and pokemonData). */
  openDraft: (team: Team) => void;

  /** Clear the draft (e.g. after saving or navigating away). */
  closeDraft: () => void;

  /** Set the focused slot index. */
  setActiveSlot: (index: number | null) => void;

  /** Change the team's archetype. Marks draft dirty. */
  setArchetype: (archetype: Archetype | null) => void;

  /**
   * Replace the member at a specific slot (1-based).
   * Pass the PokemonWithRole data alongside so synergy can run immediately.
   * Marks draft dirty.
   */
  setMember: (member: TeamMember, pokemonData: PokemonWithRole) => void;

  /** Remove the member at a specific slot (1-based). Marks draft dirty. */
  removeMember: (slot: 1 | 2 | 3 | 4 | 5 | 6) => void;

  /** Update mutable team metadata (name, notes). Marks draft dirty. */
  updateMetadata: (data: Partial<Pick<Team, 'name' | 'notes'>>) => void;

  /** Mark the draft as clean (called after a successful save). */
  markSaved: () => void;

  /**
   * Register species data for a speciesId after loading from DB.
   * Called by the team loader once per species when resolving an existing team.
   */
  setPokemonData: (speciesId: number, data: PokemonWithRole) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTeamDraftStore = create<TeamDraftState>((set) => ({
  draft:           null,
  activeSlotIndex: null,
  isDirty:         false,
  pokemonData:     {},

  openDraft: (team) =>
    set({ draft: team, isDirty: false, activeSlotIndex: null, pokemonData: {} }),

  closeDraft: () =>
    set({ draft: null, isDirty: false, activeSlotIndex: null, pokemonData: {} }),

  setActiveSlot: (index) =>
    set({ activeSlotIndex: index }),

  setArchetype: (archetype) =>
    set((s) => ({
      draft:   s.draft ? { ...s.draft, archetype } : null,
      isDirty: true,
    })),

  setMember: (member, pokemon) =>
    set((s) => {
      if (!s.draft) return s;
      const members = s.draft.members.filter((m) => m.slot !== member.slot);
      return {
        draft:       { ...s.draft, members: [...members, member].sort((a, b) => a.slot - b.slot) },
        pokemonData: { ...s.pokemonData, [member.speciesId]: pokemon },
        isDirty:     true,
      };
    }),

  removeMember: (slot) =>
    set((s) => {
      if (!s.draft) return s;
      const removed   = s.draft.members.find((m) => m.slot === slot);
      const remaining = s.draft.members.filter((m) => m.slot !== slot);
      // Remove pokemonData only if no other member shares the same speciesId.
      const stillUsed = remaining.some((m) => m.speciesId === removed?.speciesId);
      const nextPokemonData = stillUsed || !removed
        ? s.pokemonData
        : Object.fromEntries(
            Object.entries(s.pokemonData).filter(([k]) => Number(k) !== removed.speciesId),
          );
      return {
        draft:       { ...s.draft, members: remaining },
        pokemonData: nextPokemonData,
        isDirty:     true,
      };
    }),

  updateMetadata: (data) =>
    set((s) => ({
      draft:   s.draft ? { ...s.draft, ...data } : null,
      isDirty: true,
    })),

  markSaved: () =>
    set({ isDirty: false }),

  setPokemonData: (speciesId, data) =>
    set((s) => ({
      pokemonData: { ...s.pokemonData, [speciesId]: data },
    })),
}));

// ─── Convenience selectors ────────────────────────────────────────────────────

/** Returns the member at the given 1-based slot, or undefined. */
export function selectMemberAtSlot(
  state: TeamDraftState,
  slot:  1 | 2 | 3 | 4 | 5 | 6,
): TeamMember | undefined {
  return state.draft?.members.find((m) => m.slot === slot);
}

/** Returns the currently focused member (by activeSlotIndex), or undefined. */
export function selectActiveMember(state: TeamDraftState): TeamMember | undefined {
  if (state.activeSlotIndex === null || !state.draft) return undefined;
  const slot = (state.activeSlotIndex + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  return state.draft.members.find((m) => m.slot === slot);
}

/** Returns ordered PokemonWithRole for all placed members that have data. */
export function selectTeamPokemon(state: TeamDraftState): PokemonWithRole[] {
  if (!state.draft) return [];
  return state.draft.members
    .map((m) => state.pokemonData[m.speciesId])
    .filter((p): p is PokemonWithRole => p !== undefined);
}
