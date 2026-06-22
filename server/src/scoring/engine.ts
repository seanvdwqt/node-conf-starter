import type { CandidateContext, RequestContext, ScoringConfig, ScoringRule } from './types.js';
import { DEFAULT_SCORING_CONFIG } from './config.js';
import { createSkillMatchRule } from './rules/skillMatch.js';
import { createProficiencyRule } from './rules/proficiency.js';
import { createExperienceRule } from './rules/experience.js';
import { createAvailabilityRule } from './rules/availability.js';
import { createWorkloadRule } from './rules/workload.js';
import { createUrgencyRule } from './rules/urgency.js';
import { classifyAvailability } from '../utils/availability.js';

/**
 * Represents a scored candidate with breakdown and explanations.
 *
 * Validates: Requirements 5.1, 5.7, 5.8, 7.1, 10.1, 10.3, 10.4
 */
export interface ScoredCandidate {
  candidate: CandidateContext;
  totalScore: number;
  breakdown: { rule: string; weight: number; contribution: number }[];
  explanations: string[];
  flags: string[];
}

/**
 * Scores and ranks candidates against a squad request using configurable rules.
 *
 * Pipeline:
 * 1. Filter phase — remove candidates failing mandatory skill gate or availability gate
 * 2. Score phase — evaluate all rules per candidate (try-catch per rule, skip failures)
 * 3. Aggregate — totalScore = Σ(rule.score × rule.weight), clamped 0–100
 * 4. Tiebreak — equal scores broken by higher capacityFree
 * 5. Urgency override — when urgency=high, sort available candidates above partially_available
 * 6. Return top 10 with breakdown and explanation
 */
export function scoreCandidates(
  candidates: CandidateContext[],
  request: RequestContext,
  config?: ScoringConfig,
): ScoredCandidate[] {
  const cfg = config ?? DEFAULT_SCORING_CONFIG;

  // Create gate rules (used for filtering)
  const skillMatchRule = createSkillMatchRule(cfg.weights.skillMatch);
  const availabilityRule = createAvailabilityRule(cfg.weights.availability);

  // Create all scoring rules
  const allRules: ScoringRule[] = [
    skillMatchRule,
    createProficiencyRule(cfg.weights.proficiency),
    createExperienceRule(cfg.weights.experience),
    availabilityRule,
    createWorkloadRule(cfg.weights.workload, cfg.thresholds.workloadHigh),
    createUrgencyRule(cfg.weights.urgency),
  ];

  // --- Filter phase ---
  const filtered = candidates.filter((candidate) => {
    try {
      const skillResult = skillMatchRule.evaluate(candidate, request);
      if (skillResult.exclude) return false;
    } catch {
      // If skill match rule fails, exclude candidate (safe default)
      return false;
    }

    try {
      const availResult = availabilityRule.evaluate(candidate, request);
      if (availResult.exclude) return false;
    } catch {
      // If availability rule fails, exclude candidate (safe default)
      return false;
    }

    return true;
  });

  // --- Score phase ---
  const scored: ScoredCandidate[] = filtered.map((candidate) => {
    const breakdown: { rule: string; weight: number; contribution: number }[] = [];
    const explanations: string[] = [];
    const flags: string[] = [];

    for (const rule of allRules) {
      try {
        const result = rule.evaluate(candidate, request);
        const contribution = result.score * rule.weight;

        breakdown.push({
          rule: rule.name,
          weight: rule.weight,
          contribution,
        });

        explanations.push(result.explanation);

        if (result.flag) {
          flags.push(result.flag);
        }
      } catch (error) {
        // Skip failed rules, log warning (Requirement 10.4)
        console.warn(
          `Scoring rule "${rule.name}" failed for candidate "${candidate.id}":`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    // --- Aggregate ---
    const rawScore = breakdown.reduce((sum, entry) => sum + entry.contribution, 0);
    const totalScore = Math.round(Math.min(100, Math.max(0, rawScore)) * 100) / 100;

    return {
      candidate,
      totalScore,
      breakdown,
      explanations,
      flags,
    };
  });

  // --- Tiebreak: sort by totalScore desc, then capacityFree desc ---
  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return b.candidate.capacityFree - a.candidate.capacityFree;
  });

  // --- Urgency override ---
  // When urgency=high, partition into available and partially_available groups,
  // sort available above partially_available regardless of score
  if (request.urgency === 'high') {
    const available: ScoredCandidate[] = [];
    const partiallyAvailable: ScoredCandidate[] = [];

    for (const sc of scored) {
      const status = classifyAvailability(sc.candidate.capacityFree);
      if (status === 'available') {
        available.push(sc);
      } else {
        partiallyAvailable.push(sc);
      }
    }

    // Each group is already sorted by score desc + capacityFree desc
    const reordered = [...available, ...partiallyAvailable];
    return reordered.slice(0, 10);
  }

  // Return top 10
  return scored.slice(0, 10);
}
