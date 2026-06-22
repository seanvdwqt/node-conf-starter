import { describe, it, expect } from 'vitest';
import { parseQuery } from '../../src/search/queryParser.js';

describe('queryParser', () => {
  describe('role extraction', () => {
    it('extracts a single role', () => {
      const result = parseQuery('I need an architect');
      expect(result.roles).toContainEqual({ name: 'architect', quantity: 1 });
    });

    it('extracts multiple roles', () => {
      const result = parseQuery('I need an architect and a tester');
      expect(result.roles).toContainEqual({ name: 'architect', quantity: 1 });
      expect(result.roles).toContainEqual({ name: 'tester', quantity: 1 });
    });

    it('extracts quantity indicators', () => {
      const result = parseQuery('2 engineers and 3 testers');
      expect(result.roles).toContainEqual({ name: 'engineer', quantity: 2 });
      expect(result.roles).toContainEqual({ name: 'tester', quantity: 3 });
    });

    it('maps synonyms correctly', () => {
      const result = parseQuery('I need a dev and a BA');
      expect(result.roles).toContainEqual({ name: 'engineer', quantity: 1 });
      expect(result.roles).toContainEqual({ name: 'business analyst', quantity: 1 });
    });

    it('maps QA to tester', () => {
      const result = parseQuery('looking for QA');
      expect(result.roles).toContainEqual({ name: 'tester', quantity: 1 });
    });

    it('maps DBA to data specialist', () => {
      const result = parseQuery('need a DBA');
      expect(result.roles).toContainEqual({ name: 'data specialist', quantity: 1 });
    });

    it('maps PM to delivery lead', () => {
      const result = parseQuery('need a PM');
      expect(result.roles).toContainEqual({ name: 'delivery lead', quantity: 1 });
    });

    it('maps scrum master to delivery lead', () => {
      const result = parseQuery('need a scrum master');
      expect(result.roles).toContainEqual({ name: 'delivery lead', quantity: 1 });
    });

    it('handles plural forms', () => {
      const result = parseQuery('developers');
      expect(result.roles).toContainEqual({ name: 'engineer', quantity: 1 });
    });

    it('is case-insensitive', () => {
      const result = parseQuery('ARCHITECT and Engineer');
      expect(result.roles).toContainEqual({ name: 'architect', quantity: 1 });
      expect(result.roles).toContainEqual({ name: 'engineer', quantity: 1 });
    });
  });

  describe('skill extraction', () => {
    it('extracts single-word skills', () => {
      const result = parseQuery('someone with React experience');
      expect(result.skills).toContain('React');
    });

    it('extracts multi-word skills', () => {
      const result = parseQuery('need cloud architecture expertise');
      expect(result.skills).toContain('Cloud Architecture');
    });

    it('extracts multiple skills', () => {
      const result = parseQuery('React and Node.js and TypeScript');
      expect(result.skills).toContain('React');
      expect(result.skills).toContain('Node.js');
      expect(result.skills).toContain('TypeScript');
    });

    it('is case-insensitive', () => {
      const result = parseQuery('TYPESCRIPT and react');
      expect(result.skills).toContain('TypeScript');
      expect(result.skills).toContain('React');
    });

    it('matches SQL skill', () => {
      const result = parseQuery('SQL experience needed');
      expect(result.skills).toContain('SQL');
    });

    it('matches Python skill', () => {
      const result = parseQuery('knows python');
      expect(result.skills).toContain('Python');
    });
  });

  describe('urgency extraction', () => {
    it('detects "urgent" as high', () => {
      const result = parseQuery('urgent need for engineer');
      expect(result.urgency).toBe('high');
      expect(result.signals).toContain('urgent');
    });

    it('detects "ASAP" as high', () => {
      const result = parseQuery('need a dev ASAP');
      expect(result.urgency).toBe('high');
      expect(result.signals).toContain('asap');
    });

    it('detects "immediately" as high', () => {
      const result = parseQuery('need someone immediately');
      expect(result.urgency).toBe('high');
      expect(result.signals).toContain('immediately');
    });

    it('detects "right now" as high', () => {
      const result = parseQuery('need engineer right now');
      expect(result.urgency).toBe('high');
      expect(result.signals).toContain('right now');
    });

    it('detects "soon" as medium', () => {
      const result = parseQuery('need a tester soon');
      expect(result.urgency).toBe('medium');
      expect(result.signals).toContain('soon');
    });

    it('returns null urgency when no signals present', () => {
      const result = parseQuery('looking for engineers');
      expect(result.urgency).toBeNull();
      expect(result.signals).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty results for empty string', () => {
      const result = parseQuery('');
      expect(result.roles).toHaveLength(0);
      expect(result.skills).toHaveLength(0);
      expect(result.urgency).toBeNull();
      expect(result.signals).toHaveLength(0);
    });

    it('returns empty results for whitespace only', () => {
      const result = parseQuery('   ');
      expect(result.roles).toHaveLength(0);
      expect(result.skills).toHaveLength(0);
      expect(result.urgency).toBeNull();
      expect(result.signals).toHaveLength(0);
    });

    it('returns empty roles/skills for gibberish', () => {
      const result = parseQuery('xyzzy foobar baz qux');
      expect(result.roles).toHaveLength(0);
      expect(result.skills).toHaveLength(0);
      expect(result.urgency).toBeNull();
    });

    it('handles a complex realistic query', () => {
      const result = parseQuery(
        'I need 2 engineers with React experience and a tester, starting next week'
      );
      expect(result.roles).toContainEqual({ name: 'engineer', quantity: 2 });
      expect(result.roles).toContainEqual({ name: 'tester', quantity: 1 });
      expect(result.skills).toContain('React');
    });

    it('handles combined role and urgency extraction', () => {
      const result = parseQuery('urgent: need 3 developers and a BA with SQL skills');
      expect(result.roles).toContainEqual({ name: 'engineer', quantity: 3 });
      expect(result.roles).toContainEqual({ name: 'business analyst', quantity: 1 });
      expect(result.skills).toContain('SQL');
      expect(result.urgency).toBe('high');
    });
  });
});
