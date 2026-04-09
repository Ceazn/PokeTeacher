import type { AbilityTag, BaseStats, MoveTag, PokemonType, TypeChart } from '../../types/pokemon';
import type { Regulation } from '../../types/regulation';
import type { RoleTag } from '../../types/team';

// ─── Input types ──────────────────────────────────────────────────────────────

/**
 * A Pokémon prepared for consumption by the Synergy Engine.
 * Built by the repository layer from DB rows before passing to engine functions.
 */
export interface PokemonWithRole {
  slug:           string;
  displayName:    string;
  /** Defensive typing (what this Pokémon takes damage as). */
  types:          PokemonType[];
  /**
   * Types of moves this Pokémon can use offensively.
   * For placed team members: actual move types from their moveset.
   * For candidates without a moveset: their STAB type(s).
   */
  offensiveTypes: PokemonType[];
  baseStats:      BaseStats;
  abilityTags:    AbilityTag[];
  moveTags:       MoveTag[];
  /** Inferred or user-overridden roles. */
  roles:          RoleTag[];
  teraType:       PokemonType | null;
}

/**
 * Context passed to every engine function.
 * No global imports — all dependencies are explicit.
 */
export interface SynergyContext {
  typeChart:    TypeChart;
  usageStats:   UsageEntry[];   // may be empty; engine degrades gracefully
  regulation:   Regulation;
  /**
   * 0 = pure meta (weight usage heavily), 1 = fully off-meta (boost low-usage mons).
   * Controlled by the Creativity Dial.
   */
  creativityFactor: number;
}

export interface UsageEntry {
  speciesSlug:  string;
  usagePercent: number;
}

// ─── Intermediate scoring (used by explainer) ────────────────────────────────

export interface DefensiveDetail {
  /** Fraction of A's weaknesses that B resists or is immune to (0..1). */
  aCoveredByB:        number;
  /** Fraction of B's weaknesses that A resists or is immune to (0..1). */
  bCoveredByA:        number;
  /** Types that both members are weak to (shared threats). */
  sharedWeaknesses:   PokemonType[];
  /** Combined weighted score (0..1). */
  score:              number;
}

export interface OffensiveDetail {
  /** Union of types hit SE by A's offensive types. */
  seTypesA:           PokemonType[];
  /** Union of types hit SE by B's offensive types. */
  seTypesB:           PokemonType[];
  /** Types hit SE by neither A nor B individually but covered by the pair. */
  uniqueGapsFilled:   PokemonType[];
  /** Types no move in the pair hits SE. */
  uncoveredTypes:     PokemonType[];
  /** Combined weighted score (0..1). */
  score:              number;
}

// ─── Named strategic combos ───────────────────────────────────────────────────

export type ComboName =
  | 'weather:rain'  | 'weather:sun'  | 'weather:sand' | 'weather:snow'
  | 'trick-room'
  | 'tailwind-offense'
  | 'fake-out-protection'
  | 'redirection-core'
  | 'intimidate-chain'
  | 'speed-control-sweep';

export interface StrategicCombo {
  name:        ComboName;
  label:       string;      // "Rain Core"
  description: string;      // "Politoed sets Rain; Swift Swim activates on Kingdra"
  memberSlugs: string[];    // slugs of the members that form this combo
}

// ─── Pair result ──────────────────────────────────────────────────────────────

export type SynergyTier = 'poor' | 'decent' | 'strong' | 'excellent';

export interface PairSynergyResult {
  /** Slug pair key — always sorted alphabetically: "amoonguss+miraidon". */
  pairKey:          string;

  // Component scores (each 0..1)
  defensiveScore:   number;
  offensiveScore:   number;
  roleScore:        number;
  strategicScore:   number;

  /** Weighted composite score (0..1). */
  totalScore:       number;
  tier:             SynergyTier;

  /** Intermediate data for the explainer and dashboard. */
  defensiveDetail:  DefensiveDetail;
  offensiveDetail:  OffensiveDetail;

  combos:           StrategicCombo[];
  explanation:      string;
}

// ─── Team result ──────────────────────────────────────────────────────────────

export interface TypeCoverageReport {
  /** Types at least one team member hits super-effectively. */
  offensivelyCovered:    PokemonType[];
  /** Types no team member hits super-effectively. */
  offensivelyUncovered:  PokemonType[];
  /**
   * For each type, how many team members take super-effective damage from it.
   * Only includes types where count > 0.
   */
  weaknessCounts:        Partial<Record<PokemonType, number>>;
}

export interface RoleCoverageReport {
  present:    RoleTag[];
  /** Roles expected for the team's archetype but not filled. */
  missing:    RoleTag[];
  /** Roles filled by more than one member. */
  redundant:  RoleTag[];
}

export interface TeamSynergyResult {
  /** All pair scores, keyed by sorted pair slug: "a+b". */
  pairScores:     Record<string, PairSynergyResult>;
  /** Mean of all pair total scores. */
  overallScore:   number;
  tier:           SynergyTier;
  typeCoverage:   TypeCoverageReport;
  roleCoverage:   RoleCoverageReport;
  combos:         StrategicCombo[];
  explanation:    string;
}

// ─── Suggestion result ────────────────────────────────────────────────────────

export interface SuggestionResult {
  slug:          string;
  displayName:   string;
  totalScore:    number;
  tier:          SynergyTier;
  explanation:   string;
  rolesFilled:   RoleTag[];
  /** Usage percent from stats (undefined if no usage data). */
  usagePercent?: number;
}
