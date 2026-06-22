import type { CandidateContext, RequestContext, RuleResult, ScoringRule } from '../types.js';

/**
 * Creates a SkillMatchRule that evaluates how well a candidate's skills
 * align with the mandatory and preferred skills of a squad request.
 *
 * Score formula:
 *   (mandatoryMatched × 2 + preferredMatched) / (totalMandatory × 2 + totalPreferred) × 100
 *
 * Excludes candidates who match zero mandatory skills.
 */
export function createSkillMatchRule(weight: number): ScoringRule {
  return {
    name: 'skillMatch',
    weight,
    evaluate(candidate: CandidateContext, request: RequestContext): RuleResult {
      const candidateSkillIds = new Set(candidate.skills.map((s) => s.skillId));

      const totalMandatory = request.mandatorySkills.length;
      const totalPreferred = request.preferredSkills.length;

      const matchedMandatory = request.mandatorySkills.filter((s) =>
        candidateSkillIds.has(s.skillId),
      );
      const matchedPreferred = request.preferredSkills.filter((s) =>
        candidateSkillIds.has(s.skillId),
      );

      const mandatoryMatched = matchedMandatory.length;
      const preferredMatched = matchedPreferred.length;

      // Exclude candidate if no mandatory skills matched
      if (mandatoryMatched === 0) {
        return {
          score: 0,
          explanation: 'No mandatory skills matched.',
          exclude: true,
        };
      }

      const denominator = totalMandatory * 2 + totalPreferred;
      const score = denominator > 0
        ? ((mandatoryMatched * 2 + preferredMatched) / denominator) * 100
        : 0;

      const allMatchedNames = [
        ...matchedMandatory.map((s) => s.name),
        ...matchedPreferred.map((s) => s.name),
      ];

      const explanation =
        `Matched ${mandatoryMatched}/${totalMandatory} mandatory and ` +
        `${preferredMatched}/${totalPreferred} preferred skills` +
        (allMatchedNames.length > 0 ? `: ${allMatchedNames.join(', ')}` : '') +
        '.';

      return {
        score,
        explanation,
      };
    },
  };
}
