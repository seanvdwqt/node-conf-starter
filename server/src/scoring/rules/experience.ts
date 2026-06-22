import type { CandidateContext, RequestContext, RuleResult, ScoringRule } from '../types.js';

/**
 * Creates an ExperienceRule that scores candidates based on years of experience.
 *
 * Score formula: min(100, yearsExperience × 10)
 * Caps at 100 for candidates with 10+ years of experience.
 */
export function createExperienceRule(weight: number): ScoringRule {
  return {
    name: 'experience',
    weight,
    evaluate(candidate: CandidateContext, _request: RequestContext): RuleResult {
      const score = Math.min(100, candidate.yearsExperience * 10);

      const explanation =
        `${candidate.yearsExperience} years of experience` +
        (candidate.yearsExperience >= 10 ? ' (maximum score).' : '.');

      return {
        score,
        explanation,
      };
    },
  };
}
