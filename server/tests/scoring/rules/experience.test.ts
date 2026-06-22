import { describe, it, expect } from 'vitest';
import { createExperienceRule } from '../../../src/scoring/rules/experience.js';
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

describe('ExperienceRule', () => {
  const rule = createExperienceRule(0.10);

  it('has the correct name and weight', () => {
    expect(rule.name).toBe('experience');
    expect(rule.weight).toBe(0.10);
  });

  describe('score calculation', () => {
    it('returns yearsExperience × 10 for candidates under 10 years', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 5 }), request);
      expect(result.score).toBe(50);
    });

    it('returns 100 for exactly 10 years', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 10 }), request);
      expect(result.score).toBe(100);
    });

    it('caps at 100 for more than 10 years', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 15 }), request);
      expect(result.score).toBe(100);
    });

    it('returns 0 for 0 years of experience', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 0 }), request);
      expect(result.score).toBe(0);
    });

    it('returns 10 for 1 year of experience', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 1 }), request);
      expect(result.score).toBe(10);
    });
  });

  describe('explanation', () => {
    it('includes years of experience', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 7 }), request);
      expect(result.explanation).toContain('7 years of experience');
    });

    it('indicates maximum score for 10+ years', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 12 }), request);
      expect(result.explanation).toContain('maximum score');
    });

    it('does not indicate maximum score for under 10 years', () => {
      const result = rule.evaluate(makeCandidate({ yearsExperience: 3 }), request);
      expect(result.explanation).not.toContain('maximum score');
    });
  });
});
