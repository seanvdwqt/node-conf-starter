import type { ScoringConfig } from './types.js';

/**
 * Default scoring configuration.
 *
 * Weights sum to 1.0 and control relative importance of each scoring factor.
 * Thresholds define boundaries for workload flagging and mandatory skill gates.
 *
 * These values can be overridden by passing a custom ScoringConfig to the
 * scoring engine without requiring any code changes to the rules themselves.
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    skillMatch: 0.30,
    proficiency: 0.15,
    experience: 0.10,
    availability: 0.20,
    workload: 0.10,
    urgency: 0.15,
  },
  thresholds: {
    workloadHigh: 80,
    minMandatorySkills: 1,
  },
};
