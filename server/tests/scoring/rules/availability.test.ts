import { describe, it, expect } from 'vitest';
import { createAvailabilityRule } from '../../../src/scoring/rules/availability.js';
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

const mockRequest: RequestContext = {
  urgency: 'medium',
  mandatorySkills: [],
  preferredSkills: [],
  businessUnit: 'Digital Platforms',
};

describe('AvailabilityRule', () => {
  const rule = createAvailabilityRule(0.2);

  it('should have name "availability"', () => {
    expect(rule.name).toBe('availability');
  });

  it('should use the provided weight', () => {
    expect(rule.weight).toBe(0.2);
  });

  describe('available (≥75% capacity free)', () => {
    it('should score 100 for 75% capacity', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 75 }), mockRequest);
      expect(result.score).toBe(100);
      expect(result.exclude).toBeUndefined();
    });

    it('should score 100 for 100% capacity', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 100 }), mockRequest);
      expect(result.score).toBe(100);
      expect(result.exclude).toBeUndefined();
    });

    it('should mention availability status in explanation', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 90 }), mockRequest);
      expect(result.explanation).toContain('available');
    });
  });

  describe('partially_available (25–74% capacity free)', () => {
    it('should score 50 for 50% capacity', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 50 }), mockRequest);
      expect(result.score).toBe(50);
      expect(result.exclude).toBeUndefined();
    });

    it('should score 50 for 25% capacity (boundary)', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 25 }), mockRequest);
      expect(result.score).toBe(50);
      expect(result.exclude).toBeUndefined();
    });

    it('should score 50 for 74% capacity (boundary)', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 74 }), mockRequest);
      expect(result.score).toBe(50);
      expect(result.exclude).toBeUndefined();
    });

    it('should mention partially available in explanation', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 40 }), mockRequest);
      expect(result.explanation).toContain('partially available');
    });
  });

  describe('unavailable (<25% capacity free)', () => {
    it('should exclude for 24% capacity', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 24 }), mockRequest);
      expect(result.score).toBe(0);
      expect(result.exclude).toBe(true);
    });

    it('should exclude for 0% capacity', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 0 }), mockRequest);
      expect(result.score).toBe(0);
      expect(result.exclude).toBe(true);
    });

    it('should mention unavailable in explanation', () => {
      const result = rule.evaluate(makeCandidate({ capacityFree: 10 }), mockRequest);
      expect(result.explanation).toContain('unavailable');
    });
  });

  describe('null/undefined capacity', () => {
    it('should exclude when capacity is null', () => {
      const result = rule.evaluate(
        makeCandidate({ capacityFree: null as unknown as number }),
        mockRequest
      );
      expect(result.score).toBe(0);
      expect(result.exclude).toBe(true);
    });

    it('should exclude when capacity is undefined', () => {
      const result = rule.evaluate(
        makeCandidate({ capacityFree: undefined as unknown as number }),
        mockRequest
      );
      expect(result.score).toBe(0);
      expect(result.exclude).toBe(true);
    });
  });
});
