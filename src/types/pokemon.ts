/** The 18 Pokémon types. */
export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

export type StatName = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export interface BaseStats {
  hp:  number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface Ability {
  name:     string;
  slot:     1 | 2 | 3; // 3 = hidden ability
  isHidden: boolean;
}

/** A species as stored in the DB (base form). */
export interface Species {
  id:          number;   // PokéAPI national dex ID
  name:        string;   // slug "great-tusk"
  displayName: string;   // "Great Tusk"
  types:       PokemonType[];
  baseStats:   BaseStats;
  abilities:   Ability[];
  eggGroups:   string[];
  spriteUrl:   string | null;
  inChampions: boolean;
  dataVersion: string;
  cachedAt:    number;   // Unix ms
}

/** A Mega / alternate form (may carry Champions overrides). */
export interface PokemonForm {
  id:                  number;
  speciesId:           number;
  formName:            string;   // "mega" | "mega-x" | "gmax" etc.
  displayName:         string;
  types:               PokemonType[];
  baseStats:           BaseStats;
  abilities:           Ability[];
  isChampionsOverride: boolean;
  dataVersion:         string;
}

/** Move category. */
export type MoveCategory = 'physical' | 'special' | 'status';

/** Engine-relevant tags on a move. */
export type MoveTag =
  | 'redirect'       // Follow Me / Rage Powder
  | 'fake-out'
  | 'priority'
  | 'spread'         // hits both opponents
  | 'weather:rain' | 'weather:sun' | 'weather:sand' | 'weather:snow'
  | 'trick-room'
  | 'tailwind'
  | 'sleep'
  | 'protect'
  | 'setup'          // stat-raising move
  | 'recovery';

export interface Move {
  id:          number;
  name:        string;
  displayName: string;
  type:        PokemonType;
  category:    MoveCategory;
  power:       number | null;
  accuracy:    number | null;
  pp:          number;
  priority:    number;
  target:      'single' | 'spread' | 'self' | 'ally' | 'all' | 'random';
  effectTags:  MoveTag[];
  cachedAt:    number;
}

/** Engine-relevant tags on an ability. */
export type AbilityTag =
  | 'weather-setter:rain' | 'weather-setter:sun'
  | 'weather-setter:sand' | 'weather-setter:snow'
  | 'weather-abuser:rain' | 'weather-abuser:sun'
  | 'weather-abuser:sand' | 'weather-abuser:snow'
  | 'speed-boost'
  | 'intimidate'
  | 'redirection'    // Storm Drain / Lightning Rod
  | 'trick-room-abuser' // very low base speed benefit
  | 'screen-setter'
  | 'priority-immunity';

export interface Ability_ {
  id:          number;
  name:        string;
  displayName: string;
  effectText:  string | null;
  effectTags:  AbilityTag[];
  cachedAt:    number;
}

/** Full type-effectiveness chart: attacking → defending → multiplier. */
export type TypeChart = Record<string, Record<string, number>>;
