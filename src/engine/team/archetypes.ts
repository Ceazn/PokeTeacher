/**
 * Archetype definitions and role slot templates.
 *
 * Each archetype defines an ordered list of role slots. The team editor
 * displays slots in this order, labelled by their primary role.
 *
 * "required" slots must be filled before a team is considered complete.
 * "alternatives" are valid role substitutes for the same slot.
 */
import type { RoleTag } from '../../types/team';

export type Archetype = 'rain' | 'sun' | 'trick-room' | 'hyper-offense' | 'balance';

export interface RoleSlot {
  /** Display label for this slot in the UI. */
  label:        string;
  /** Plain-English description shown in empty-slot hint. */
  description:  string;
  /** The primary role that fills this slot. */
  primaryRole:  RoleTag;
  /** Roles that can substitute for the primary (slot still "filled"). */
  alternatives: RoleTag[];
  /** A required slot blocks "Save" until filled. */
  required:     boolean;
}

export interface ArchetypeTemplate {
  id:          Archetype;
  displayName: string;
  tagline:     string;
  /** One-sentence explanation of the archetype's game plan. */
  gameplan:    string;
  slots:       RoleSlot[];
}

// ─── Archetype definitions ────────────────────────────────────────────────────

export const ARCHETYPE_TEMPLATES: Record<Archetype, ArchetypeTemplate> = {

  rain: {
    id:          'rain',
    displayName: 'Rain',
    tagline:     'Swift Swim + Drizzle',
    gameplan:    'Set Rain on turn 1, then overwhelm with Swift Swim and Water-boosted damage.',
    slots: [
      {
        label:        'Rain Setter',
        description:  'Sets Rain automatically on entry (Drizzle) or via Rain Dance.',
        primaryRole:  'setter:rain',
        alternatives: [],
        required:     true,
      },
      {
        label:        'Rain Abuser',
        description:  'Doubles speed in Rain (Swift Swim) or gets boosted Water-type moves.',
        primaryRole:  'abuser:rain',
        alternatives: [],
        required:     true,
      },
      {
        label:        'Secondary Abuser',
        description:  'A second Rain beneficiary or a Fake Out user to protect the Rain setter.',
        primaryRole:  'abuser:rain',
        alternatives: ['fake-out', 'speed-control'],
        required:     true,
      },
      {
        label:        'Pivot / Protection',
        description:  'Redirects attacks or pivots out to bring in the setter safely.',
        primaryRole:  'pivot',
        alternatives: ['fake-out', 'redirector', 'bulky-support'],
        required:     false,
      },
      {
        label:        'Win Condition',
        description:  'A powerful attacker that closes out the game once Rain is up.',
        primaryRole:  'win-condition',
        alternatives: ['frail-attacker'],
        required:     false,
      },
      {
        label:        'Flex',
        description:  'Covers the team\'s remaining weaknesses or provides extra support.',
        primaryRole:  'flex',
        alternatives: ['bulky-support', 'speed-control', 'pivot'],
        required:     false,
      },
    ],
  },

  sun: {
    id:          'sun',
    displayName: 'Sun',
    tagline:     'Chlorophyll + Drought',
    gameplan:    'Set Sun, then fire off Eruptions and Solar Beams to overwhelm before the opponent can respond.',
    slots: [
      {
        label:        'Sun Setter',
        description:  'Sets Harsh Sunlight via Drought or Sunny Day.',
        primaryRole:  'setter:sun',
        alternatives: [],
        required:     true,
      },
      {
        label:        'Sun Abuser',
        description:  'Doubles speed in Sun (Chlorophyll) or maximises Fire-type power.',
        primaryRole:  'abuser:sun',
        alternatives: [],
        required:     true,
      },
      {
        label:        'Fire Attacker',
        description:  'Exploits the 1.5× Sun boost on Fire-type moves.',
        primaryRole:  'abuser:sun',
        alternatives: ['win-condition', 'frail-attacker'],
        required:     true,
      },
      {
        label:        'Pivot / Fake Out',
        description:  'Buys a free turn for the Sun setter to stay in safely.',
        primaryRole:  'fake-out',
        alternatives: ['pivot', 'bulky-support'],
        required:     false,
      },
      {
        label:        'Win Condition',
        description:  'Closes out the game when Sun threatens are in a positive position.',
        primaryRole:  'win-condition',
        alternatives: ['frail-attacker'],
        required:     false,
      },
      {
        label:        'Flex',
        description:  'Addresses water or ground threats that hard-check Sun teams.',
        primaryRole:  'flex',
        alternatives: ['bulky-support', 'redirector'],
        required:     false,
      },
    ],
  },

  'trick-room': {
    id:          'trick-room',
    displayName: 'Trick Room',
    tagline:     'Slow and Devastating',
    gameplan:    'Flip the speed order with Trick Room, then attack with slow, hard-hitting Pokémon that now move first.',
    slots: [
      {
        label:        'Primary TR Setter',
        description:  'Sets Trick Room — bulky enough to survive long enough to set it.',
        primaryRole:  'setter:trick-room',
        alternatives: [],
        required:     true,
      },
      {
        label:        'Backup TR Setter',
        description:  'A second Trick Room setter to ensure it goes up even after the first is KO\'d.',
        primaryRole:  'setter:trick-room',
        alternatives: [],
        required:     true,
      },
      {
        label:        'Slow Abuser',
        description:  'Very low base speed — moves first under Trick Room for massive damage.',
        primaryRole:  'abuser:trick-room',
        alternatives: [],
        required:     true,
      },
      {
        label:        'Second Slow Abuser',
        description:  'Another slow powerhouse to sustain pressure across Trick Room turns.',
        primaryRole:  'abuser:trick-room',
        alternatives: ['win-condition'],
        required:     true,
      },
      {
        label:        'Fake Out Support',
        description:  'Buys TR setters a free turn to safely set the field condition.',
        primaryRole:  'fake-out',
        alternatives: ['redirector', 'bulky-support'],
        required:     false,
      },
      {
        label:        'Flex',
        description:  'Speed control (Tailwind, Icy Wind) for non-TR turns, or extra bulk.',
        primaryRole:  'flex',
        alternatives: ['speed-control', 'bulky-support'],
        required:     false,
      },
    ],
  },

  'hyper-offense': {
    id:          'hyper-offense',
    displayName: 'Hyper Offense',
    tagline:     'Hit First, Hit Hard',
    gameplan:    'Overwhelm the opponent before they can establish position — speed control into back-to-back powerful attacks.',
    slots: [
      {
        label:        'Lead Win Condition',
        description:  'Your primary attacker — high speed, high power, brought to almost every game.',
        primaryRole:  'win-condition',
        alternatives: ['frail-attacker'],
        required:     true,
      },
      {
        label:        'Second Win Condition',
        description:  'A partner attacker that threatens different defensive types.',
        primaryRole:  'win-condition',
        alternatives: ['frail-attacker'],
        required:     true,
      },
      {
        label:        'Speed Control',
        description:  'Sets Tailwind or uses Icy Wind / Thunder Wave to give your attackers a speed advantage.',
        primaryRole:  'speed-control',
        alternatives: ['setter:tailwind'],
        required:     true,
      },
      {
        label:        'Fake Out Support',
        description:  'Flinches the fastest opposing threat, buying your sweepers a free turn.',
        primaryRole:  'fake-out',
        alternatives: ['bulky-support'],
        required:     false,
      },
      {
        label:        'Frail Attacker',
        description:  'A glass-cannon that hits exceptionally hard but needs protection.',
        primaryRole:  'frail-attacker',
        alternatives: ['win-condition'],
        required:     false,
      },
      {
        label:        'Flex',
        description:  'Filler or a bulkier option to handle specific problem matchups.',
        primaryRole:  'flex',
        alternatives: ['bulky-support', 'pivot'],
        required:     false,
      },
    ],
  },

  balance: {
    id:          'balance',
    displayName: 'Balance',
    tagline:     'Win Every Game Plan',
    gameplan:    'Flexible team that can adapt — strong win condition backed by support, speed control, and broad coverage.',
    slots: [
      {
        label:        'Win Condition',
        description:  'Your primary attacker or setup sweeper.',
        primaryRole:  'win-condition',
        alternatives: ['setup-sweeper'],
        required:     true,
      },
      {
        label:        'Bulky Support',
        description:  'Sustains momentum through recovery, status, or Intimidate.',
        primaryRole:  'bulky-support',
        alternatives: ['wall'],
        required:     true,
      },
      {
        label:        'Redirection / Fake Out',
        description:  'Protects the win condition from targeted attacks.',
        primaryRole:  'redirector',
        alternatives: ['fake-out'],
        required:     true,
      },
      {
        label:        'Speed Control',
        description:  'Controls the speed tier — Tailwind, Icy Wind, or Thunder Wave.',
        primaryRole:  'speed-control',
        alternatives: ['setter:tailwind'],
        required:     false,
      },
      {
        label:        'Pivot',
        description:  'Maintains momentum and brings in the right Pokémon at the right time.',
        primaryRole:  'pivot',
        alternatives: ['flex'],
        required:     false,
      },
      {
        label:        'Flex',
        description:  'Plugs the team\'s remaining coverage gaps.',
        primaryRole:  'flex',
        alternatives: ['frail-attacker', 'bulky-support'],
        required:     false,
      },
    ],
  },

};

export const ALL_ARCHETYPES = Object.values(ARCHETYPE_TEMPLATES);

/**
 * Returns the role slot for slot index i (0-based), or a generic flex slot
 * if the archetype template has fewer than 6 slots.
 */
export function getSlotTemplate(archetype: Archetype, slotIndex: number): RoleSlot {
  return (
    ARCHETYPE_TEMPLATES[archetype].slots[slotIndex] ?? {
      label:        'Flex',
      description:  'Open slot.',
      primaryRole:  'flex' as const,
      alternatives: [],
      required:     false,
    }
  );
}

/**
 * Returns true when the given roles satisfy the slot's primary role or one
 * of its alternatives.
 */
export function slotIsFilled(slot: RoleSlot, roles: import('../../types/team').RoleTag[]): boolean {
  const roleSet = new Set(roles);
  return roleSet.has(slot.primaryRole) || slot.alternatives.some((r) => roleSet.has(r));
}
