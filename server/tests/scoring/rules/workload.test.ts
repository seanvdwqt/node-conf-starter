import { describe, it, expect } from 'vitest';
import { createWorkloadRule } from '../../../src/scoring/rules/workload.js';
import type { CandidateContext, RequestContext } from '../../../src/scoring/types.js';

function makeCandidate(overrides: Partial<CandidateContext> = {}): CandidateContext {
  return {
    id: 'c1',
    name: 'Test Candidate',
    currentRole: 'Engineer',
    businessUnit: 'Digital Platforms',
    skills: [],
    capacityFree: 80,
    currentWorkload: 30,
    yearsExperience: 5,
    currentTeam: 'Team A',
    projects: [],
    ...overrides,
  };
}

const request: RequestContext = {
  urgency: 'medium',
  mandatorySkills: [],
  preferredSkills: [],
  businessUnit: 'Digital Platforms',
};

describe('WorkloadRule', () => {
  const threshold = 80;
  const rule = createWorkloadRule(0.10, threshold);

  it('has the correct name and weight', () => {
    expect(rule.name).toBe('workload');
    expect(rule.weight).toBe(0.10);
  });

  describe('score calculation', () => {
    it('returns 100 - currentWorkload for low workload', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 20 }), request);
      expect(result.score).toBe(80);
    });

    it('returns 0 when workload is 100', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 100 }), request);
      expect(result.score).toBe(0);
    });

    it('returns 100 when workload is 0', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 0 }), request);
      expect(result.score).toBe(100);
    });

    it('never returns a negative score', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 150 }), request);
      expect(result.score).toBe(0);
    });

    it('returns 50 when workload is 50', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 50 }), request);
      expect(result.score).toBe(50);
    });
  });

  describe('high_workload flag', () => {
    it('sets flag when workload exceeds threshold', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 85 }), request);
      expect(result.flag).toBe('high_workload');
    });

    it('does not set flag when workload equals threshold', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 80 }), request);
      expect(result.flag).toBeUndefined();
    });

    it('does not set flag when workload is below threshold', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 60 }), request);
      expect(result.flag).toBeUndefined();
    });
  });

  describe('explanation', () => {
    it('mentions workload percentage', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 45 }), request);
      expect(result.explanation).toContain('45%');
    });

    it('mentions high workload flagged when above threshold', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 90 }), request);
      expect(result.explanation).toContain('high workload flagged');
    });

    it('does not mention flag when below threshold', () => {
      const result = rule.evaluate(makeCandidate({ currentWorkload: 30 }), request);
      expect(result.explanation).not.toContain('high workload flagged');
    });
  });

  describe('custom threshold', () => {
    it('uses provided threshold for flagging', () => {
      const strictRule = createWorkloadRule(0.10, 50);
      const result = strictRule.evaluate(makeCandidate({ currentWorkload: 55 }), request);
      expect(result.flag).toBe('high_workload');
    });

    it('does not flag when below custom threshold', () => {
      const strictRule = createWorkloadRule(0.10, 50);
      const result = strictRule.evaluate(makeCandidate({ currentWorkload: 45 }), request);
      expect(result.flag).toBeUndefined();
    });
  });
});
