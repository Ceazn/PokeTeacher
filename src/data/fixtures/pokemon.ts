/**
 * ~10 competitive Pokémon as PokemonWithRole fixtures for dev/testing.
 *
 * Stats are accurate to Scarlet/Violet / Champions base stats.
 * Tags are curated for the typical VGC set, not exhaustive.
 */
import type { PokemonWithRole } from '../../engine/synergy/types';

export const FIXTURE_POKEMON: PokemonWithRole[] = [
  {
    slug:           'amoonguss',
    displayName:    'Amoonguss',
    types:          ['Grass', 'Poison'],
    offensiveTypes: ['Grass', 'Poison'],
    baseStats:      { hp: 114, atk: 85, def: 70, spa: 85, spd: 80, spe: 30 },
    abilityTags:    ['regenerator'],
    moveTags:       ['redirect', 'recovery', 'spore'],
    roles:          ['redirector', 'bulky-support'],
  },

  {
    slug:           'incineroar',
    displayName:    'Incineroar',
    types:          ['Fire', 'Dark'],
    offensiveTypes: ['Fire', 'Dark'],
    baseStats:      { hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 60 },
    abilityTags:    ['intimidate'],
    moveTags:       ['fake-out', 'recovery'],
    roles:          ['fake-out', 'bulky-support'],
    teraType:       null,
  },

  {
    slug:           'miraidon',
    displayName:    'Miraidon',
    types:          ['Electric', 'Dragon'],
    offensiveTypes: ['Electric', 'Dragon'],
    baseStats:      { hp: 100, atk: 85, def: 100, spa: 135, spd: 115, spe: 135 },
    abilityTags:    ['hadron-engine'],
    moveTags:       ['pivot'],
    roles:          ['win-condition'],
    teraType:       null,
  },

  {
    slug:           'politoed',
    displayName:    'Politoed',
    types:          ['Water'],
    offensiveTypes: ['Water'],
    baseStats:      { hp: 90, atk: 75, def: 75, spa: 90, spd: 100, spe: 70 },
    abilityTags:    ['weather-setter:rain'],
    moveTags:       ['recovery'],
    roles:          ['setter:rain', 'bulky-support'],
    teraType:       null,
  },

  {
    slug:           'kingdra',
    displayName:    'Kingdra',
    types:          ['Water', 'Dragon'],
    offensiveTypes: ['Water', 'Dragon'],
    baseStats:      { hp: 75, atk: 95, def: 95, spa: 95, spd: 95, spe: 85 },
    abilityTags:    ['weather-abuser:rain'],
    moveTags:       [],
    roles:          ['abuser:rain', 'win-condition'],
    teraType:       null,
  },

  {
    slug:           'flutter-mane',
    displayName:    'Flutter Mane',
    types:          ['Ghost', 'Fairy'],
    offensiveTypes: ['Ghost', 'Fairy'],
    baseStats:      { hp: 55, atk: 55, def: 55, spa: 135, spd: 135, spe: 135 },
    abilityTags:    [],
    moveTags:       [],
    roles:          ['frail-attacker', 'win-condition'],
    teraType:       null,
  },

  {
    slug:           'torkoal',
    displayName:    'Torkoal',
    types:          ['Fire'],
    offensiveTypes: ['Fire'],
    baseStats:      { hp: 70, atk: 85, def: 140, spa: 85, spd: 70, spe: 20 },
    abilityTags:    ['weather-setter:sun'],
    moveTags:       ['trick-room'],
    roles:          ['setter:sun', 'setter:trick-room'],
    teraType:       null,
  },

  {
    slug:           'calyrex-shadow',
    displayName:    'Calyrex-Shadow',
    types:          ['Psychic', 'Ghost'],
    offensiveTypes: ['Psychic', 'Ghost'],
    baseStats:      { hp: 100, atk: 85, def: 80, spa: 165, spd: 100, spe: 150 },
    abilityTags:    [],
    moveTags:       [],
    roles:          ['win-condition', 'frail-attacker'],
    teraType:       null,
  },

  {
    slug:           'indeedee-f',
    displayName:    'Indeedee-F',
    types:          ['Psychic', 'Normal'],
    offensiveTypes: ['Psychic'],
    baseStats:      { hp: 70, atk: 55, def: 65, spa: 95, spd: 110, spe: 85 },
    abilityTags:    ['redirection'],
    moveTags:       ['trick-room', 'redirect', 'recovery'],
    roles:          ['redirector', 'setter:trick-room', 'bulky-support'],
    teraType:       null,
  },

  {
    slug:           'urshifu-single-strike',
    displayName:    'Urshifu-Single-Strike',
    types:          ['Fighting', 'Dark'],
    offensiveTypes: ['Fighting', 'Dark'],
    baseStats:      { hp: 100, atk: 130, def: 100, spa: 63, spd: 60, spe: 97 },
    abilityTags:    [],
    moveTags:       [],
    roles:          ['win-condition'],
    teraType:       null,
  },
];

/** Lookup by slug — O(1) access for tests and dev tooling. */
export const FIXTURE_POKEMON_MAP: Record<string, PokemonWithRole> = Object.fromEntries(
  FIXTURE_POKEMON.map((p) => [p.slug, p]),
);
