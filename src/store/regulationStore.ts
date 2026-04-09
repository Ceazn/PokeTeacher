/**
 * Regulation Zustand store.
 *
 * Holds the active regulation and the state needed to drive the
 * "New regulation detected / team(s) now illegal" notification banner.
 *
 * The store is populated by the root layout after the TanStack Query
 * hook resolves; it is NOT the source of regulation data itself
 * (that lives in the DB + query layer).
 */
import { create } from 'zustand';
import type { Regulation } from '../types/regulation';

export interface StaleTeamNotice {
  /** UUID of the affected team. */
  teamId:   string;
  teamName: string;
  /** Human-readable list of reasons (one per violation). */
  reasons:  string[];
}

interface RegulationState {
  /** The regulation currently selected by the user (defaults to active reg). */
  activeRegulation: Regulation | null;

  /**
   * Set to a newly-fetched regulation when it differs from what the user last
   * saw. Cleared once the user dismisses the banner.
   */
  pendingRegulationUpdate: Regulation | null;

  /** Teams that became illegal under the new regulation. */
  staleTeamNotices: StaleTeamNotice[];

  /** Whether the "new regulation" banner has been dismissed this session. */
  bannerDismissed: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  setActiveRegulation:         (reg: Regulation) => void;
  setPendingRegulationUpdate:  (reg: Regulation | null) => void;
  setStaleTeamNotices:         (notices: StaleTeamNotice[]) => void;
  dismissBanner:               () => void;
}

export const useRegulationStore = create<RegulationState>((set) => ({
  activeRegulation:        null,
  pendingRegulationUpdate: null,
  staleTeamNotices:        [],
  bannerDismissed:         false,

  setActiveRegulation: (reg) =>
    set({ activeRegulation: reg }),

  setPendingRegulationUpdate: (reg) =>
    set({ pendingRegulationUpdate: reg, bannerDismissed: false }),

  setStaleTeamNotices: (notices) =>
    set({ staleTeamNotices: notices }),

  dismissBanner: () =>
    set({ pendingRegulationUpdate: null, bannerDismissed: true }),
}));
