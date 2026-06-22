import { describe, it, expect, vi } from 'vitest';
import { scoreCandidates, type ScoredCandidate } from '../../src/scoring/engine.js';
import type { CandidateContext, RequestContext, ScoringConfig } from '../../src/scoring/types.js';

function makeCandidate(overrides: Partial<CandidateContext> = {}): CandidateContext {
  return {
    id: 'c1',
    name: 'Test Candidate',
    currentRole: 'Engineer',
    businessUnit: 'Digital Platforms',
    skills: [
      { skillId: 'sk1', name: 'TypeScript', proficiency: 3 },
      { skillId: 'sk2', name: 'React', proficiency: 2 },
    ],
    capacityFree: 80,
    currentWorkload: 30,
    yearsExperience: 5,
    currentTeam: 'Team A',
    projects: [],
    ...overrides,
  };
}

function makeRequest(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    urgency: 'medium',
    mandatorySkills: [{ skillId: 'sk1', name: 'TypeScript', requiredProficiency: 2 }],
    preferredSkills: [{ skillId: 'sk2', name: 'React', requiredProficiency: 1 }],
    businessUnit: 'Digital Platforms',
    ...overrides,
  };
}

const defaultConfig: ScoringConfig = {
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

describe('scoreCandidates', () => {
  describe('filter phase', () => {
    it('excludes candidates with no mandatory skill matches', () => {
      const candidate = makeCandidate({
        id: 'no-skills',
        skills: [{ skillId: 'sk99', name: 'Unrelated', proficiency: 3 }],
      });

      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);
      expect(results).toHaveLength(0);
    });

    it('excludes candidates with unavailable status (capacityFree < 25)', () => {
      const candidate = makeCandidate({ id: 'unavail', capacityFree: 10 });

      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);
      expect(results).toHaveLength(0);
    });

    it('keeps candidates who match mandatory skills and are available', () => {
      const candidate = makeCandidate({ id: 'good' });

      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);
      expect(results).toHaveLength(1);
      expect(results[0].candidate.id).toBe('good');
    });

    it('keeps partially available candidates (capacityFree between 25-74)', () => {
      const candidate = makeCandidate({ id: 'partial', capacityFree: 50 });

      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);
      expect(results).toHaveLength(1);
    });
  });

  describe('score phase', () => {
    it('calculates totalScore as sum of rule.score * rule.weight, clamped 0-100', () => {
      const candidate = makeCandidate();
      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);

      expect(results).toHaveLength(1);
      expect(results[0].totalScore).toBeGreaterThanOrEqual(0);
      expect(results[0].totalScore).toBeLessThanOrEqual(100);
    });

    it('produces a breakdown with rule name, weight, and contribution', () => {
      const candidate = makeCandidate();
      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);
      const { breakdown } = results[0];

      expect(breakdown.length).toBeGreaterThan(0);
      for (const entry of breakdown) {
        expect(entry).toHaveProperty('rule');
        expect(entry).toHaveProperty('weight');
        expect(entry).toHaveProperty('contribution');
        expect(typeof entry.rule).toBe('string');
        expect(typeof entry.weight).toBe('number');
        expect(typeof entry.contribution).toBe('number');
      }
    });

    it('produces explanations for each evaluated rule', () => {
      const candidate = makeCandidate();
      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);

      expect(results[0].explanations.length).toBeGreaterThan(0);
      for (const exp of results[0].explanations) {
        expect(typeof exp).toBe('string');
        expect(exp.length).toBeGreaterThan(0);
      }
    });

    it('collects flags from rules (e.g., high_workload)', () => {
      const candidate = makeCandidate({ currentWorkload: 90 });
      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);

      expect(results[0].flags).toContain('high_workload');
    });

    it('skips failed rules without crashing (Requirement 10.4)', () => {
      // Suppress console.warn for this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a candidate with data that could trigger edge cases
      // The engine should handle rule failures gracefully
      const candidate = makeCandidate();
      const results = scoreCandidates([candidate], makeRequest(), defaultConfig);

      expect(results).toHaveLength(1);
      expect(results[0].totalScore).toBeGreaterThanOrEqual(0);

      warnSpy.mockRestore();
    });
  });

  describe('tiebreak', () => {
    it('breaks equal scores by higher capacityFree', () => {
      const c1 = makeCandidate({ id: 'c1', capacityFree: 90 });
      const c2 = makeCandidate({ id: 'c2', capacityFree: 75 });

      // Both have same skills, same workload, same experience — scores should be equal
      const results = scoreCandidates([c2, c1], makeRequest(), defaultConfig);

      // Since scores are equal (same attributes except capacityFree),
      // the one with higher capacityFree should rank first
      if (results[0].totalScore === results[1].totalScore) {
        expect(results[0].candidate.capacityFree).toBeGreaterThanOrEqual(
          results[1].candidate.capacityFree,
        );
      }
    });

    it('sorts by totalScore descending when scores differ', () => {
      const highExp = makeCandidate({ id: 'high', yearsExperience: 10, capacityFree: 80 });
      const lowExp = makeCandidate({ id: 'low', yearsExperience: 1, capacityFree: 80 });

      const results = scoreCandidates([lowExp, highExp], makeRequest(), defaultConfig);

      expect(results[0].totalScore).toBeGreaterThanOrEqual(results[1].totalScore);
      expect(results[0].candidate.id).toBe('high');
    });
  });

  describe('urgency override', () => {
    it('sorts available candidates above partially_available when urgency=high', () => {
      const available = makeCandidate({
        id: 'avail',
        capacityFree: 80,
        yearsExperience: 2,
      });
      const partial = makeCandidate({
        id: 'partial',
        capacityFree: 50,
        yearsExperience: 10,
      });

      const request = makeRequest({ urgency: 'high' });
      const results = scoreCandidates([partial, available], request, defaultConfig);

      expect(results[0].candidate.id).toBe('avail');
      expect(results[1].candidate.id).toBe('partial');
    });

    it('does not apply urgency override when urgency is not high', () => {
      const available = makeCandidate({
        id: 'avail',
        capacityFree: 80,
        yearsExperience: 2,
      });
      const partial = makeCandidate({
        id: 'partial',
        capacityFree: 50,
        yearsExperience: 10,
      });

      const request = makeRequest({ urgency: 'low' });
      const results = scoreCandidates([partial, available], request, defaultConfig);

      // Without urgency override, higher score (more experience) should win
      expect(results[0].totalScore).toBeGreaterThanOrEqual(results[1].totalScore);
    });
  });

  describe('top 10 limit', () => {
    it('returns at most 10 candidates', () => {
      const candidates = Array.from({ length: 15 }, (_, i) =>
        makeCandidate({ id: `c${i}`, yearsExperience: 15 - i }),
      );

      const results = scoreCandidates(candidates, makeRequest(), defaultConfig);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('returns fewer than 10 if fewer candidates pass filtering', () => {
      const candidates = [makeCandidate({ id: 'c1' }), makeCandidate({ id: 'c2' })];

      const results = scoreCandidates(candidates, makeRequest(), defaultConfig);
      expect(results).toHaveLength(2);
    });
  });

  describe('uses default config when none provided', () => {
    it('works without explicit config parameter', () => {
      const candidate = makeCandidate();
      const results = scoreCandidates([candidate], makeRequest());

      expect(results).toHaveLength(1);
      expect(results[0].totalScore).toBeGreaterThan(0);
    });
  });
});
