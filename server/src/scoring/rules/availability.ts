import type { ScoringRule, RuleResult, CandidateContext, RequestContext } from '../types.js';
import { classifyAvailability } from '../../utils/availability.js';

/**
 * Availability scoring rule.
 *
 * Classifies a candidate's capacity free percentage and assigns a score:
 *   - available (≥75% free) → score 100
 *   - partially_available (25–74% free) → score 50
 *   - unavailable (<25% free or null/undefined) → exclude from shortlist
 *
 * Validates: Requirements 4.1, 4.3, 5.4, 5.5
 */
export function createAvailabilityRule(weight: number): ScoringRule {
  return {
    name: 'availability',
    weight,
    evaluate(candidate: CandidateContext, _request: RequestContext): RuleResult {
      const status = classifyAvailability(candidate.capacityFree);

      if (status === 'available') {
        return {
          score: 100,
          explanation: `Candidate is available (${candidate.capacityFree}% capacity free)`,
        };
      }

      if (status === 'partially_available') {
        return {
          score: 50,
          explanation: `Candidate is partially available (${candidate.capacityFree}% capacity free)`,
        };
      }

      // unavailable — exclude candidate
      return {
        score: 0,
        explanation: `Candidate is unavailable (${candidate.capacityFree ?? 'unknown'}% capacity free)`,
        exclude: true,
      };
    },
  };
}
