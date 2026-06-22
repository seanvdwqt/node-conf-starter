import type { ScoringRule, RuleResult, CandidateContext, RequestContext } from '../types.js';
import { classifyAvailability } from '../../utils/availability.js';

/**
 * Urgency scoring rule.
 *
 * Combines the request's urgency level with the candidate's availability
 * classification to determine scoring priority:
 *   - High urgency: available=100, partially_available=40
 *   - Medium urgency: available=80, partially_available=60
 *   - Low urgency: all=70 (neutral, regardless of availability)
 *
 * Unavailable candidates should already be filtered by the availability gate,
 * but if they reach here they receive a score of 0.
 *
 * Validates: Requirements 5.7
 */
export function createUrgencyRule(weight: number): ScoringRule {
  return {
    name: 'urgency',
    weight,
    evaluate(candidate: CandidateContext, request: RequestContext): RuleResult {
      const availability = classifyAvailability(candidate.capacityFree);
      const { urgency } = request;

      if (availability === 'unavailable') {
        return {
          score: 0,
          explanation: `Candidate is unavailable; urgency level "${urgency}" does not apply`,
        };
      }

      if (urgency === 'high') {
        const score = availability === 'available' ? 100 : 40;
        return {
          score,
          explanation: `High urgency prioritises fully available candidates (availability: ${availability}, score: ${score})`,
        };
      }

      if (urgency === 'medium') {
        const score = availability === 'available' ? 80 : 60;
        return {
          score,
          explanation: `Medium urgency moderately favours available candidates (availability: ${availability}, score: ${score})`,
        };
      }

      // Low urgency — neutral score regardless of availability
      return {
        score: 70,
        explanation: `Low urgency applies neutral scoring regardless of availability (score: 70)`,
      };
    },
  };
}
