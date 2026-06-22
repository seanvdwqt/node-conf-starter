import { describe, it, expect } from 'vitest';
import { createProficiencyRule } from '../../../src/scoring/rules/proficiency.js';
import type { CandidateContext, RequestContext, ProficiencyLevel } from '../../../src/scoring/types.js';

function makeCandidate(skills: { id: string; proficiency: ProficiencyLevel }[]): CandidateContext {
  return {
    id: 'c1',
    name: 'Test Candidate',
    currentRole: 'engineer',
    businessUnit: 'Digital Platforms',
    skills: skills.map((s) => ({ skillId: s.id, name: `Skill ${s.id}`, proficiency: s.proficiency })),
    capacityFree: 80,
    currentWorkload: 30,
    yearsExperience: 5,
    currentTeam: 'Team A',
    projects: [],
  };
}

function makeRequest(
  mandatorySkills: { id: string; requiredProficiency: ProficiencyLevel }[],
  preferredSkills: { id: string; requiredProficiency: ProficiencyLevel }[] = [],
): RequestContext {
  return {
    urgency: 'medium',
    mandatorySkills: mandatorySkills.map((s) => ({
      skillId: s.id,
      name: `Skill ${s.id}`,
      requiredProficiency: s.requiredProficiency,
    })),
    preferredSkills: preferredSkills.map((s) => ({
      skillId: s.id,
      name: `Skill ${s.id}`,
      requiredProficiency: s.requiredProficiency,
    })),
    businessUnit: 'Digital Platforms',
  };
}

describe('ProficiencyRule', () => {
  const rule = createProficiencyRule(0.15);

  it('has correct name and weight', () => {
    expect(rule.name).toBe('proficiency');
    expect(rule.weight).toBe(0.15);
  });

  it('returns score 0 when no skills match', () => {
    const candidate = makeCandidate([{ id: 's1', proficiency: 3 }]);
    const request = makeRequest([{ id: 's2', requiredProficiency: 2 }]);

    const result = rule.evaluate(candidate, request);

    expect(result.score).toBe(0);
    expect(result.explanation).toContain('No matched skills');
  });

  it('returns full score (100) when candidate meets all required proficiency levels', () => {
    const candidate = makeCandidate([
      { id: 's1', proficiency: 3 },
      { id: 's2', proficiency: 2 },
    ]);
    const request = makeRequest([
      { id: 's1', requiredProficiency: 2 },
      { id: 's2', requiredProficiency: 2 },
    ]);

    const result = rule.evaluate(candidate, request);

    expect(result.score).toBe(100);
  });

  it('returns full score when candidate exceeds required proficiency', () => {
    const candidate = makeCandidate([{ id: 's1', proficiency: 3 }]);
    const request = makeRequest([{ id: 's1', requiredProficiency: 1 }]);

    const result = rule.evaluate(candidate, request);

    expect(result.score).toBe(100);
  });

  it('returns proportional score when candidate is below required proficiency', () => {
    const candidate = makeCandidate([{ id: 's1', proficiency: 1 }]);
    const request = makeRequest([{ id: 's1', requiredProficiency: 3 }]);

    const result = rule.evaluate(candidate, request);

    // 1/3 * 100 ≈ 33.33
    expect(result.score).toBeCloseTo(33.33, 1);
  });

  it('averages scores across multiple matched skills', () => {
    const candidate = makeCandidate([
      { id: 's1', proficiency: 3 }, // meets required 2 → 100
      { id: 's2', proficiency: 1 }, // below required 2 → 50
    ]);
    const request = makeRequest([
      { id: 's1', requiredProficiency: 2 },
      { id: 's2', requiredProficiency: 2 },
    ]);

    const result = rule.evaluate(candidate, request);

    // average of 100 and 50 = 75
    expect(result.score).toBe(75);
  });

  it('considers both mandatory and preferred skills', () => {
    const candidate = makeCandidate([
      { id: 's1', proficiency: 2 }, // meets mandatory required 2 → 100
      { id: 's2', proficiency: 1 }, // below preferred required 3 → 33.33
    ]);
    const request = makeRequest(
      [{ id: 's1', requiredProficiency: 2 }],
      [{ id: 's2', requiredProficiency: 3 }],
    );

    const result = rule.evaluate(candidate, request);

    // average of 100 and 33.33 ≈ 66.67
    expect(result.score).toBeCloseTo(66.67, 1);
  });

  it('only evaluates matched skills, ignoring unmatched ones', () => {
    const candidate = makeCandidate([
      { id: 's1', proficiency: 2 },
      { id: 's3', proficiency: 3 }, // not in request
    ]);
    const request = makeRequest([
      { id: 's1', requiredProficiency: 2 },
      { id: 's2', requiredProficiency: 3 }, // candidate doesn't have this
    ]);

    const result = rule.evaluate(candidate, request);

    // Only s1 matches: 2 >= 2 → 100
    expect(result.score).toBe(100);
  });

  it('includes proficiency comparison in explanation', () => {
    const candidate = makeCandidate([
      { id: 's1', proficiency: 3 },
      { id: 's2', proficiency: 1 },
    ]);
    const request = makeRequest([
      { id: 's1', requiredProficiency: 2 },
      { id: 's2', requiredProficiency: 3 },
    ]);

    const result = rule.evaluate(candidate, request);

    expect(result.explanation).toContain('Skill s1');
    expect(result.explanation).toContain('meets or exceeds');
    expect(result.explanation).toContain('3/2');
    expect(result.explanation).toContain('Skill s2');
    expect(result.explanation).toContain('below required');
    expect(result.explanation).toContain('1/3');
  });

  it('handles proficiency level 2 below required 3', () => {
    const candidate = makeCandidate([{ id: 's1', proficiency: 2 }]);
    const request = makeRequest([{ id: 's1', requiredProficiency: 3 }]);

    const result = rule.evaluate(candidate, request);

    // 2/3 * 100 ≈ 66.67
    expect(result.score).toBeCloseTo(66.67, 1);
  });
});
