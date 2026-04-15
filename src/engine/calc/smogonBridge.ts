/**
 * Bridge between our TeamMember / PokemonWithRole types and @smogon/calc.
 *
 * @smogon/calc uses display names and its own stat format.
 * This module handles the translation so the calc screen stays clean.
 *
 * Pure functions — no side effects, no React.
 */
import { Generations, Pokemon, Move, Field, calculate, type Result } from '@smogon/calc';
import type { TeamMember } from '../../types/team';
import type { PokemonWithRole } from '../synergy/types';

const gen = Generations.get(9);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalcInput {
  attacker:     TeamMember;
  attackerData: PokemonWithRole;
  defender:     TeamMember;
  defenderData: PokemonWithRole;
  moveSlug:     string;          // e.g. 'thunderbolt'
  /** Extra field modifiers the user toggles. */
  modifiers?: {
    tailwind?:     boolean;  // attacker side
    helpingHand?:  boolean;  // attacker side
  };
}

export interface CalcOutput {
  /** Full description string from @smogon/calc. */
  desc:           string;
  /** Damage range (16 rolls). */
  damageRolls:    number[];
  /** [min%, max%] of defender's HP. */
  damagePercent:  [number, number];
  /** KO chance as a fraction in [0, 1] (1-hit KO). */
  koChance:       number;
  /** Human-readable KO label, e.g. "guaranteed OHKO", "87.5% OHKO", "guaranteed 2HKO". */
  koLabel:        string;
}

// ─── Main function ─────────────────────────────────────────────────────────

/**
 * Runs one damage calculation and returns a structured result.
 * Returns null if the move slug cannot be resolved (unknown move).
 */
export function runCalc(input: CalcInput): CalcOutput | null {
  const { attacker, attackerData, defender, defenderData, moveSlug, modifiers = {} } = input;

  try {
    const atkPokemon = buildCalcPokemon(attacker, attackerData);
    const defPokemon = buildCalcPokemon(defender, defenderData);
    const move       = new Move(gen, slugToCalcName(moveSlug));

    const field = new Field({
      gameType:  'Doubles',
      attackerSide: {
        isTailwind:    modifiers.tailwind    ?? false,
        isHelpingHand: modifiers.helpingHand ?? false,
      },
    });

    const result: Result = calculate(gen, atkPokemon, defPokemon, move, field);

    const damageRolls = Array.isArray(result.damage)
      ? (result.damage as number[])
      : [result.damage as number];

    const defHp = defPokemon.originalCurHP;
    const minPct = Math.round((Math.min(...damageRolls) / defHp) * 1000) / 10;
    const maxPct = Math.round((Math.max(...damageRolls) / defHp) * 1000) / 10;

    const koChance = result.kochance().chance ?? 0;
    const koLabel  = formatKoLabel(result);

    return {
      desc:          result.desc(),
      damageRolls,
      damagePercent: [minPct, maxPct],
      koChance,
      koLabel,
    };
  } catch {
    // Unknown move name, unsupported species, etc.
    return null;
  }
}

/**
 * For a given defender + spread, checks which of a list of benchmark moves
 * can OHKO or 2HKO it.  Returns an array of survival/KO annotations.
 */
export interface BenchmarkResult {
  moveLabel:    string;  // "252+ SpA Miraidon Thunderbolt"
  koLabel:      string;
  survives:     boolean;
}

export function checkBenchmarks(
  defender:     TeamMember,
  defenderData: PokemonWithRole,
  benchmarks:   Array<{ attacker: TeamMember; attackerData: PokemonWithRole; moveSlug: string }>,
): BenchmarkResult[] {
  return benchmarks.flatMap(({ attacker, attackerData, moveSlug }) => {
    const out = runCalc({ attacker, attackerData, defender, defenderData, moveSlug });
    if (!out) return [];
    return [{
      moveLabel: out.desc.split(':')[0] ?? out.desc,
      koLabel:   out.koLabel,
      survives:  out.koChance === 0,
    }];
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalcPokemon(member: TeamMember, data: PokemonWithRole): Pokemon {
  return new Pokemon(gen, data.displayName, {
    level:  member.level,
    nature: member.nature,
    evs: {
      hp:  member.evSpread.hp,
      atk: member.evSpread.atk,
      def: member.evSpread.def,
      spa: member.evSpread.spa,
      spd: member.evSpread.spd,
      spe: member.evSpread.spe,
    },
    ivs: {
      hp:  member.ivSpread.hp,
      atk: member.ivSpread.atk,
      def: member.ivSpread.def,
      spa: member.ivSpread.spa,
      spd: member.ivSpread.spd,
      spe: member.ivSpread.spe,
    },
    item:     member.item ? slugToCalcName(member.item) : undefined,
    ability:  slugToCalcName(member.ability),
    teraType: member.teraType ?? undefined,
  });
}

/**
 * Converts a slug to the Title Case display name @smogon/calc expects.
 * "thunderbolt" → "Thunderbolt"
 * "choice-specs" → "Choice Specs"
 */
function slugToCalcName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatKoLabel(result: Result): string {
  const ko = result.kochance();
  const chance = ko.chance ?? 0;
  if (chance === 0) return 'Does not OHKO';
  if (chance >= 1)  return 'Guaranteed OHKO';
  return `${(chance * 100).toFixed(1)}% OHKO`;
}
