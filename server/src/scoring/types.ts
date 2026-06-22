/**
 * Scoring engine types for candidate evaluation.
 *
 * The scoring engine evaluates candidates against squad request criteria
 * using configurable, independent rules.
 */

/** Proficiency levels: 1 = foundational, 2 = proficient, 3 = expert */
export type ProficiencyLevel = 1 | 2 | 3;

/** Urgency levels for a squad request */
export type UrgencyLevel = 'low' | 'medium' | 'high';

/** Availability classification */
export type AvailabilityIndicator = 'available' | 'partially_available' | 'unavailable';

/** A skill associated with a candidate, including proficiency depth */
export interface CandidateSkillInfo {
  skillId: string;
  name: string;
  proficiency: ProficiencyLevel;
}

/** A previous project a candidate has worked on */
export interface CandidateProjectInfo {
  projectName: string;
  rolePlayed: string;
}

/** Context representing a candidate during scoring evaluation */
export interface CandidateContext {
  id: string;
  name: string;
  currentRole: string;
  businessUnit: string;
  skills: CandidateSkillInfo[];
  capacityFree: number; // 0–100 percentage
  currentWorkload: number; // 0–100 percentage
  yearsExperience: number;
  currentTeam: string;
  projects: CandidateProjectInfo[];
}

/** A skill required by the squad request, with required proficiency */
export interface RequestedSkill {
  skillId: string;
  name: string;
  requiredProficiency: ProficiencyLevel;
}

/** Context representing a squad request during scoring evaluation */
export interface RequestContext {
  urgency: UrgencyLevel;
  mandatorySkills: RequestedSkill[];
  preferredSkills: RequestedSkill[];
  businessUnit: string;
}

/** Result from a single scoring rule evaluation */
export interface RuleResult {
  score: number; // 0–100 raw score for this rule
  explanation: string; // human-readable reason
  exclude?: boolean; // if true, candidate is filtered out
  flag?: string; // e.g. "high_workload"
}

/** A scoring rule that evaluates a candidate against request criteria */
export interface ScoringRule {
  name: string;
  weight: number; // from config, 0.0–1.0
  evaluate(candidate: CandidateContext, request: RequestContext): RuleResult;
}

/** Scoring engine configuration: weights and thresholds */
export interface ScoringConfig {
  weights: {
    skillMatch: number; // default 0.30
    proficiency: number; // default 0.15
    experience: number; // default 0.10
    availability: number; // default 0.20
    workload: number; // default 0.10
    urgency: number; // default 0.15
  };
  thresholds: {
    workloadHigh: number; // default 80 (%)
    minMandatorySkills: number; // default 1
  };
}
