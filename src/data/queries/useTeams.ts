/**
 * TanStack Query hooks for team data.
 *
 * Follows the same pattern as useRegulation: hooks call getDatabase()
 * internally so screens don't need to thread a db instance around.
 *
 * Cache keys follow ['teams', ...] for easy invalidation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '../db';
import type { Team, TeamMember, TeamSnapshot } from '../../types/team';
import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  replaceAllMembers,
  deleteMember,
  saveSnapshot,
  getTeamHistory,
} from '../repositories/team.repo';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const TEAM_KEYS = {
  all:     () => ['teams'] as const,
  list:    () => ['teams', 'list'] as const,
  detail:  (id: string) => ['teams', 'detail', id] as const,
  history: (id: string) => ['teams', 'history', id] as const,
} as const;

// ─── Read queries ─────────────────────────────────────────────────────────────

/** All teams, newest first, without members. */
export function useTeamList() {
  return useQuery({
    queryKey: TEAM_KEYS.list(),
    queryFn:  async () => {
      const db = await getDatabase();
      return getAllTeams(db);
    },
  });
}

/** A single team including all its members. Disabled when id is null. */
export function useTeam(teamId: string | null) {
  return useQuery({
    queryKey: TEAM_KEYS.detail(teamId ?? ''),
    queryFn:  async () => {
      const db = await getDatabase();
      return getTeamById(db, teamId!);
    },
    enabled:  teamId !== null,
  });
}

/** Version history snapshots for a team, newest first. */
export function useTeamHistory(teamId: string | null) {
  return useQuery({
    queryKey: TEAM_KEYS.history(teamId ?? ''),
    queryFn:  async () => {
      const db = await getDatabase();
      return getTeamHistory(db, teamId!);
    },
    enabled:  teamId !== null,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Creates a new team. Returns the new team id. */
export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'members'>) => {
      const db = await getDatabase();
      return createTeam(db, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEYS.all() }),
  });
}

/** Updates team metadata (name, archetype, notes). */
export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id:   string;
      data: Partial<Pick<Team, 'name' | 'archetype' | 'notes'>>;
    }) => {
      const db = await getDatabase();
      return updateTeam(db, id, data);
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: TEAM_KEYS.list() });
      qc.invalidateQueries({ queryKey: TEAM_KEYS.detail(id) });
    },
  });
}

/** Deletes a team and all its members/history. */
export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = await getDatabase();
      return deleteTeam(db, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEYS.all() }),
  });
}

/**
 * Replaces all members on a team in one transaction.
 * Saves a history snapshot before overwriting so the user can undo.
 */
export function useReplaceTeamMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      members,
      snapshot,
    }: {
      teamId:   string;
      members:  TeamMember[];
      snapshot: TeamSnapshot;
    }) => {
      const db = await getDatabase();
      await saveSnapshot(db, teamId, snapshot);
      await replaceAllMembers(db, teamId, members);
    },
    onSuccess: (_result, { teamId }) => {
      qc.invalidateQueries({ queryKey: TEAM_KEYS.detail(teamId) });
      qc.invalidateQueries({ queryKey: TEAM_KEYS.history(teamId) });
      qc.invalidateQueries({ queryKey: TEAM_KEYS.list() });
    },
  });
}

/** Removes a single member. Invalidates the parent team detail. */
export function useDeleteMember(teamId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const db = await getDatabase();
      return deleteMember(db, memberId);
    },
    onSuccess: () => {
      if (teamId) qc.invalidateQueries({ queryKey: TEAM_KEYS.detail(teamId) });
    },
  });
}
