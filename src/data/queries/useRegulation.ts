/**
 * TanStack Query hooks for regulation data.
 *
 * These are the only React-aware entry points to the regulation data layer.
 * They orchestrate: DB read → stale check → remote fetch → DB write → return.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CACHE_TTL } from '../../config/endpoints';
import { getDatabase } from '../db';
import { fetchRegulations } from '../remote/synergyData';
import {
  getAllRegulations,
  getActiveRegulation,
  getLastRegFetchTime,
  upsertRegulations,
} from '../repositories/regulation.repo';
import type { Regulation } from '../../types/regulation';

// ─── Query keys (kept central to avoid typos) ────────────────────────────────

export const REGULATION_KEYS = {
  all:    ['regulations'] as const,
  active: ['regulations', 'active'] as const,
} as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Returns all known regulations from the local cache.
 * Triggers a background refresh if the cache is older than CACHE_TTL.regulations.
 */
export function useRegulations() {
  return useQuery({
    queryKey: REGULATION_KEYS.all,
    queryFn:  fetchAndCacheRegulations,
    staleTime: CACHE_TTL.regulations,
  });
}

/**
 * Returns the single active regulation.
 * Derived from the `useRegulations` query — no extra network call.
 */
export function useActiveRegulation(): Regulation | null | undefined {
  const { data } = useRegulations();
  return data?.find((r) => r.id === _activeId) ?? data?.[0] ?? null;
}

// ─── Core fetch-and-cache logic ───────────────────────────────────────────────

/** Exposed ID so useActiveRegulation can filter without a second DB query. */
let _activeId = 'champions-m-a';

async function fetchAndCacheRegulations(): Promise<Regulation[]> {
  const db        = await getDatabase();
  const lastFetch = await getLastRegFetchTime(db);
  const isStale   = Date.now() - lastFetch > CACHE_TTL.regulations;

  if (isStale) {
    try {
      const remote    = await fetchRegulations();
      const regs      = remote.regulations;
      // The first regulation in the index is considered the default active one.
      const defaultId = regs[0]?.id ?? 'champions-m-a';
      await upsertRegulations(db, regs, defaultId);
      _activeId = defaultId;
      return regs;
    } catch (err) {
      // Network failure — fall through to cached data.
      console.warn('[useRegulation] Remote fetch failed, using cache:', err);
    }
  }

  const cached = await getAllRegulations(db);
  const active = await getActiveRegulation(db);
  if (active) _activeId = active.id;
  return cached;
}
