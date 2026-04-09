/**
 * Pokémon Showdown paste import and export.
 *
 * The format is the standard Showdown export — round-trippable, zero data loss.
 * Pure functions — no side effects, no DB access, no React.
 */
import { v4 as uuidv4 } from 'uuid';
import type { PokemonType } from '../../types/pokemon';
import type { EVSpread, IVSpread, Nature, TeamMember } from '../../types/team';

// ─── Stat abbreviations ───────────────────────────────────────────────────────

const STAT_ABBREVS = {
  hp:  'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
} as const;

type StatKey = keyof typeof STAT_ABBREVS;
const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

const ABBREV_TO_KEY: Record<string, StatKey> = {
  'HP': 'hp', 'Atk': 'atk', 'Def': 'def',
  'SpA': 'spa', 'SpD': 'spd', 'Spe': 'spe',
};

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Converts a list of TeamMember objects into a Showdown paste string.
 * Members are separated by blank lines.
 */
export function exportToShowdown(members: TeamMember[], slugToDisplayName: Record<number, string>): string {
  return members.map((m) => memberToShowdown(m, slugToDisplayName)).join('\n\n');
}

function memberToShowdown(
  m: TeamMember,
  slugToDisplayName: Record<number, string>,
): string {
  const name = slugToDisplayName[m.speciesId] ?? `Species_${m.speciesId}`;
  const lines: string[] = [];

  // Line 1: [Nickname (]Species[)] @ Item
  const itemDisplay = m.item ? formatItemName(m.item) : null;
  if (m.nickname && m.nickname !== name) {
    lines.push(itemDisplay ? `${m.nickname} (${name}) @ ${itemDisplay}` : `${m.nickname} (${name})`);
  } else {
    lines.push(itemDisplay ? `${name} @ ${itemDisplay}` : name);
  }

  lines.push(`Ability: ${formatAbility(m.ability)}`);

  if (m.level !== 50) {
    lines.push(`Level: ${m.level}`);
  }

  if (m.teraType) {
    lines.push(`Tera Type: ${m.teraType}`);
  }

  const evLine = formatSpread(m.evSpread, 0);
  if (evLine) lines.push(`EVs: ${evLine}`);

  const ivLine = formatSpread(m.ivSpread, 31);
  if (ivLine) lines.push(`IVs: ${ivLine}`);

  lines.push(`${m.nature} Nature`);

  for (const move of m.moves) {
    if (move) lines.push(`- ${formatMoveName(move)}`);
  }

  return lines.join('\n');
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  members:  ParsedMember[];
  warnings: string[];
}

/** A parsed member — species is a string slug (caller resolves to speciesId). */
export interface ParsedMember {
  speciesSlug:  string;   // normalised slug: "flutter-mane"
  formName:     string | null;
  nickname:     string | null;
  item:         string | null;
  ability:      string;
  level:        number;
  teraType:     PokemonType | null;
  nature:       Nature;
  evSpread:     EVSpread;
  ivSpread:     IVSpread;
  moves:        [string, string, string, string];
}

/**
 * Parses a Showdown paste into a list of ParsedMember objects.
 * Returns warnings for any non-fatal parse issues.
 */
export function importFromShowdown(paste: string): ImportResult {
  const warnings: string[] = [];
  const blocks = paste.trim().split(/\n\s*\n/);
  const members: ParsedMember[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;
    const result = parseBlock(block.trim(), warnings);
    if (result) members.push(result);
  }

  return { members, warnings };
}

function parseBlock(block: string, warnings: string[]): ParsedMember | null {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // ── Line 1: species/nickname/item ──────────────────────────────────────────
  const firstLine = lines[0];
  let speciesSlug: string;
  let formName: string | null = null;
  let nickname: string | null = null;
  let item: string | null = null;

  // Split on " @ " to get item
  const atIdx = firstLine.indexOf(' @ ');
  const nameSection = atIdx >= 0 ? firstLine.slice(0, atIdx).trim() : firstLine.trim();
  if (atIdx >= 0) {
    item = firstLine.slice(atIdx + 3).trim();
  }

  // Detect "Nickname (Species)" pattern
  const parenMatch = nameSection.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (parenMatch) {
    nickname    = parenMatch[1].trim();
    const full  = parenMatch[2].trim();
    speciesSlug = normaliseSlug(full);
  } else {
    speciesSlug = normaliseSlug(nameSection);
  }

  // ── Parse remaining lines ──────────────────────────────────────────────────
  let ability  = 'Unknown';
  let level    = 50;
  let teraType: PokemonType | null = null;
  let nature: Nature = 'Hardy';
  let evSpread: EVSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  let ivSpread: IVSpread = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
  const moves: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('Ability:')) {
      ability = normaliseSlug(line.slice(8).trim());
      continue;
    }
    if (line.startsWith('Level:')) {
      level = parseInt(line.slice(6).trim(), 10) || 50;
      continue;
    }
    if (line.startsWith('Tera Type:')) {
      teraType = line.slice(10).trim() as PokemonType;
      continue;
    }
    if (line.startsWith('EVs:')) {
      evSpread = parseSpread(line.slice(4).trim(), 0) as EVSpread;
      continue;
    }
    if (line.startsWith('IVs:')) {
      ivSpread = parseSpread(line.slice(4).trim(), 31) as IVSpread;
      continue;
    }
    if (line.endsWith(' Nature')) {
      nature = line.slice(0, -7).trim() as Nature;
      continue;
    }
    if (line.startsWith('- ')) {
      moves.push(normaliseSlug(line.slice(2).trim()));
      continue;
    }
    // Unknown line — warn but continue
    warnings.push(`Unrecognised line: "${line}"`);
  }

  // Pad moves to exactly 4
  while (moves.length < 4) moves.push('');

  return {
    speciesSlug,
    formName: formName ?? extractFormName(speciesSlug),
    nickname: nickname ?? null,
    item:     item ? normaliseSlug(item) : null,
    ability,
    level,
    teraType,
    nature,
    evSpread,
    ivSpread,
    moves: moves.slice(0, 4) as [string, string, string, string],
  };
}

// ─── TeamMember builder from ParsedMember ────────────────────────────────────

/**
 * Converts a ParsedMember into a draft TeamMember.
 * `speciesId` must be resolved by the caller from the slug.
 */
export function parsedMemberToTeamMember(
  parsed:    ParsedMember,
  speciesId: number,
  teamId:    string,
  slot:      1 | 2 | 3 | 4 | 5 | 6,
): TeamMember {
  return {
    id:             uuidv4(),
    teamId,
    slot,
    speciesId,
    formName:       parsed.formName,
    nickname:       parsed.nickname,
    level:          parsed.level,
    item:           parsed.item,
    ability:        parsed.ability,
    teraType:       parsed.teraType,
    nature:         parsed.nature,
    evSpread:       parsed.evSpread,
    ivSpread:       parsed.ivSpread,
    moves:          parsed.moves,
    roles:          [],
    roleOverridden: false,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Converts a display name to a normalised slug.
 * "Flutter Mane" → "flutter-mane", "Calyrex-Shadow" → "calyrex-shadow"
 */
function normaliseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Extracts a form suffix from a slug like "calyrex-shadow" or "rotom-wash".
 * Returns null for base-form slugs.
 */
function extractFormName(slug: string): string | null {
  // Known form patterns that are part of the base species name — not treated as forms
  const baseFormSlugs = new Set([
    'great-tusk', 'iron-bundle', 'iron-hands', 'iron-valiant',
    'flutter-mane', 'sandy-shocks', 'roaring-moon', 'walking-wake',
  ]);
  if (baseFormSlugs.has(slug)) return null;

  // "calyrex-shadow" → "shadow", "rotom-wash" → "wash"
  const dashIdx = slug.indexOf('-');
  if (dashIdx >= 0 && slug.length > dashIdx + 1) {
    const suffix = slug.slice(dashIdx + 1);
    // Only treat as a form if suffix is a known form keyword
    const formKeywords = ['mega', 'mega-x', 'mega-y', 'gmax', 'alola', 'galar',
                          'hisui', 'paldea', 'shadow', 'ice', 'wash', 'heat',
                          'frost', 'fan', 'mow', 'dusk', 'dawn', 'ultra'];
    if (formKeywords.some((k) => suffix.startsWith(k))) {
      return suffix;
    }
  }
  return null;
}

/** Formats an item slug into a display name: "rocky-helmet" → "Rocky Helmet" */
function formatItemName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Formats an ability slug into a display name: "hadron-engine" → "Hadron Engine" */
function formatAbility(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Formats a move slug into a display name: "thunderbolt" → "Thunderbolt" */
function formatMoveName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Formats a stat spread into a Showdown-style string.
 * Only includes stats that differ from `defaultVal`.
 * Returns empty string if all stats equal `defaultVal`.
 */
function formatSpread(spread: Record<string, number>, defaultVal: number): string {
  const parts: string[] = [];
  for (const key of STAT_KEYS) {
    const val = spread[key] ?? defaultVal;
    if (val !== defaultVal) {
      parts.push(`${val} ${STAT_ABBREVS[key]}`);
    }
  }
  return parts.join(' / ');
}

/**
 * Parses a Showdown stat spread string into a stat record.
 * Missing stats default to `defaultVal`.
 */
function parseSpread(
  str:        string,
  defaultVal: number,
): Record<StatKey, number> {
  const result: Record<StatKey, number> = {
    hp: defaultVal, atk: defaultVal, def: defaultVal,
    spa: defaultVal, spd: defaultVal, spe: defaultVal,
  };
  for (const part of str.split('/').map((s) => s.trim())) {
    const [valStr, abbrev] = part.split(/\s+/);
    const key = ABBREV_TO_KEY[abbrev];
    if (key !== undefined) {
      result[key] = parseInt(valStr, 10);
    }
  }
  return result;
}
