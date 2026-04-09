import type { PokemonType, StatName } from './pokemon';

export type Nature =
  | 'Hardy' | 'Lonely' | 'Brave' | 'Adamant' | 'Naughty'
  | 'Bold'  | 'Docile' | 'Relaxed' | 'Impish' | 'Lax'
  | 'Timid' | 'Hasty'  | 'Serious' | 'Jolly'  | 'Naive'
  | 'Modest'| 'Mild'   | 'Quiet'   | 'Bashful' | 'Rash'
  | 'Calm'  | 'Gentle' | 'Sassy'   | 'Careful' | 'Quirky';

export type EVSpread = Record<StatName, number>;
export type IVSpread = Record<StatName, number>;

/**
 * Role tags used by the Synergy Engine.
 * A Pokémon may fill more than one role (e.g., "setter" + "pivot").
 */
export type RoleTag =
  | 'setter:rain'  | 'setter:sun'   | 'setter:sand' | 'setter:snow'
  | 'setter:trick-room' | 'setter:tailwind'
  | 'abuser:rain'  | 'abuser:sun'   | 'abuser:sand' | 'abuser:snow'
  | 'abuser:trick-room'
  | 'redirector'
  | 'fake-out'
  | 'pivot'
  | 'frail-attacker'
  | 'bulky-support'
  | 'speed-control'
  | 'win-condition'
  | 'setup-sweeper'
  | 'wall'
  | 'flex';

/** A single Pokémon slot within a team draft. */
export interface TeamMember {
  id:        string;       // UUID
  teamId:    string;
  slot:      1 | 2 | 3 | 4 | 5 | 6;
  speciesId: number;
  formName:  string | null;  // null = base form
  nickname:  string | null;
  level:     number;         // default 50
  item:      string | null;
  ability:   string;
  teraType:  PokemonType | null;
  nature:    Nature;
  evSpread:  EVSpread;
  ivSpread:  IVSpread;
  moves:     [string, string, string, string];
  /** Inferred or user-overridden role tags. */
  roles:         RoleTag[];
  /** True when the user has explicitly set the role, overriding inference. */
  roleOverridden: boolean;
}

export interface Team {
  id:           string;   // UUID
  name:         string;
  regulationId: string;
  archetype:    Archetype | null;
  notes:        string | null;
  createdAt:    number;   // Unix ms
  updatedAt:    number;
  version:      number;
  members:      TeamMember[];
}

export type Archetype = 'rain' | 'sun' | 'trick-room' | 'hyper-offense' | 'balance';

/** A snapshot stored in team_history. */
export interface TeamSnapshot {
  team:    Omit<Team, 'members'>;
  members: TeamMember[];
  savedAt: number;
}
