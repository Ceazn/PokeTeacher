/**
 * Fetches data from the synergy-data GitHub Pages repo.
 *
 * All methods are pure async functions — no React, no DB.
 * They throw on network error so callers can handle fallbacks.
 *
 * The app never fetches from PokéAPI or data.pkmn.cc directly;
 * those are consumed by the build-snapshot.ts script and the
 * weekly GitHub Action respectively.
 */
import { ENDPOINTS } from '../../config/endpoints';
import type {
  RemoteChampionsOverrides,
  RemoteChampionsRoster,
  RemoteRegulationsIndex,
} from './types';

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetches the regulations index from synergy-data. */
export async function fetchRegulations(): Promise<RemoteRegulationsIndex> {
  return fetchJson<RemoteRegulationsIndex>(ENDPOINTS.regulations);
}

/** Fetches the current Champions roster (list of legal species slugs). */
export async function fetchChampionsRoster(): Promise<RemoteChampionsRoster> {
  return fetchJson<RemoteChampionsRoster>(ENDPOINTS.championsRoster);
}

/** Fetches Champions-specific stat/ability/move overrides. */
export async function fetchChampionsOverrides(): Promise<RemoteChampionsOverrides> {
  return fetchJson<RemoteChampionsOverrides>(ENDPOINTS.championsOverrides);
}

/** Fetches the latest usage snapshot for a given regulation. */
export async function fetchUsageStats(regulationId: string): Promise<unknown> {
  return fetchJson<unknown>(ENDPOINTS.usageStats(regulationId));
}
