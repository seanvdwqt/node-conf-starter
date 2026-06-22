import { describe, it, expect } from 'vitest';
import { classifyAvailability } from '../../src/utils/availability.js';

describe('classifyAvailability', () => {
  describe('available (≥75% free)', () => {
    it('returns "available" for exactly 75', () => {
      expect(classifyAvailability(75)).toBe('available');
    });

    it('returns "available" for 100', () => {
      expect(classifyAvailability(100)).toBe('available');
    });

    it('returns "available" for 90', () => {
      expect(classifyAvailability(90)).toBe('available');
    });
  });

  describe('partially_available (25–74% free)', () => {
    it('returns "partially_available" for exactly 25', () => {
      expect(classifyAvailability(25)).toBe('partially_available');
    });

    it('returns "partially_available" for 74', () => {
      expect(classifyAvailability(74)).toBe('partially_available');
    });

    it('returns "partially_available" for 50', () => {
      expect(classifyAvailability(50)).toBe('partially_available');
    });
  });

  describe('unavailable (<25% free)', () => {
    it('returns "unavailable" for 24', () => {
      expect(classifyAvailability(24)).toBe('unavailable');
    });

    it('returns "unavailable" for 0', () => {
      expect(classifyAvailability(0)).toBe('unavailable');
    });

    it('returns "unavailable" for 1', () => {
      expect(classifyAvailability(1)).toBe('unavailable');
    });
  });

  describe('null/undefined handling', () => {
    it('returns "unavailable" for null', () => {
      expect(classifyAvailability(null)).toBe('unavailable');
    });

    it('returns "unavailable" for undefined', () => {
      expect(classifyAvailability(undefined)).toBe('unavailable');
    });
  });
});
