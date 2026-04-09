/**
 * Regulation repository — all SQLite reads/writes for regulations.
 *
 * No React. No TanStack Query. Just async functions over the DB.
 * The query hooks in src/data/queries/ call these.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Regulation } from '../../types/regulation';
import type { RegulationRow } from '../db/schema';
import { DB_META_KEYS } from '../db/schema';

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Returns all cached regulations, most recently fetched first. */
export async function getAllRegulations(db: SQLiteDatabase): Promise<Regulation[]> {
  const rows = await db.getAllAsync<RegulationRow>(
    `SELECT * FROM regulations ORDER BY fetched_at DESC`,
  );
  return rows.map(deserialise);
}

/** Returns a single regulation by ID, or null if not cached. */
export async function getRegulationById(
  db: SQLiteDatabase,
  id: string,
): Promise<Regulation | null> {
  const row = await db.getFirstAsync<RegulationRow>(
    `SELECT * FROM regulations WHERE id = ?`,
    [id],
  );
  return row ? deserialise(row) : null;
}

/** Returns the regulation flagged as active, or null. */
export async function getActiveRegulation(
  db: SQLiteDatabase,
): Promise<Regulation | null> {
  const row = await db.getFirstAsync<RegulationRow>(
    `SELECT * FROM regulations WHERE is_active = 1 LIMIT 1`,
  );
  return row ? deserialise(row) : null;
}

/** Returns the timestamp (ms) of the last successful regulation fetch, or 0. */
export async function getLastRegFetchTime(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM db_meta WHERE key = ?`,
    [DB_META_KEYS.lastRegFetch],
  );
  return row ? parseInt(row.value, 10) : 0;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Upserts a list of regulations into the cache.
 * Marks the regulation with `activeId` as is_active = 1, all others = 0.
 * Runs in a single transaction.
 */
export async function upsertRegulations(
  db:          SQLiteDatabase,
  regulations: Regulation[],
  activeId:    string,
): Promise<void> {
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    // Clear active flag on all existing rows.
    await db.runAsync(`UPDATE regulations SET is_active = 0`);

    for (const reg of regulations) {
      await db.runAsync(
        `INSERT INTO regulations (id, display_name, data, is_active, fetched_at, source_url)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           display_name = excluded.display_name,
           data         = excluded.data,
           is_active    = excluded.is_active,
           fetched_at   = excluded.fetched_at,
           source_url   = excluded.source_url`,
        [
          reg.id,
          reg.displayName,
          JSON.stringify(reg),
          reg.id === activeId ? 1 : 0,
          now,
          reg.source ?? null,
        ],
      );
    }

    // Record fetch timestamp.
    await db.runAsync(
      `INSERT INTO db_meta(key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [DB_META_KEYS.lastRegFetch, String(now)],
    );
  });
}

/** Marks a single regulation as the active one, clearing others. */
export async function setActiveRegulation(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE regulations SET is_active = 0`);
    await db.runAsync(
      `UPDATE regulations SET is_active = 1 WHERE id = ?`,
      [id],
    );
  });
}

// ─── Serialisation ────────────────────────────────────────────────────────────

function deserialise(row: RegulationRow): Regulation {
  return JSON.parse(row.data) as Regulation;
}
