/**
 * Complete Gen 6+ Pokémon type chart (sparse — missing entries default to 1×).
 * This is stable reference data; it does not change between games.
 * Used by engine tests and by the build-snapshot script to seed the DB.
 *
 * Format: typeChart[attackingType][defendingType] = multiplier
 * Only non-1× values are listed to keep the file compact.
 */
import type { TypeChart } from '../../types/pokemon';

export const TYPE_CHART: TypeChart = {
  Normal: {
    Rock: 0.5, Steel: 0.5, Ghost: 0,
  },
  Fire: {
    Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5,
    Grass: 2,  Bug: 2,     Ice: 2,    Steel: 2,
  },
  Water: {
    Water: 0.5, Grass: 0.5, Dragon: 0.5,
    Fire: 2,    Ground: 2,  Rock: 2,
  },
  Electric: {
    Electric: 0.5, Grass: 0.5, Dragon: 0.5, Ground: 0,
    Flying: 2,     Water: 2,
  },
  Grass: {
    Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5,
    Water: 2,  Ground: 2,  Rock: 2,
  },
  Ice: {
    Water: 0.5, Ice: 0.5, Steel: 0.5, Fire: 0.5,
    Grass: 2,   Ground: 2, Flying: 2, Dragon: 2,
  },
  Fighting: {
    Bug: 0.5, Psychic: 0.5, Flying: 0.5, Poison: 0.5, Fairy: 0.5, Ghost: 0,
    Normal: 2, Ice: 2,      Rock: 2,     Dark: 2,      Steel: 2,
  },
  Poison: {
    Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0,
    Grass: 2,    Fairy: 2,
  },
  Ground: {
    Grass: 0.5, Bug: 0.5, Flying: 0,
    Fire: 2,    Electric: 2, Poison: 2, Rock: 2, Steel: 2,
  },
  Flying: {
    Electric: 0.5, Rock: 0.5, Steel: 0.5,
    Grass: 2,      Fighting: 2, Bug: 2,
  },
  Psychic: {
    Psychic: 0.5, Steel: 0.5, Dark: 0,
    Fighting: 2,  Poison: 2,
  },
  Bug: {
    Fire: 0.5, Fighting: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5,
    Grass: 2,  Psychic: 2,   Dark: 2,
  },
  Rock: {
    Fighting: 0.5, Ground: 0.5, Steel: 0.5,
    Fire: 2,       Ice: 2,      Flying: 2, Bug: 2,
  },
  Ghost: {
    Normal: 0, Dark: 0.5,
    Psychic: 2, Ghost: 2,
  },
  Dragon: {
    Steel: 0.5, Fairy: 0,
    Dragon: 2,
  },
  Dark: {
    Fighting: 0.5, Dark: 0.5, Fairy: 0.5,
    Psychic: 2,    Ghost: 2,
  },
  Steel: {
    Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5,
    Ice: 2,    Rock: 2,    Fairy: 2,
  },
  Fairy: {
    Fire: 0.5, Poison: 0.5, Steel: 0.5,
    Fighting: 2, Dragon: 2, Dark: 2,
  },
};
