import prisma from '../lib/prisma.js';
import { scoreCandidates } from '../scoring/engine.js';
import { generateExplanation } from '../scoring/explanation.js';
import type {
  CandidateContext,
  CandidateSkillInfo,
  CandidateProjectInfo,
  RequestContext,
  RequestedSkill,
  ProficiencyLevel,
  UrgencyLevel,
} from '../scoring/types.js';
import { DEFAULT_SCORING_CONFIG } from '../scoring/config.js';
import { classifyAvailability } from '../utils/availability.js';

/**
 * A matched skill entry in the recommendation response.
 */
interface MatchedSkillResponse {
  name: string;
  proficiency: number;
  requiredProficiency: number;
}

/**
 * A candidate entry in the recommendation response.
 */
interface CandidateResponse {
  candidateId: string;
  name: string;
  matchScore: number;
  availability: string;
  workload: string;
  matchedSkills: MatchedSkillResponse[];
  yearsExperience: number;
  currentTeam: string;
  previousProjects: Array<{ name: string; role: string }>;
  explanation: string;
  scoreBreakdown: Array<{ rule: string; weight: number; contribution: number }>;
}

/**
 * A shortlist entry per role in the recommendation response.
 */
interface ShortlistResponse {
  roleId: string;
  roleName: string;
  candidates: CandidateResponse[];
  hasGap: boolean;
}

/**
 * The full recommendation response returned by generateRecommendations.
 */
export interface RecommendationResult {
  shortlists: ShortlistResponse[];
}


/**
 * Maps a Prisma Candidate record (with relations) to a CandidateContext
 * used by the scoring engine.
 */
function mapToCandidateContext(
  candidate: {
    id: string;
    name: string;
    currentRole: string;
    businessUnit: string;
    capacityFree: number;
    currentWorkload: number;
    yearsExperience: number;
    currentTeam: string;
    skills: Array<{
      proficiency: number;
      skill: { id: string; name: string };
    }>;
    projects: Array<{
      projectName: string;
      rolePlayed: string;
    }>;
  },
): CandidateContext {
  const skills: CandidateSkillInfo[] = candidate.skills.map((cs) => ({
    skillId: cs.skill.id,
    name: cs.skill.name,
    proficiency: cs.proficiency as ProficiencyLevel,
  }));

  const projects: CandidateProjectInfo[] = candidate.projects.map((cp) => ({
    projectName: cp.projectName,
    rolePlayed: cp.rolePlayed,
  }));

  return {
    id: candidate.id,
    name: candidate.name,
    currentRole: candidate.currentRole,
    businessUnit: candidate.businessUnit,
    skills,
    capacityFree: candidate.capacityFree,
    currentWorkload: candidate.currentWorkload,
    yearsExperience: candidate.yearsExperience,
    currentTeam: candidate.currentTeam,
    projects,
  };
}

/**
 * Builds a RequestContext from a RequestRole's skills for use by the scoring engine.
 */
function buildRequestContext(
  requestSkills: Array<{
    priority: string;
    requiredProficiency: number;
    skill: { id: string; name: string };
    isCustom: boolean;
    customName: string | null;
  }>,
  urgency: string,
  businessUnit: string,
): RequestContext {
  const mandatorySkills: RequestedSkill[] = [];
  const preferredSkills: RequestedSkill[] = [];

  for (const rs of requestSkills) {
    const skill: RequestedSkill = {
      skillId: rs.skill.id,
      name: rs.isCustom && rs.customName ? rs.customName : rs.skill.name,
      requiredProficiency: rs.requiredProficiency as ProficiencyLevel,
    };

    if (rs.priority === 'mandatory') {
      mandatorySkills.push(skill);
    } else {
      preferredSkills.push(skill);
    }
  }

  return {
    urgency: urgency as UrgencyLevel,
    mandatorySkills,
    preferredSkills,
    businessUnit,
  };
}

/**
 * Determines the matched skills between a candidate and a request's skills,
 * returning them in the API response format.
 */
function getMatchedSkills(
  candidateContext: CandidateContext,
  requestSkills: Array<{
    requiredProficiency: number;
    skill: { id: string; name: string };
    isCustom: boolean;
    customName: string | null;
  }>,
): MatchedSkillResponse[] {
  const matched: MatchedSkillResponse[] = [];

  for (const rs of requestSkills) {
    const candidateSkill = candidateContext.skills.find(
      (cs) => cs.skillId === rs.skill.id,
    );
    if (candidateSkill) {
      matched.push({
        name: candidateSkill.name,
        proficiency: candidateSkill.proficiency,
        requiredProficiency: rs.requiredProficiency,
      });
    }
  }

  return matched;
}

/**
 * Generates scored recommendations for a squad request.
 *
 * This service:
 * 1. Fetches the squad request with its roles and skills
 * 2. Fetches all candidates in the same business unit (with skills and projects)
 * 3. Maps Prisma records to CandidateContext objects
 * 4. For each requested role, runs the scoring engine and generates explanations
 * 5. Detects gaps (roles with zero matching candidates after scoring)
 * 6. Returns shortlists per role in the API response format
 *
 * @param squadRequestId - The ID of the squad request to generate recommendations for
 * @returns The recommendation result with shortlists per role
 * @throws Error if the squad request is not found
 */
export async function generateRecommendations(
  squadRequestId: string,
): Promise<RecommendationResult> {
  // 1. Fetch the squad request with its roles and skills
  const squadRequest = await prisma.squadRequest.findUnique({
    where: { id: squadRequestId },
    include: {
      roles: {
        include: {
          role: true,
          skills: {
            include: {
              skill: true,
            },
          },
        },
      },
    },
  });

  if (!squadRequest) {
    throw new Error(`Squad request not found: ${squadRequestId}`);
  }

  // 2. Fetch all candidates in the same business unit
  const candidates = await prisma.candidate.findMany({
    where: { businessUnit: squadRequest.businessUnit },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      projects: true,
    },
  });

  // 3. Map DB records to CandidateContext objects
  const candidateContexts: CandidateContext[] = candidates.map(mapToCandidateContext);

  // 4. For each requested role, score candidates and build shortlists
  const shortlists: ShortlistResponse[] = [];

  for (const requestRole of squadRequest.roles) {
    // Build the request context from this role's skills
    const requestContext = buildRequestContext(
      requestRole.skills,
      squadRequest.urgency,
      squadRequest.businessUnit,
    );

    // Run scoring engine
    const scoredCandidates = scoreCandidates(
      candidateContexts,
      requestContext,
      DEFAULT_SCORING_CONFIG,
    );

    // Map scored candidates to the API response format
    const candidateResponses: CandidateResponse[] = scoredCandidates.map((sc) => {
      const explanation = generateExplanation(sc);
      const availability = classifyAvailability(sc.candidate.capacityFree);
      const workload = sc.candidate.currentWorkload > DEFAULT_SCORING_CONFIG.thresholds.workloadHigh
        ? 'high'
        : 'normal';
      const matchedSkills = getMatchedSkills(sc.candidate, requestRole.skills);

      return {
        candidateId: sc.candidate.id,
        name: sc.candidate.name,
        matchScore: sc.totalScore,
        availability,
        workload,
        matchedSkills,
        yearsExperience: sc.candidate.yearsExperience,
        currentTeam: sc.candidate.currentTeam,
        previousProjects: sc.candidate.projects.map((p) => ({
          name: p.projectName,
          role: p.rolePlayed,
        })),
        explanation,
        scoreBreakdown: sc.breakdown,
      };
    });

    // 5. Detect gap: role with zero matching candidates
    const hasGap = candidateResponses.length === 0;

    shortlists.push({
      roleId: requestRole.id,
      roleName: requestRole.role.name,
      candidates: candidateResponses,
      hasGap,
    });
  }

  return { shortlists };
}
