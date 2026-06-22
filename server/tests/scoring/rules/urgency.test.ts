import { describe, it, expect } from 'vitest';
import { createUrgencyRule } from '../../../src/scoring/rules/urgency.js';
import type { CandidateContext, RequestContext } from '../../../src/scoring/types.js';

function makeCandidate(overrides: Partial<CandidateContext> = {}): CandidateContext {
  return {
    id: 'candidate-1',
    name: 'Test Candidate',
    currentRole: 'engineer',
    businessUnit: 'Digital Platforms',
    skills: [],
    capacityFree: 80,
    currentWorkload: 20,
    yearsExperience: 5,
    currentTeam: 'Team Alpha',
    projects: [],
    ...overrides,
  };
}

function makeRequest(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    urgency: 'medium',
    mandatorySkills: [],
    preferredSkills: [],
    businessUnit: 'Digital Platforms',
    ...overrides,
  };
}

describe('UrgencyRule', () => {
  const rule = createUrgencyRule(0.15);

  it('should have name "urgency"', () => {
    expect(rule.name).toBe('urgency');
  });

  it('should use the provided weight', () => {
    expect(rule.weight).toBe(0.15);
  });

  describe('high urgency', () => {
    const request = makeRequest({ urgency: 'high' });

    it('should score 100 for available candidates', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 80 }), request);
      expect(result.score).toBe(100);
    });

    it('should score 40 for partially available candidates', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 50 }), request);
      expect(result.score).toBe(40);
    });

    it('should mention high urgency in explanation', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 80 }), request);
      expect(result.explanation.toLowerCase()).toContain('high urgency');
    });
  });

  describe('medium urgency', () => {
    const request = makeRequest({ urgency: 'medium' });

    it('should score 80 for available candidates', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 80 }), request);
      expect(result.score).toBe(80);
    });

    it('should score 60 for partially available candidates', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 50 }), request);
      expect(result.score).toBe(60);
    });

    it('should mention medium urgency in explanation', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 80 }), request);
      expect(result.explanation.toLowerCase()).toContain('medium urgency');
    });
  });

  describe('low urgency', () => {
    const request = makeRequest({ urgency: 'low' });

    it('should score 70 for available candidates', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 80 }), request);
      expect(result.score).toBe(70);
    });

    it('should score 70 for partially available candidates', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 50 }), request);
      expect(result.score).toBe(70);
    });

    it('should mention low urgency in explanation', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 80 }), request);
      expect(result.explanation.toLowerCase()).toContain('low urgency');
    });
  });

  describe('unavailable candidates', () => {
    it('should score 0 for unavailable candidates regardless of urgency', () => {
      const result = rule.evaluate(
        makeCandidate({ capacityFree: 10 }),
        makeRequest({ urgency: 'high' })
      );
      expect(result.score).toBe(0);
    });

    it('should score 0 when capacity is below 25%', () => {
      const result = rule.evaluate(
        makeCandidate({ capacityFree: 20 }),
        makeRequest({ urgency: 'medium' })
      );
      expect(result.score).toBe(0);
    });

    it('should mention unavailable in explanation', () => {
      const result = rule.evaluate(
        makeCandidate({ capacityFree: 10 }),
        makeRequest({ urgency: 'high' })
      );
      expect(result.explanation.toLowerCase()).toContain('unavailable');
    });
  });
});
