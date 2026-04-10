/**
 * useLiveSynergy — real-time team synergy derived from the draft store.
 *
 * Reads PokemonWithRole data and draft members from teamDraftStore, builds
 * a SynergyContext from the active regulation + bundled type chart, and runs
 * computeTeamSynergy() in a memoised call.  Returns null when the team has
 * fewer than 2 members with resolved species data.
 *
 * Because this is a plain hook the synergy re-runs only when the store slice
 * it reads actually changes — no unnecessary engine invocations.
 */
import { useMemo } from 'react';
import { useTeamDraftStore, selectTeamPokemon } from '../store/teamDraftStore';
import { useRegulationStore } from '../store/regulationStore';
import { computeTeamSynergy } from '../engine/synergy';
import { TYPE_CHART } from '../data/fixtures/typeChart';
import { FIXTURE_REGULATIONS } from '../data/fixtures/regulation';
import type { SynergyContext, TeamSynergyResult } from '../engine/synergy/types';

/**
 * Returns a live TeamSynergyResult that updates whenever the draft changes,
 * or null if not enough members have species data yet.
 */
export function useLiveSynergy(): TeamSynergyResult | null {
  // Subscribe to only the slices we need to avoid re-rendering on unrelated changes.
  const teamPokemon    = useTeamDraftStore(selectTeamPokemon);
  const activeReg      = useRegulationStore((s) => s.activeRegulation);

  return useMemo(() => {
    if (teamPokemon.length < 2) return null;

    const context: SynergyContext = {
      typeChart:       TYPE_CHART,
      usageStats:      [],          // populated when usage data is available
      regulation:      activeReg ?? FIXTURE_REGULATIONS[0],
      creativityFactor: 0.5,
    };

    return computeTeamSynergy(teamPokemon, context);
  }, [teamPokemon, activeReg]);
}

/**
 * Convenience variant that also returns the role coverage with archetype-aware
 * "missing" roles filled in.  Pass the team's archetype to get missing roles.
 */
export function useLiveSynergyWithRoles(
  archetype: import('../types/team').Archetype | null,
): TeamSynergyResult | null {
  const base = useLiveSynergy();
  const teamPokemon = useTeamDraftStore(selectTeamPokemon);

  return useMemo(() => {
    if (!base) return null;
    if (!archetype) return base;

    const { ARCHETYPE_TEMPLATES } = require('../engine/team/archetypes');
    const template = ARCHETYPE_TEMPLATES[archetype];
    if (!template) return base;

    // Collect all roles present on the team.
    const present = new Set(teamPokemon.flatMap((p) => p.roles));

    // A slot is "missing" if its primary role and all alternatives are absent.
    const missing = template.slots
      .filter((slot: import('../engine/team/archetypes').RoleSlot) =>
        !present.has(slot.primaryRole) &&
        slot.alternatives.every((alt: import('../types/team').RoleTag) => !present.has(alt)),
      )
      .map((slot: import('../engine/team/archetypes').RoleSlot) => slot.primaryRole);

    return {
      ...base,
      roleCoverage: {
        ...base.roleCoverage,
        missing,
      },
    };
  }, [base, archetype, teamPokemon]);
}
