/**
 * TanStack Query hooks for team data.
 *
 * All hooks accept an open SQLiteDatabase instance — the caller is responsible
 * for obtaining it (typically via a React context or the singleton from db/index).
 *
 * Cache keys follow the pattern ['teams', ...] for easy invalidation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';
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
  all:          () => ['teams'] as const,
  list:         () => ['teams', 'list'] as const,
  detail:       (id: string) => ['teams', 'detail', id] as const,
  history:      (id: string) => ['teams', 'history', id] as const,
} as const;

// ─── Read queries ─────────────────────────────────────────────────────────────

/** All teams, newest first, without members. */
export function useTeamList(db: SQLiteDatabase | null) {
  return useQuery({
    queryKey:  TEAM_KEYS.list(),
    queryFn:   () => (db ? getAllTeams(db) : []),
    enabled:   db !== null,
  });
}

/** A single team including all its members. */
export function useTeam(db: SQLiteDatabase | null, teamId: string | null) {
  return useQuery({
    queryKey:  TEAM_KEYS.detail(teamId ?? ''),
    queryFn:   () => (db && teamId ? getTeamById(db, teamId) : null),
    enabled:   db !== null && teamId !== null,
  });
}

/** Version history snapshots for a team, newest first. */
export function useTeamHistory(db: SQLiteDatabase | null, teamId: string | null) {
  return useQuery({
    queryKey:  TEAM_KEYS.history(teamId ?? ''),
    queryFn:   () => (db && teamId ? getTeamHistory(db, teamId) : []),
    enabled:   db !== null && teamId !== null,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Creates a new team and invalidates the list cache. */
export function useCreateTeam(db: SQLiteDatabase | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'members'>) =>
      db ? createTeam(db, data) : Promise.reject(new Error('DB not ready')),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEYS.all() }),
  });
}

/** Updates team metadata and invalidates list + detail caches. */
export function useUpdateTeam(db: SQLiteDatabase | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Team, 'name' | 'archetype' | 'notes'>> }) =>
      db ? updateTeam(db, id, data) : Promise.reject(new Error('DB not ready')),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: TEAM_KEYS.list() });
      qc.invalidateQueries({ queryKey: TEAM_KEYS.detail(id) });
    },
  });
}

/** Deletes a team and invalidates all team caches. */
export function useDeleteTeam(db: SQLiteDatabase | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      db ? deleteTeam(db, id) : Promise.reject(new Error('DB not ready')),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEYS.all() }),
  });
}

/**
 * Replaces all members on a team in one shot.
 * Also saves a history snapshot before overwriting.
 */
export function useReplaceTeamMembers(db: SQLiteDatabase | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, members, snapshot }: {
      teamId:   string;
      members:  TeamMember[];
      snapshot: TeamSnapshot;
    }) => {
      if (!db) throw new Error('DB not ready');
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

/** Removes a single member from a team. */
export function useDeleteMember(db: SQLiteDatabase | null, teamId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      db ? deleteMember(db, memberId) : Promise.reject(new Error('DB not ready')),
    onSuccess: () => {
      if (teamId) qc.invalidateQueries({ queryKey: TEAM_KEYS.detail(teamId) });
    },
  });
}
