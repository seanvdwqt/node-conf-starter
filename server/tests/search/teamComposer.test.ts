import { describe, it, expect } from 'vitest';
import { composeTeams } from '../../src/search/teamComposer.js';
import type { CandidateContext } from '../../src/scoring/types.js';
import type { ParsedQuery } from '../../src/search/queryParser.js';

/**
 * Factory to create a test candidate with sensible defaults.
 */
function createCandidate(overrides: Partial<CandidateContext> & { id: string; name: string }): CandidateContext {
  return {
    currentRole: 'engineer',
    businessUnit: 'Digital Platforms',
    skills: [],
    capacityFree: 80,
    currentWorkload: 20,
    yearsExperience: 5,
    currentTeam: 'Platform Team',
    projects: [],
    ...overrides,
  };
}

describe('teamComposer', () => {
  describe('basic composition', () => {
    it('returns empty array when no candidates provided', () => {
      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams([], parsed);
      expect(result).toEqual([]);
    });

    it('returns empty array when no roles and no skills parsed', () => {
      const candidates = [createCandidate({ id: '1', name: 'Alice' })];
      const parsed: ParsedQuery = {
        roles: [],
        skills: [],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);
      expect(result).toEqual([]);
    });

    it('composes a single-role team from scored candidates', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 80,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].members.length).toBe(1);
      expect(result[0].members[0].role).toBe('engineer');
      expect(result[0].teamScore).toBeGreaterThan(0);
    });

    it('composes a multi-role team', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 85,
        }),
        createCandidate({
          id: '3',
          name: 'Charlie',
          skills: [{ skillId: 'react', name: 'React', proficiency: 1 }],
          capacityFree: 75,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [
          { name: 'engineer', quantity: 1 },
          { name: 'tester', quantity: 1 },
        ],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      // First suggestion should have 2 members (one per role)
      expect(result[0].members.length).toBe(2);
      const roles = result[0].members.map((m) => m.role);
      expect(roles).toContain('engineer');
      expect(roles).toContain('tester');
    });
  });

  describe('team score calculation', () => {
    it('team score is the average of member match scores', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 100,
          currentWorkload: 0,
          yearsExperience: 10,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 80,
          currentWorkload: 30,
          yearsExperience: 5,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [
          { name: 'engineer', quantity: 1 },
          { name: 'tester', quantity: 1 },
        ],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      const suggestion = result[0];
      const expectedAvg =
        suggestion.members.reduce((sum, m) => sum + m.matchScore, 0) / suggestion.members.length;
      expect(suggestion.teamScore).toBeCloseTo(expectedAvg, 1);
    });

    it('team score is between 0 and 100', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);
      for (const suggestion of result) {
        expect(suggestion.teamScore).toBeGreaterThanOrEqual(0);
        expect(suggestion.teamScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('multiple suggestions', () => {
    it('generates multiple suggestions by varying the first role candidate', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 85,
        }),
        createCandidate({
          id: '3',
          name: 'Charlie',
          skills: [{ skillId: 'react', name: 'React', proficiency: 1 }],
          capacityFree: 80,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(1);
      // Each suggestion should have a different candidate
      const candidateIds = result.map((s) => s.members[0].candidateId);
      const unique = new Set(candidateIds);
      expect(unique.size).toBe(result.length);
    });

    it('returns at most 5 suggestions', () => {
      const candidates = Array.from({ length: 10 }, (_, i) =>
        createCandidate({
          id: `${i + 1}`,
          name: `Candidate ${i + 1}`,
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90 - i,
        }),
      );

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('suggestions are sorted by team score descending', () => {
      const candidates = Array.from({ length: 5 }, (_, i) =>
        createCandidate({
          id: `${i + 1}`,
          name: `Candidate ${i + 1}`,
          skills: [{ skillId: 'react', name: 'React', proficiency: (3 - (i % 3)) as 1 | 2 | 3 }],
          capacityFree: 90 - i * 5,
          yearsExperience: 10 - i,
        }),
      );

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].teamScore).toBeGreaterThanOrEqual(result[i].teamScore);
      }
    });
  });

  describe('explanation generation', () => {
    it('generates explanation with role names and score', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].explanation).toContain('engineer');
      expect(result[0].explanation).toMatch(/\d+% match/);
    });

    it('generates explanation with multiple roles', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 85,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [
          { name: 'engineer', quantity: 1 },
          { name: 'tester', quantity: 1 },
        ],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].explanation).toContain('engineer');
      expect(result[0].explanation).toContain('tester');
    });
  });

  describe('skill-based teams (no roles)', () => {
    it('composes teams when only skills are provided', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 85,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].members.length).toBeGreaterThan(0);
      expect(result[0].teamScore).toBeGreaterThan(0);
    });
  });

  describe('quantity handling', () => {
    it('respects quantity > 1 for a role', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 85,
        }),
        createCandidate({
          id: '3',
          name: 'Charlie',
          skills: [{ skillId: 'react', name: 'React', proficiency: 1 }],
          capacityFree: 80,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 2 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      // First suggestion should have 2 engineers
      const engineers = result[0].members.filter((m) => m.role === 'engineer');
      expect(engineers.length).toBe(2);
    });
  });

  describe('no duplicate candidates in a team', () => {
    it('does not assign the same candidate to multiple roles', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
        createCandidate({
          id: '2',
          name: 'Bob',
          skills: [{ skillId: 'react', name: 'React', proficiency: 2 }],
          capacityFree: 85,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [
          { name: 'engineer', quantity: 1 },
          { name: 'tester', quantity: 1 },
        ],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      for (const suggestion of result) {
        const ids = suggestion.members.map((m) => m.candidateId);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });
  });

  describe('TeamMember structure', () => {
    it('includes all required fields in TeamMember', () => {
      const candidates = [
        createCandidate({
          id: 'candidate-1',
          name: 'Alice Smith',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
          yearsExperience: 7,
          currentTeam: 'Platform Team',
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const result = composeTeams(candidates, parsed);

      expect(result.length).toBeGreaterThan(0);
      const member = result[0].members[0];
      expect(member.candidateId).toBe('candidate-1');
      expect(member.name).toBe('Alice Smith');
      expect(member.role).toBe('engineer');
      expect(member.matchScore).toBeGreaterThan(0);
      expect(member.matchedSkills).toEqual([{ name: 'React', proficiency: 3 }]);
      expect(member.availability).toBe('available');
      expect(member.yearsExperience).toBe(7);
      expect(member.currentTeam).toBe('Platform Team');
    });
  });

  describe('config override', () => {
    it('accepts an optional config parameter', () => {
      const candidates = [
        createCandidate({
          id: '1',
          name: 'Alice',
          skills: [{ skillId: 'react', name: 'React', proficiency: 3 }],
          capacityFree: 90,
        }),
      ];

      const parsed: ParsedQuery = {
        roles: [{ name: 'engineer', quantity: 1 }],
        skills: ['React'],
        urgency: null,
        signals: [],
      };

      const customConfig = {
        weights: {
          skillMatch: 0.50,
          proficiency: 0.10,
          experience: 0.05,
          availability: 0.15,
          workload: 0.10,
          urgency: 0.10,
        },
        thresholds: {
          workloadHigh: 80,
          minMandatorySkills: 1,
        },
      };

      const result = composeTeams(candidates, parsed, customConfig);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].teamScore).toBeGreaterThan(0);
    });
  });
});
