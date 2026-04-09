/**
 * Team repository — SQLite CRUD for teams, members, and history.
 *
 * Conventions:
 *   - JSON columns (ev_spread, iv_spread, moves, roles, etc.) are parsed
 *     on read and serialised on write.
 *   - History is capped at MAX_HISTORY_ENTRIES per team (oldest pruned first).
 *   - All writes are wrapped in transactions for atomicity.
 */
import { v4 as uuidv4 } from 'uuid';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Team, TeamMember, TeamSnapshot } from '../../types/team';
import type { TeamRow, TeamMemberRow, TeamHistoryRow } from '../db/schema';

const MAX_HISTORY_ENTRIES = 20;

// ─── Team CRUD ────────────────────────────────────────────────────────────────

/** Returns all teams, newest first, without their members. */
export async function getAllTeams(db: SQLiteDatabase): Promise<Omit<Team, 'members'>[]> {
  const rows = await db.getAllAsync<TeamRow>(
    'SELECT * FROM teams ORDER BY updated_at DESC',
  );
  return rows.map(rowToTeamHead);
}

/** Returns a single team including its members, or null if not found. */
export async function getTeamById(db: SQLiteDatabase, id: string): Promise<Team | null> {
  const row = await db.getFirstAsync<TeamRow>('SELECT * FROM teams WHERE id = ?', [id]);
  if (!row) return null;
  const members = await getMembersForTeam(db, id);
  return { ...rowToTeamHead(row), members };
}

/** Inserts a new team (without members). Returns the new team's id. */
export async function createTeam(
  db:   SQLiteDatabase,
  data: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'members'>,
): Promise<string> {
  const id  = uuidv4();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO teams (id, name, regulation_id, archetype, notes, created_at, updated_at, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [id, data.name, data.regulationId, data.archetype ?? null, data.notes ?? null, now, now],
  );
  return id;
}

/** Updates mutable team fields (name, archetype, notes). Bumps version + updated_at. */
export async function updateTeam(
  db:   SQLiteDatabase,
  id:   string,
  data: Partial<Pick<Team, 'name' | 'archetype' | 'notes'>>,
): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    `UPDATE teams
     SET name = COALESCE(?, name),
         archetype = COALESCE(?, archetype),
         notes = COALESCE(?, notes),
         updated_at = ?,
         version = version + 1
     WHERE id = ?`,
    [data.name ?? null, data.archetype ?? null, data.notes ?? null, now, id],
  );
}

/** Deletes a team and all its members and history. */
export async function deleteTeam(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM team_history WHERE team_id = ?', [id]);
    await db.runAsync('DELETE FROM team_members WHERE team_id = ?', [id]);
    await db.runAsync('DELETE FROM teams WHERE id = ?', [id]);
  });
}

// ─── Member CRUD ──────────────────────────────────────────────────────────────

/** Returns all members for a team, ordered by slot. */
export async function getMembersForTeam(
  db:     SQLiteDatabase,
  teamId: string,
): Promise<TeamMember[]> {
  const rows = await db.getAllAsync<TeamMemberRow>(
    'SELECT * FROM team_members WHERE team_id = ? ORDER BY slot',
    [teamId],
  );
  return rows.map(rowToMember);
}

/** Upserts a single team member (insert or replace by id). */
export async function upsertMember(db: SQLiteDatabase, member: TeamMember): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO team_members
       (id, team_id, slot, species_id, form_name, nickname, level,
        item, ability, tera_type, nature, ev_spread, iv_spread,
        moves, roles, role_overridden)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      member.id,
      member.teamId,
      member.slot,
      member.speciesId,
      member.formName,
      member.nickname,
      member.level,
      member.item,
      member.ability,
      member.teraType,
      member.nature,
      JSON.stringify(member.evSpread),
      JSON.stringify(member.ivSpread),
      JSON.stringify(member.moves),
      JSON.stringify(member.roles),
      member.roleOverridden ? 1 : 0,
    ],
  );
}

/** Replaces all members for a team in one transaction. Bumps team updated_at. */
export async function replaceAllMembers(
  db:      SQLiteDatabase,
  teamId:  string,
  members: TeamMember[],
): Promise<void> {
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM team_members WHERE team_id = ?', [teamId]);
    for (const m of members) {
      await upsertMember(db, m);
    }
    await db.runAsync(
      'UPDATE teams SET updated_at = ?, version = version + 1 WHERE id = ?',
      [now, teamId],
    );
  });
}

/** Removes a single member by id. */
export async function deleteMember(db: SQLiteDatabase, memberId: string): Promise<void> {
  await db.runAsync('DELETE FROM team_members WHERE id = ?', [memberId]);
}

// ─── History ──────────────────────────────────────────────────────────────────

/**
 * Saves a snapshot to team_history.
 * Prunes oldest entries if the team exceeds MAX_HISTORY_ENTRIES.
 */
export async function saveSnapshot(
  db:       SQLiteDatabase,
  teamId:   string,
  snapshot: TeamSnapshot,
): Promise<void> {
  const id  = uuidv4();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO team_history (id, team_id, snapshot, created_at) VALUES (?, ?, ?, ?)',
      [id, teamId, JSON.stringify(snapshot), now],
    );

    // Prune oldest beyond cap
    await db.runAsync(
      `DELETE FROM team_history
       WHERE team_id = ?
         AND id NOT IN (
           SELECT id FROM team_history
           WHERE team_id = ?
           ORDER BY created_at DESC
           LIMIT ?
         )`,
      [teamId, teamId, MAX_HISTORY_ENTRIES],
    );
  });
}

/** Returns all history snapshots for a team, newest first. */
export async function getTeamHistory(
  db:     SQLiteDatabase,
  teamId: string,
): Promise<TeamSnapshot[]> {
  const rows = await db.getAllAsync<TeamHistoryRow>(
    'SELECT * FROM team_history WHERE team_id = ? ORDER BY created_at DESC',
    [teamId],
  );
  return rows.map((r) => JSON.parse(r.snapshot) as TeamSnapshot);
}

// ─── Row ↔ Domain converters ──────────────────────────────────────────────────

function rowToTeamHead(row: TeamRow): Omit<Team, 'members'> {
  return {
    id:           row.id,
    name:         row.name,
    regulationId: row.regulation_id,
    archetype:    (row.archetype as Team['archetype']) ?? null,
    notes:        row.notes,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
    version:      row.version,
  };
}

function rowToMember(row: TeamMemberRow): TeamMember {
  return {
    id:             row.id,
    teamId:         row.team_id,
    slot:           row.slot as TeamMember['slot'],
    speciesId:      row.species_id,
    formName:       row.form_name,
    nickname:       row.nickname,
    level:          row.level,
    item:           row.item,
    ability:        row.ability,
    teraType:       row.tera_type as TeamMember['teraType'],
    nature:         row.nature as TeamMember['nature'],
    evSpread:       JSON.parse(row.ev_spread),
    ivSpread:       JSON.parse(row.iv_spread),
    moves:          JSON.parse(row.moves),
    roles:          JSON.parse(row.roles),
    roleOverridden: row.role_overridden === 1,
  };
}
