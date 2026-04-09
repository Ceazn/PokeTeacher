/**
 * TypeScript row types that mirror schema.sql exactly.
 * JSON columns are stored as TEXT in SQLite and typed as string here.
 * Repositories are responsible for parsing/serialising them.
 */

export interface DbMetaRow {
  key:   string;
  value: string;
}

export interface PokemonRow {
  id:           number;
  name:         string;
  display_name: string;
  types:        string;  // JSON: string[]
  base_stats:   string;  // JSON: BaseStats
  abilities:    string;  // JSON: Ability[]
  egg_groups:   string;  // JSON: string[]
  sprite_url:   string | null;
  in_champions: number;  // 0 | 1
  data_version: string;
  cached_at:    number;
}

export interface PokemonFormRow {
  id:                    number;
  species_id:            number;
  form_name:             string;
  display_name:          string;
  types:                 string;  // JSON
  base_stats:            string;  // JSON
  abilities:             string;  // JSON
  is_champions_override: number;  // 0 | 1
  data_version:          string;
}

export interface MoveRow {
  id:           number;
  name:         string;
  display_name: string;
  type:         string;
  category:     string;
  power:        number | null;
  accuracy:     number | null;
  pp:           number | null;
  priority:     number;
  target:       string;
  effect_tags:  string;  // JSON: MoveTag[]
  cached_at:    number;
}

export interface AbilityRow {
  id:           number;
  name:         string;
  display_name: string;
  effect_text:  string | null;
  effect_tags:  string;  // JSON: AbilityTag[]
  cached_at:    number;
}

export interface TypeChartRow {
  attacking_type: string;
  defending_type: string;
  multiplier:     number;
}

export interface TeamRow {
  id:            string;
  name:          string;
  regulation_id: string;
  archetype:     string | null;
  notes:         string | null;
  created_at:    number;
  updated_at:    number;
  version:       number;
}

export interface TeamMemberRow {
  id:              string;
  team_id:         string;
  slot:            number;
  species_id:      number;
  form_name:       string | null;
  nickname:        string | null;
  level:           number;
  item:            string | null;
  ability:         string;
  tera_type:       string | null;
  nature:          string;
  ev_spread:       string;  // JSON
  iv_spread:       string;  // JSON
  moves:           string;  // JSON: [string, string, string, string]
  roles:           string;  // JSON: RoleTag[]
  role_overridden: number;  // 0 | 1
}

export interface TeamHistoryRow {
  id:         string;
  team_id:    string;
  snapshot:   string;  // JSON: TeamSnapshot
  created_at: number;
}

export interface RegulationRow {
  id:           string;
  display_name: string;
  data:         string;  // JSON: Regulation
  is_active:    number;  // 0 | 1
  fetched_at:   number;
  source_url:   string | null;
}

export interface UsageStatsRow {
  id:             number;
  regulation_id:  string;
  species_name:   string;
  usage_percent:  number;
  sample_moves:   string | null;  // JSON
  sample_items:   string | null;  // JSON
  sample_spreads: string | null;  // JSON
  period:         string;
  fetched_at:     number;
}

/** All known db_meta keys, kept in one place to avoid typos. */
export const DB_META_KEYS = {
  schemaVersion:      'schema_version',
  snapshotVersion:    'snapshot_version',
  lastRegFetch:       'last_reg_fetch',
  lastUsageFetch:     'last_usage_fetch',
  lastOverrideFetch:  'last_override_fetch',
} as const;

export type DbMetaKey = typeof DB_META_KEYS[keyof typeof DB_META_KEYS];
