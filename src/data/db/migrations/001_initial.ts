import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 001 — initial schema.
 *
 * Creates every table from scratch. Subsequent migrations must only ALTER
 * or ADD; they must never re-run this one (guarded by schema_version check
 * in db/index.ts).
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS db_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pokemon (
      id           INTEGER PRIMARY KEY,
      name         TEXT    NOT NULL,
      display_name TEXT    NOT NULL,
      types        TEXT    NOT NULL,
      base_stats   TEXT    NOT NULL,
      abilities    TEXT    NOT NULL,
      egg_groups   TEXT    NOT NULL,
      sprite_url   TEXT,
      in_champions INTEGER NOT NULL DEFAULT 0,
      data_version TEXT    NOT NULL DEFAULT '',
      cached_at    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pokemon_forms (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id            INTEGER NOT NULL REFERENCES pokemon(id),
      form_name             TEXT    NOT NULL,
      display_name          TEXT    NOT NULL,
      types                 TEXT    NOT NULL,
      base_stats            TEXT    NOT NULL,
      abilities             TEXT    NOT NULL,
      is_champions_override INTEGER NOT NULL DEFAULT 0,
      data_version          TEXT    NOT NULL DEFAULT '',
      UNIQUE(species_id, form_name)
    );

    CREATE TABLE IF NOT EXISTS moves (
      id           INTEGER PRIMARY KEY,
      name         TEXT    NOT NULL UNIQUE,
      display_name TEXT    NOT NULL,
      type         TEXT    NOT NULL,
      category     TEXT    NOT NULL,
      power        INTEGER,
      accuracy     INTEGER,
      pp           INTEGER,
      priority     INTEGER NOT NULL DEFAULT 0,
      target       TEXT    NOT NULL DEFAULT 'single',
      effect_tags  TEXT    NOT NULL DEFAULT '[]',
      cached_at    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS abilities (
      id           INTEGER PRIMARY KEY,
      name         TEXT    NOT NULL UNIQUE,
      display_name TEXT    NOT NULL,
      effect_text  TEXT,
      effect_tags  TEXT    NOT NULL DEFAULT '[]',
      cached_at    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS type_chart (
      attacking_type TEXT NOT NULL,
      defending_type TEXT NOT NULL,
      multiplier     REAL NOT NULL,
      PRIMARY KEY (attacking_type, defending_type)
    );

    CREATE TABLE IF NOT EXISTS pokemon_learnset (
      species_id    INTEGER NOT NULL REFERENCES pokemon(id),
      move_name     TEXT    NOT NULL REFERENCES moves(name),
      learn_method  TEXT    NOT NULL,
      PRIMARY KEY (species_id, move_name)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id            TEXT    PRIMARY KEY,
      name          TEXT    NOT NULL,
      regulation_id TEXT    NOT NULL,
      archetype     TEXT,
      notes         TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      version       INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id              TEXT    PRIMARY KEY,
      team_id         TEXT    NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      slot            INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 6),
      species_id      INTEGER NOT NULL REFERENCES pokemon(id),
      form_name       TEXT,
      nickname        TEXT,
      level           INTEGER NOT NULL DEFAULT 50,
      item            TEXT,
      ability         TEXT    NOT NULL,
      tera_type       TEXT,
      nature          TEXT    NOT NULL,
      ev_spread       TEXT    NOT NULL DEFAULT '{"hp":0,"atk":0,"def":0,"spa":0,"spd":0,"spe":0}',
      iv_spread       TEXT    NOT NULL DEFAULT '{"hp":31,"atk":31,"def":31,"spa":31,"spd":31,"spe":31}',
      moves           TEXT    NOT NULL DEFAULT '["","","",""]',
      roles           TEXT    NOT NULL DEFAULT '[]',
      role_overridden INTEGER NOT NULL DEFAULT 0,
      UNIQUE(team_id, slot)
    );

    CREATE TABLE IF NOT EXISTS team_history (
      id         TEXT    PRIMARY KEY,
      team_id    TEXT    NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      snapshot   TEXT    NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_team_history ON team_history(team_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS regulations (
      id           TEXT    PRIMARY KEY,
      display_name TEXT    NOT NULL,
      data         TEXT    NOT NULL,
      is_active    INTEGER NOT NULL DEFAULT 0,
      fetched_at   INTEGER NOT NULL,
      source_url   TEXT
    );

    CREATE TABLE IF NOT EXISTS usage_stats (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      regulation_id   TEXT    NOT NULL,
      species_name    TEXT    NOT NULL,
      usage_percent   REAL    NOT NULL,
      sample_moves    TEXT,
      sample_items    TEXT,
      sample_spreads  TEXT,
      period          TEXT    NOT NULL,
      fetched_at      INTEGER NOT NULL,
      UNIQUE(regulation_id, species_name, period)
    );
    CREATE INDEX IF NOT EXISTS idx_usage_reg_period
      ON usage_stats(regulation_id, period);
  `);

  await db.runAsync(
    `INSERT OR IGNORE INTO db_meta(key, value) VALUES ('schema_version', '1')`,
  );
}
