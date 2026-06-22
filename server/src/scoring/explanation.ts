import type { ScoredCandidate } from './engine.js';
import { classifyAvailability } from '../utils/availability.js';

/**
 * Proficiency level labels for human-readable output.
 */
const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'foundational',
  2: 'proficient',
  3: 'expert',
};

/**
 * Maps internal rule names to natural-language descriptions.
 */
const RULE_DESCRIPTIONS: Record<string, string> = {
  skillMatch: 'skill alignment',
  proficiency: 'proficiency depth',
  experience: 'experience depth',
  availability: 'current availability',
  workload: 'workload capacity',
  urgency: 'urgency fit',
};

/**
 * Maps availability classification to natural-language status.
 */
const AVAILABILITY_DESCRIPTIONS: Record<string, string> = {
  available: 'currently available',
  partially_available: 'partially available',
  unavailable: 'not currently available',
};

/**
 * Generates a human-readable explanation for a scored candidate.
 *
 * The output references matched skills by name with proficiency levels,
 * years of experience, availability status, and the scoring factors that
 * contributed to their ranking. No technical identifiers or jargon are used.
 *
 * Validates: Requirements 7.3, 7.4
 *
 * @param scoredCandidate - The scored candidate with breakdown, explanations, and flags
 * @returns A complete, human-readable explanation string
 */
export function generateExplanation(scoredCandidate: ScoredCandidate): string {
  const { candidate, breakdown, flags } = scoredCandidate;
  const parts: string[] = [];

  // --- Skills summary ---
  const skillsSummary = buildSkillsSummary(candidate);
  if (skillsSummary) {
    parts.push(skillsSummary);
  }

  // --- Experience ---
  parts.push(buildExperienceSummary(candidate.yearsExperience));

  // --- Availability ---
  const availabilityStatus = classifyAvailability(candidate.capacityFree);
  parts.push(buildAvailabilitySummary(availabilityStatus, candidate.capacityFree));

  // --- Workload flag ---
  if (flags.includes('high_workload')) {
    parts.push(
      'Note: this candidate currently carries a heavy workload which may affect their capacity to take on additional responsibilities.',
    );
  }

  // --- Scoring factors applied ---
  const factorsSummary = buildFactorsSummary(breakdown);
  if (factorsSummary) {
    parts.push(factorsSummary);
  }

  return parts.join(' ');
}

/**
 * Builds the skills portion of the explanation, listing matched skills with
 * their proficiency levels.
 */
function buildSkillsSummary(
  candidate: ScoredCandidate['candidate'],
): string {
  const skills = candidate.skills;

  if (skills.length === 0) {
    return 'This candidate has no listed skills on record.';
  }

  const skillDescriptions = skills.map((s) => {
    const level = PROFICIENCY_LABELS[s.proficiency] ?? `level ${s.proficiency}`;
    return `${s.name} at ${level} level`;
  });

  if (skillDescriptions.length === 1) {
    return `This candidate brings ${skillDescriptions[0]}.`;
  }

  const lastSkill = skillDescriptions.pop()!;
  return `This candidate brings ${skillDescriptions.join(', ')} and ${lastSkill}.`;
}

/**
 * Builds the experience portion of the explanation.
 */
function buildExperienceSummary(yearsExperience: number): string {
  if (yearsExperience >= 10) {
    return `With ${yearsExperience} years of experience, they bring significant depth to the role.`;
  }

  if (yearsExperience >= 5) {
    return `With ${yearsExperience} years of experience, they bring solid depth to the role.`;
  }

  if (yearsExperience >= 2) {
    return `With ${yearsExperience} years of experience, they have a developing foundation in the role.`;
  }

  return `With ${yearsExperience} year${yearsExperience === 1 ? '' : 's'} of experience, they are early in their career.`;
}

/**
 * Builds the availability portion of the explanation.
 */
function buildAvailabilitySummary(
  status: string,
  capacityFree: number,
): string {
  const description = AVAILABILITY_DESCRIPTIONS[status] ?? 'status unknown';
  return `They are ${description} with ${capacityFree}% capacity free.`;
}

/**
 * Builds the scoring factors summary, listing which evaluation areas
 * contributed to the candidate's ranking in natural language.
 */
function buildFactorsSummary(
  breakdown: ScoredCandidate['breakdown'],
): string {
  if (breakdown.length === 0) {
    return '';
  }

  // Sort by contribution descending to highlight the strongest factors
  const sorted = [...breakdown].sort((a, b) => b.contribution - a.contribution);

  // Take the top contributing factors (those with positive contribution)
  const positiveFactors = sorted.filter((entry) => entry.contribution > 0);

  if (positiveFactors.length === 0) {
    return '';
  }

  const factorNames = positiveFactors.map(
    (entry) => RULE_DESCRIPTIONS[entry.rule] ?? entry.rule,
  );

  if (factorNames.length === 1) {
    return `Their ranking is primarily driven by ${factorNames[0]}.`;
  }

  const lastFactor = factorNames.pop()!;
  return `Their ranking reflects ${factorNames.join(', ')} and ${lastFactor}.`;
}
