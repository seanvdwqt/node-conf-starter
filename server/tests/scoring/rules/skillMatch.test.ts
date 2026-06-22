import { describe, it, expect } from 'vitest';
import { createSkillMatchRule } from '../../../src/scoring/rules/skillMatch.js';
import type { CandidateContext, RequestContext } from '../../../src/scoring/types.js';

function makeCandidate(skillIds: string[]): CandidateContext {
  return {
    id: 'c1',
    name: 'Test Candidate',
    currentRole: 'engineer',
    businessUnit: 'Digital Platforms',
    skills: skillIds.map((id) => ({ skillId: id, name: `Skill ${id}`, proficiency: 2 as const })),
    capacityFree: 80,
    currentWorkload: 30,
    yearsExperience: 5,
    currentTeam: 'Team A',
    projects: [],
  };
}

function makeRequest(mandatoryIds: string[], preferredIds: string[]): RequestContext {
  return {
    urgency: 'medium',
    mandatorySkills: mandatoryIds.map((id) => ({
      skillId: id,
      name: `Skill ${id}`,
      requiredProficiency: 2 as const,
    })),
    preferredSkills: preferredIds.map((id) => ({
      skillId: id,
      name: `Skill ${id}`,
      requiredProficiency: 1 as const,
    })),
    businessUnit: 'Digital Platforms',
  };
}

describe('SkillMatchRule', () => {
  const rule = createSkillMatchRule(0.3);

  it('has correct name and weight', () => {
    expect(rule.name).toBe('skillMatch');
    expect(rule.weight).toBe(0.3);
  });

  it('excludes candidate when no mandatory skills match', () => {
    const candidate = makeCandidate(['s1', 's2']);
    const request = makeRequest(['s3', 's4'], ['s5']);

    const result = rule.evaluate(candidate, request);

    expect(result.score).toBe(0);
    expect(result.exclude).toBe(true);
  });

  it('scores correctly when all skills match', () => {
    const candidate = makeCandidate(['s1', 's2', 's3']);
    const request = makeRequest(['s1', 's2'], ['s3']);

    const result = rule.evaluate(candidate, request);

    // (2*2 + 1) / (2*2 + 1) * 100 = 100
    expect(result.score).toBe(100);
    expect(result.exclude).toBeUndefined();
  });

  it('scores correctly with partial mandatory match', () => {
    const candidate = makeCandidate(['s1']);
    const request = makeRequest(['s1', 's2'], ['s3']);

    const result = rule.evaluate(candidate, request);

    // (1*2 + 0) / (2*2 + 1) * 100 = 2/5 * 100 = 40
    expect(result.score).toBe(40);
    expect(result.exclude).toBeUndefined();
  });

  it('scores correctly with mandatory and preferred matches', () => {
    const candidate = makeCandidate(['s1', 's3']);
    const request = makeRequest(['s1', 's2'], ['s3', 's4']);

    const result = rule.evaluate(candidate, request);

    // (1*2 + 1) / (2*2 + 2) * 100 = 3/6 * 100 = 50
    expect(result.score).toBe(50);
    expect(result.exclude).toBeUndefined();
  });

  it('includes matched skill names in explanation', () => {
    const candidate = makeCandidate(['s1', 's3']);
    const request = makeRequest(['s1'], ['s3']);

    const result = rule.evaluate(candidate, request);

    expect(result.explanation).toContain('Skill s1');
    expect(result.explanation).toContain('Skill s3');
    expect(result.explanation).toContain('1/1 mandatory');
    expect(result.explanation).toContain('1/1 preferred');
  });

  it('handles request with only mandatory skills', () => {
    const candidate = makeCandidate(['s1', 's2']);
    const request = makeRequest(['s1', 's2', 's3'], []);

    const result = rule.evaluate(candidate, request);

    // (2*2 + 0) / (3*2 + 0) * 100 = 4/6 * 100 ≈ 66.67
    expect(result.score).toBeCloseTo(66.67, 1);
  });

  it('handles request with only preferred skills when mandatory matched', () => {
    const candidate = makeCandidate(['s1', 's2', 's3']);
    const request = makeRequest(['s1'], ['s2', 's3']);

    const result = rule.evaluate(candidate, request);

    // (1*2 + 2) / (1*2 + 2) * 100 = 4/4 * 100 = 100
    expect(result.score).toBe(100);
  });
});
