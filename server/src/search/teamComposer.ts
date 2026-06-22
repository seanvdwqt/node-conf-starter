/**
 * Team Composer for Instant Squad Search.
 *
 * Given parsed query criteria and a list of candidates, invokes the scoring
 * engine per extracted role and composes up to 5 candidate team combinations.
 *
 * Requirements: 11.4, 11.5
 */

import type { CandidateContext, UrgencyLevel, RequestedSkill, ProficiencyLevel, ScoringConfig } from '../scoring/types.js';
import { scoreCandidates } from '../scoring/engine.js';
import { DEFAULT_SCORING_CONFIG } from '../scoring/config.js';
import { classifyAvailability } from '../utils/availability.js';
import type { ParsedQuery } from './queryParser.js';

/** A team member in a squad suggestion */
export interface TeamMember {
  candidateId: string;
  name: string;
  role: string;
  matchScore: number;
  matchedSkills: { name: string; proficiency: number }[];
  availability: string;
  yearsExperience: number;
  currentTeam: string;
}

/** A complete team suggestion */
export interface TeamSuggestion {
  teamScore: number;
  explanation: string;
  members: TeamMember[];
}

/**
 * Composes up to 5 team suggestions from the given candidates based on parsed criteria.
 *
 * Pipeline:
 * 1. For each parsed role, build a RequestContext with the extracted skills as mandatory
 * 2. Score all candidates against that role using the scoring engine
 * 3. Pick the top candidates per role to form team compositions
 * 4. Calculate combined team score (average of individual scores)
 * 5. Generate one-line explanation per team composition
 *
 * For multiple suggestions (up to 5), the composer shifts to the 2nd, 3rd best
 * candidate for the first role to generate variety across team compositions.
 *
 * @param candidates - All available candidates in the talent pool
 * @param parsed - The structured query parsed from user input
 * @param config - Optional scoring configuration overrides
 * @returns Up to 5 team suggestions, ranked by combined team score
 */
export function composeTeams(
  candidates: CandidateContext[],
  parsed: ParsedQuery,
  config?: ScoringConfig,
): TeamSuggestion[] {
  const cfg = config ?? DEFAULT_SCORING_CONFIG;

  if (candidates.length === 0 || (parsed.roles.length === 0 && parsed.skills.length === 0)) {
    return [];
  }

  // If we have skills but no roles, search across all candidates for skill matches
  if (parsed.roles.length === 0 && parsed.skills.length > 0) {
    return composeSkillBasedTeams(candidates, parsed, cfg);
  }

  // Build scored shortlists per role
  const roleShortlists = new Map<string, ReturnType<typeof scoreCandidates>>();

  for (const parsedRole of parsed.roles) {
    const requestContext = buildRequestContext(parsed);
    const scored = scoreCandidates(candidates, requestContext, cfg);
    roleShortlists.set(parsedRole.name, scored);
  }

  // Generate up to 5 team compositions by varying which candidate fills the first role
  const suggestions: TeamSuggestion[] = [];
  const maxSuggestions = 5;

  // Determine the first role — we vary its candidate across suggestions
  const firstRoleName = parsed.roles[0].name;
  const firstRoleCandidates = roleShortlists.get(firstRoleName) ?? [];
  const possibleVariations = Math.min(maxSuggestions, firstRoleCandidates.length);

  for (let variant = 0; variant < possibleVariations; variant++) {
    const usedCandidateIds = new Set<string>();
    const members: TeamMember[] = [];

    for (let roleIndex = 0; roleIndex < parsed.roles.length; roleIndex++) {
      const parsedRole = parsed.roles[roleIndex];
      const shortlist = roleShortlists.get(parsedRole.name) ?? [];

      if (shortlist.length === 0) continue;

      // For this role, pick `quantity` candidates not already used
      const quantity = parsedRole.quantity;
      let picked = 0;

      // For the first role, offset by `variant` to pick the nth best candidate
      const startOffset = roleIndex === 0 ? variant : 0;
      let skipped = 0;

      for (const sc of shortlist) {
        if (picked >= quantity) break;
        if (usedCandidateIds.has(sc.candidate.id)) continue;

        // Skip candidates until we reach the desired offset for the first role
        if (roleIndex === 0 && skipped < startOffset) {
          skipped++;
          continue;
        }

        usedCandidateIds.add(sc.candidate.id);
        const availability = classifyAvailability(sc.candidate.capacityFree);

        const matchedSkills = sc.candidate.skills
          .filter((s) =>
            parsed.skills.some(
              (ps) => ps.toLowerCase() === s.name.toLowerCase(),
            ),
          )
          .map((s) => ({ name: s.name, proficiency: s.proficiency }));

        members.push({
          candidateId: sc.candidate.id,
          name: sc.candidate.name,
          role: parsedRole.name,
          matchScore: Math.round(sc.totalScore * 100) / 100,
          matchedSkills,
          availability,
          yearsExperience: sc.candidate.yearsExperience,
          currentTeam: sc.candidate.currentTeam,
        });

        picked++;
      }
    }

    if (members.length === 0) continue;

    // Skip duplicate teams (same member set as a previous suggestion)
    const memberIdSet = members.map((m) => m.candidateId).sort().join(',');
    const isDuplicate = suggestions.some(
      (s) => s.members.map((m) => m.candidateId).sort().join(',') === memberIdSet,
    );
    if (isDuplicate) continue;

    // Team score = average of all member match scores
    const teamScore =
      Math.round(
        (members.reduce((sum, m) => sum + m.matchScore, 0) / members.length) * 100,
      ) / 100;

    const explanation = generateTeamExplanation(members, teamScore);

    suggestions.push({ teamScore, explanation, members });
  }

  // Sort by teamScore descending
  suggestions.sort((a, b) => b.teamScore - a.teamScore);

  return suggestions.slice(0, 5);
}

/**
 * When no specific roles are parsed but skills are present,
 * find the best candidates matching those skills.
 */
function composeSkillBasedTeams(
  candidates: CandidateContext[],
  parsed: ParsedQuery,
  config: ScoringConfig,
): TeamSuggestion[] {
  const requestContext = buildRequestContext(parsed);
  const scored = scoreCandidates(candidates, requestContext, config);

  if (scored.length === 0) return [];

  // Build a single team from the top 3–5 candidates
  const teamSize = Math.min(5, scored.length);
  const members: TeamMember[] = scored.slice(0, teamSize).map((sc) => {
    const availability = classifyAvailability(sc.candidate.capacityFree);
    const matchedSkills = sc.candidate.skills
      .filter((s) =>
        parsed.skills.some((ps) => ps.toLowerCase() === s.name.toLowerCase()),
      )
      .map((s) => ({ name: s.name, proficiency: s.proficiency }));

    return {
      candidateId: sc.candidate.id,
      name: sc.candidate.name,
      role: sc.candidate.currentRole,
      matchScore: Math.round(sc.totalScore * 100) / 100,
      matchedSkills,
      availability,
      yearsExperience: sc.candidate.yearsExperience,
      currentTeam: sc.candidate.currentTeam,
    };
  });

  const teamScore =
    Math.round(
      (members.reduce((sum, m) => sum + m.matchScore, 0) / members.length) * 100,
    ) / 100;

  return [
    {
      teamScore,
      explanation: `Team composed of top candidates matching ${parsed.skills.join(', ')} skills, averaging ${Math.round(teamScore)}% match.`,
      members,
    },
  ];
}

/**
 * Builds a RequestContext from the parsed query for scoring.
 * Treats all extracted skills as mandatory skills with proficiency level 1.
 */
function buildRequestContext(parsed: ParsedQuery) {
  const mandatorySkills: RequestedSkill[] = parsed.skills.map((skill) => ({
    skillId: skill.toLowerCase().replace(/\s+/g, '-'),
    name: skill,
    requiredProficiency: 1 as ProficiencyLevel,
  }));

  return {
    urgency: (parsed.urgency ?? 'medium') as UrgencyLevel,
    mandatorySkills,
    preferredSkills: [] as RequestedSkill[],
    businessUnit: 'Digital Platforms',
  };
}

/**
 * Generates a one-line human-readable explanation for a team composition.
 * Format: "Team with [role1], [role2], and [role3] averaging [score]% match"
 */
function generateTeamExplanation(members: TeamMember[], teamScore: number): string {
  const roleNames = [...new Set(members.map((m) => m.role))];
  const avgScore = Math.round(teamScore);

  if (roleNames.length === 0) {
    return `Team averaging ${avgScore}% match`;
  }

  if (roleNames.length === 1) {
    return `Team with ${roleNames[0]} averaging ${avgScore}% match`;
  }

  if (roleNames.length === 2) {
    return `Team with ${roleNames[0]} and ${roleNames[1]} averaging ${avgScore}% match`;
  }

  const allButLast = roleNames.slice(0, -1).join(', ');
  const last = roleNames[roleNames.length - 1];
  return `Team with ${allButLast}, and ${last} averaging ${avgScore}% match`;
}
