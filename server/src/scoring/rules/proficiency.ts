import type { ScoringRule, CandidateContext, RequestContext, RuleResult } from '../types.js';

/**
 * ProficiencyRule evaluates how well a candidate's skill proficiency levels
 * align with the required proficiency levels in the squad request.
 *
 * For each matched skill:
 * - If candidate proficiency >= required → full points (100)
 * - If below → proportional reduction (candidateLevel / requiredLevel × 100)
 *
 * Final score is the average across all matched skills.
 * Returns 0 if no skills match.
 */
export function createProficiencyRule(weight: number): ScoringRule {
  return {
    name: 'proficiency',
    weight,
    evaluate(candidate: CandidateContext, request: RequestContext): RuleResult {
      const requestedSkills = [...request.mandatorySkills, ...request.preferredSkills];

      const matchedScores: { skillName: string; candidateLevel: number; requiredLevel: number; score: number }[] = [];

      for (const reqSkill of requestedSkills) {
        const candidateSkill = candidate.skills.find(s => s.skillId === reqSkill.skillId);
        if (candidateSkill) {
          const score = candidateSkill.proficiency >= reqSkill.requiredProficiency
            ? 100
            : (candidateSkill.proficiency / reqSkill.requiredProficiency) * 100;

          matchedScores.push({
            skillName: reqSkill.name,
            candidateLevel: candidateSkill.proficiency,
            requiredLevel: reqSkill.requiredProficiency,
            score,
          });
        }
      }

      if (matchedScores.length === 0) {
        return {
          score: 0,
          explanation: 'No matched skills to evaluate proficiency against.',
        };
      }

      const finalScore = matchedScores.reduce((sum, m) => sum + m.score, 0) / matchedScores.length;

      const details = matchedScores.map(m => {
        if (m.candidateLevel >= m.requiredLevel) {
          return `${m.skillName}: meets or exceeds required level (${m.candidateLevel}/${m.requiredLevel})`;
        }
        return `${m.skillName}: below required level (${m.candidateLevel}/${m.requiredLevel})`;
      });

      const explanation = `Proficiency evaluation across ${matchedScores.length} skill(s): ${details.join('; ')}.`;

      return {
        score: Math.round(finalScore * 100) / 100,
        explanation,
      };
    },
  };
}
