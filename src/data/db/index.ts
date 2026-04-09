import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { up as migration001 } from './migrations/001_initial';

const DB_NAME = 'synergy.db';
const CURRENT_SCHEMA_VERSION = 1;

/** Singleton — one open connection for the app's lifetime. */
let _db: SQLiteDatabase | null = null;

/**
 * Returns the open database, initialising it on first call.
 *
 * On first launch expo-sqlite creates a new empty database in the app's
 * SQLite directory. Pending migrations are then applied in order, which
 * creates all tables.
 *
 * When the build-snapshot.ts script produces a pre-seeded snapshot.db,
 * we'll extend this function to copy the asset on first launch so users
 * get offline Pokémon data instantly without a network request.
 * See scripts/build-snapshot.ts for the plan.
 */
export async function getDatabase(): Promise<SQLiteDatabase> {
  if (_db) return _db;

  const db = await openDatabaseAsync(DB_NAME);

  // WAL mode for better concurrent read performance.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  // Enforce FK constraints (SQLite disables them by default).
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await runMigrations(db);
  _db = db;
  return db;
}

// ─── Private helpers ─────────────────────────────────────────────────────────

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  let currentVersion = 0;
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM db_meta WHERE key = 'schema_version'`,
    );
    currentVersion = row ? parseInt(row.value, 10) : 0;
  } catch {
    // db_meta doesn't exist yet — migration 001 will create it.
  }

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    await migration001(db);
  }

  // Add future migrations here:
  // if (currentVersion < 2) { await migration002(db); }
}
