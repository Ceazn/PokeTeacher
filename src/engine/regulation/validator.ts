import type { TeamMember } from '../../types/team';
import type {
  ValidationContext,
  ValidationResult,
  Violation,
  ViolationCode,
} from './types';

/**
 * Validates a team against the active regulation.
 *
 * Pure function — no side effects, no DB access, no React.
 * All inputs are passed explicitly via `context`.
 *
 * @param members  The team slots to validate (1–6 items).
 * @param context  Regulation + Champions roster.
 * @returns        A ValidationResult with isValid and a list of violations.
 */
export function validateTeam(
  members:  TeamMember[],
  context:  ValidationContext,
): ValidationResult {
  const { regulation, championsRoster } = context;
  const violations: Violation[] = [];

  // ── 1. Team size ────────────────────────────────────────────────────────────
  if (members.length < regulation.teamSize.min) {
    violations.push(makeViolation(
      'TEAM_TOO_SMALL',
      `Need at least ${regulation.teamSize.min} Pokémon for ${regulation.displayName} (have ${members.length}).`,
      null, null,
    ));
  }
  if (members.length > regulation.teamSize.max) {
    violations.push(makeViolation(
      'TEAM_TOO_LARGE',
      `${regulation.displayName} allows a maximum of ${regulation.teamSize.max} Pokémon (have ${members.length}).`,
      null, null,
    ));
  }

  // Validate each slot.
  const speciesCount: Record<string, number> = {};
  const restrictedInTeam: string[] = [];

  for (const member of members) {
    const slug = slugForMember(member);

    // ── 2. Species ban ────────────────────────────────────────────────────────
    if (regulation.speciesBanlist.includes(slug)) {
      violations.push(makeViolation(
        'SPECIES_BANNED',
        `${displaySlug(slug)} is banned in ${regulation.displayName}.`,
        member.slot, slug,
      ));
    }

    // ── 3. Species pool (roster / allowlist) ──────────────────────────────────
    if (!isSpeciesAllowed(slug, regulation, championsRoster)) {
      violations.push(makeViolation(
        'SPECIES_NOT_ALLOWED',
        `${displaySlug(slug)} is not available in ${regulation.displayName}.`,
        member.slot, slug,
      ));
    }

    // ── 4. Restricted legendary tracking ─────────────────────────────────────
    if (regulation.restrictedPool.includes(slug)) {
      restrictedInTeam.push(slug);
    }

    // ── 5. Species clause (no duplicates) ────────────────────────────────────
    if (regulation.clauseList.includes('species-clause')) {
      speciesCount[slug] = (speciesCount[slug] ?? 0) + 1;
    }

    // ── 6. Banned moves ───────────────────────────────────────────────────────
    for (const move of member.moves) {
      if (move && regulation.moveBanlist.includes(move)) {
        violations.push(makeViolation(
          'MOVE_BANNED',
          `${displaySlug(move)} is banned in ${regulation.displayName} (on ${displaySlug(slug)}).`,
          member.slot, move,
        ));
      }
    }

    // ── 7. Banned items ───────────────────────────────────────────────────────
    if (member.item && regulation.itemBanlist.includes(member.item)) {
      violations.push(makeViolation(
        'ITEM_BANNED',
        `${displaySlug(member.item)} is a banned item in ${regulation.displayName}.`,
        member.slot, member.item,
      ));
    }
  }

  // ── 8. Restricted legendary limit ──────────────────────────────────────────
  if (restrictedInTeam.length > regulation.restrictedLimit) {
    violations.push(makeViolation(
      'RESTRICTED_LIMIT_EXCEEDED',
      `${regulation.displayName} allows at most ${regulation.restrictedLimit} restricted ` +
      `Pokémon per team; you have ${restrictedInTeam.length} ` +
      `(${restrictedInTeam.map(displaySlug).join(', ')}).`,
      null, null,
    ));
  }

  // ── 9. Restricted duplicates (same legendary twice) ────────────────────────
  const restrictedSeen = new Set<string>();
  for (const slug of restrictedInTeam) {
    if (restrictedSeen.has(slug)) {
      violations.push(makeViolation(
        'RESTRICTED_DUPLICATE',
        `${displaySlug(slug)} appears more than once. Each restricted Pokémon may only be used once.`,
        null, slug,
      ));
    }
    restrictedSeen.add(slug);
  }

  // ── 10. Species clause violations ─────────────────────────────────────────
  for (const [slug, count] of Object.entries(speciesCount)) {
    if (count > 1) {
      violations.push(makeViolation(
        'SPECIES_CLAUSE',
        `${displaySlug(slug)} appears ${count} times. Species Clause is active.`,
        null, slug,
      ));
    }
  }

  return { isValid: violations.length === 0, violations };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSpeciesAllowed(
  slug:            string,
  regulation:      ValidationContext['regulation'],
  championsRoster: ReadonlySet<string>,
): boolean {
  const { speciesSource } = regulation;

  if (speciesSource === 'national-dex') return true;

  if (speciesSource === 'champions-roster') {
    return championsRoster.has(slug);
  }

  // Explicit allowlist (string[])
  return (speciesSource as string[]).includes(slug);
}

/** Returns the slug that identifies this member for regulation checks. */
function slugForMember(member: TeamMember): string {
  // We use the species slug stored in the team member.
  // The caller must ensure speciesId has been resolved to a slug before
  // calling validateTeam; we use a placeholder here since the engine
  // doesn't touch the DB. In practice the repository layer resolves slugs.
  //
  // For now, team members carry a speciesId (number). The validator works
  // with string slugs, so the repository layer must resolve before calling.
  // We accept a pre-resolved slug via the `_resolvedSlug` field if present,
  // or fall back to a numeric string (tests use string slugs directly via
  // the test helpers below).
  return (member as TeamMember & { _resolvedSlug?: string })._resolvedSlug
    ?? String(member.speciesId);
}

/** Capitalises a slug for display: "flutter-mane" → "Flutter Mane". */
function displaySlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function makeViolation(
  code:    ViolationCode,
  reason:  string,
  slot:    number | null,
  subject: string | null,
): Violation {
  return { code, reason, slot, subject };
}
