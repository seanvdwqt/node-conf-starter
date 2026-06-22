import { describe, it, expect } from 'vitest';
import { generateExplanation } from '../../src/scoring/explanation.js';
import type { ScoredCandidate } from '../../src/scoring/engine.js';
import type { CandidateContext } from '../../src/scoring/types.js';

function makeCandidate(overrides: Partial<CandidateContext> = {}): CandidateContext {
  return {
    id: 'cand-1',
    name: 'Alice Smith',
    currentRole: 'engineer',
    businessUnit: 'Digital Platforms',
    skills: [
      { skillId: 'sk-1', name: 'React', proficiency: 3 },
      { skillId: 'sk-2', name: 'TypeScript', proficiency: 2 },
    ],
    capacityFree: 80,
    currentWorkload: 20,
    yearsExperience: 7,
    currentTeam: 'Core Platform',
    projects: [
      { projectName: 'Project Alpha', rolePlayed: 'Lead Engineer' },
    ],
    ...overrides,
  };
}

function makeScoredCandidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    candidate: makeCandidate(),
    totalScore: 75,
    breakdown: [
      { rule: 'skillMatch', weight: 0.30, contribution: 25 },
      { rule: 'proficiency', weight: 0.15, contribution: 12 },
      { rule: 'experience', weight: 0.10, contribution: 7 },
      { rule: 'availability', weight: 0.20, contribution: 20 },
      { rule: 'workload', weight: 0.10, contribution: 8 },
      { rule: 'urgency', weight: 0.15, contribution: 10.5 },
    ],
    explanations: [],
    flags: [],
    ...overrides,
  };
}

describe('generateExplanation', () => {
  it('produces a string with complete sentences', () => {
    const result = generateExplanation(makeScoredCandidate());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Should end with a period (complete sentence)
    expect(result.trimEnd()).toMatch(/\.$/);
  });

  it('references matched skills by name with proficiency levels', () => {
    const result = generateExplanation(makeScoredCandidate());
    expect(result).toContain('React');
    expect(result).toContain('TypeScript');
    expect(result).toContain('expert');
    expect(result).toContain('proficient');
  });

  it('includes years of experience', () => {
    const result = generateExplanation(makeScoredCandidate());
    expect(result).toContain('7 years of experience');
  });

  it('includes availability status', () => {
    const result = generateExplanation(makeScoredCandidate());
    expect(result).toContain('currently available');
    expect(result).toContain('80% capacity free');
  });

  it('mentions scoring factors in natural language', () => {
    const result = generateExplanation(makeScoredCandidate());
    // Should use natural language, not technical identifiers
    expect(result).toContain('skill alignment');
    expect(result).not.toContain('skillMatch');
  });

  it('does not include technical jargon or rule identifiers', () => {
    const result = generateExplanation(makeScoredCandidate());
    expect(result).not.toMatch(/\brule\b/i);
    expect(result).not.toMatch(/\bscore\b/i);
    expect(result).not.toMatch(/\bweight\b/i);
    expect(result).not.toMatch(/\bcontribution\b/i);
  });

  it('mentions high workload when flagged', () => {
    const scored = makeScoredCandidate({
      flags: ['high_workload'],
      candidate: makeCandidate({ currentWorkload: 85, capacityFree: 15 }),
    });
    // Override availability for a partially available or unavailable state
    scored.candidate.capacityFree = 40;
    const result = generateExplanation(scored);
    expect(result).toContain('heavy workload');
  });

  it('handles a candidate with a single skill', () => {
    const scored = makeScoredCandidate({
      candidate: makeCandidate({
        skills: [{ skillId: 'sk-1', name: 'Java', proficiency: 1 }],
      }),
    });
    const result = generateExplanation(scored);
    expect(result).toContain('Java');
    expect(result).toContain('foundational');
  });

  it('handles a candidate with no skills', () => {
    const scored = makeScoredCandidate({
      candidate: makeCandidate({ skills: [] }),
    });
    const result = generateExplanation(scored);
    expect(result).toContain('no listed skills');
  });

  it('describes experience appropriately for 10+ years', () => {
    const scored = makeScoredCandidate({
      candidate: makeCandidate({ yearsExperience: 12 }),
    });
    const result = generateExplanation(scored);
    expect(result).toContain('significant depth');
  });

  it('describes experience appropriately for 2–4 years', () => {
    const scored = makeScoredCandidate({
      candidate: makeCandidate({ yearsExperience: 3 }),
    });
    const result = generateExplanation(scored);
    expect(result).toContain('developing foundation');
  });

  it('describes experience appropriately for 1 year', () => {
    const scored = makeScoredCandidate({
      candidate: makeCandidate({ yearsExperience: 1 }),
    });
    const result = generateExplanation(scored);
    expect(result).toContain('early in their career');
  });

  it('handles partially available candidate', () => {
    const scored = makeScoredCandidate({
      candidate: makeCandidate({ capacityFree: 50 }),
    });
    const result = generateExplanation(scored);
    expect(result).toContain('partially available');
    expect(result).toContain('50% capacity free');
  });

  it('handles an empty breakdown gracefully', () => {
    const scored = makeScoredCandidate({ breakdown: [] });
    const result = generateExplanation(scored);
    // Should still produce valid output without the factors summary
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('ranking reflects');
  });
});
