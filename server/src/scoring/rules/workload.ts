import type { CandidateContext, RequestContext, RuleResult, ScoringRule } from '../types.js';

/**
 * Creates a WorkloadRule that evaluates a candidate based on their current workload.
 *
 * Score formula: max(0, 100 - currentWorkload)
 *
 * Flags "high_workload" when candidate's workload exceeds the configured threshold.
 */
export function createWorkloadRule(weight: number, threshold: number): ScoringRule {
  return {
    name: 'workload',
    weight,
    evaluate(candidate: CandidateContext, _request: RequestContext): RuleResult {
      const score = Math.max(0, 100 - candidate.currentWorkload);

      const flag = candidate.currentWorkload > threshold ? 'high_workload' : undefined;

      const explanation =
        `Current workload is ${candidate.currentWorkload}%` +
        (flag ? ' (exceeds threshold — high workload flagged)' : '') +
        '.';

      return {
        score,
        explanation,
        flag,
      };
    },
  };
}
