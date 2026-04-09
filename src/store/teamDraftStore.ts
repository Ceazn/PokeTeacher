/**
 * Zustand store for the active team draft.
 *
 * The draft is ephemeral — it lives in memory while the user edits a team.
 * Persistence is handled by the team repository (team.repo.ts) when the user
 * explicitly saves.  The store holds a snapshot of the full Team object plus
 * any transient UI state (selected slot, pending synergy warnings, etc.).
 */
import { create } from 'zustand';
import type { Team, TeamMember } from '../types/team';
import type { Archetype } from '../types/team';

// ─── State ────────────────────────────────────────────────────────────────────

export interface TeamDraftState {
  /** The team currently being edited. Null when no team is open. */
  draft: Team | null;

  /** Index (0-based) of the slot the user has focused (for editing). */
  activeSlotIndex: number | null;

  /** True when the draft has unsaved changes. */
  isDirty: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Load a team into the draft (clears dirty flag). */
  openDraft: (team: Team) => void;

  /** Clear the draft (e.g. after saving or navigating away). */
  closeDraft: () => void;

  /** Set the focused slot index. */
  setActiveSlot: (index: number | null) => void;

  /** Change the team's archetype. Marks draft dirty. */
  setArchetype: (archetype: Archetype | null) => void;

  /** Replace the member at a specific slot (1-based). Marks draft dirty. */
  setMember: (member: TeamMember) => void;

  /** Remove the member at a specific slot (1-based). Marks draft dirty. */
  removeMember: (slot: 1 | 2 | 3 | 4 | 5 | 6) => void;

  /** Update mutable team metadata (name, notes). Marks draft dirty. */
  updateMetadata: (data: Partial<Pick<Team, 'name' | 'notes'>>) => void;

  /** Mark the draft as clean (called after a successful save). */
  markSaved: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTeamDraftStore = create<TeamDraftState>((set, get) => ({
  draft:           null,
  activeSlotIndex: null,
  isDirty:         false,

  openDraft: (team) =>
    set({ draft: team, isDirty: false, activeSlotIndex: null }),

  closeDraft: () =>
    set({ draft: null, isDirty: false, activeSlotIndex: null }),

  setActiveSlot: (index) =>
    set({ activeSlotIndex: index }),

  setArchetype: (archetype) =>
    set((s) => ({
      draft:   s.draft ? { ...s.draft, archetype } : null,
      isDirty: true,
    })),

  setMember: (member) =>
    set((s) => {
      if (!s.draft) return s;
      const members = s.draft.members.filter((m) => m.slot !== member.slot);
      return {
        draft:   { ...s.draft, members: [...members, member].sort((a, b) => a.slot - b.slot) },
        isDirty: true,
      };
    }),

  removeMember: (slot) =>
    set((s) => {
      if (!s.draft) return s;
      return {
        draft:   { ...s.draft, members: s.draft.members.filter((m) => m.slot !== slot) },
        isDirty: true,
      };
    }),

  updateMetadata: (data) =>
    set((s) => ({
      draft:   s.draft ? { ...s.draft, ...data } : null,
      isDirty: true,
    })),

  markSaved: () =>
    set({ isDirty: false }),
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
