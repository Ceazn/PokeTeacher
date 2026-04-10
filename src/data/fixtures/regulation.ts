/**
 * Static fixture data for development and tests.
 * Import these instead of hitting the network when you want UI work unblocked.
 */
import type { Regulation } from '../../types/regulation';

export const FIXTURE_REGULATION_M_A: Regulation = {
  id:            'champions-m-a',
  displayName:   'Pokémon Champions Regulation M-A',
  game:          'champions',
  format:        'doubles',
  levelCap:      50,
  teamSize:      { min: 4, max: 6, battleSize: 4 },
  speciesSource: 'champions-roster',
  speciesBanlist:   [],
  restrictedPool:   [
    'miraidon', 'koraidon', 'zacian', 'zamazenta',
    'calyrex-ice', 'calyrex-shadow',
    'necrozma-dusk-mane', 'necrozma-dawn-wings',
    'eternatus', 'kyogre', 'groudon', 'rayquaza',
  ],
  restrictedLimit:  2,
  itemBanlist:      [],
  moveBanlist:      [],
  clauseList:       ['species-clause'],
  gimmicks:         { mega: true, tera: true, dynamax: false, zMove: false },
  effectiveFrom:    '2026-04-01',
  effectiveTo:      null,
  source:           'https://www.pokemon.com/',
  notes:            'Launch regulation for Pokémon Champions.',
};

/** All known regulations — mirrors the structure of the remote index.json. */
export const FIXTURE_REGULATIONS: Regulation[] = [
  FIXTURE_REGULATION_M_A,
];

/** Species slugs available in the Champions roster fixture (small set for dev). */
export const FIXTURE_CHAMPIONS_ROSTER: string[] = [
  'bulbasaur',   'charmander',  'squirtle',
  'pikachu',     'gengar',      'alakazam',
  'machamp',     'gyarados',    'lapras',
  'snorlax',     'dragonite',   'mewtwo',
  'charizard',   'blastoise',   'venusaur',
  'typhlosion',  'feraligatr',  'meganium',
  'espeon',      'umbreon',
  'garchomp',    'lucario',     'togekiss',
  'rotom-wash',  'amoonguss',   'incineroar',
  'flutter-mane','great-tusk',  'iron-bundle',
  'miraidon',    'koraidon',
  'zacian',      'zamazenta',
  'calyrex-ice', 'calyrex-shadow',
  // Weather / trick-room supports present in fixtures
  'politoed',    'kingdra',     'torkoal',
  'indeedee-f',  'urshifu-single-strike',
];
