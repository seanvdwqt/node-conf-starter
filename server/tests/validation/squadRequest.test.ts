import { describe, it, expect } from 'vitest';
import { validateSquadRequest, ValidationError } from '../../src/validation/squadRequest.js';

/**
 * Unit tests for squad request validation.
 * Validates: Requirements 1.3, 1.4, 1.5, 1.6, 2.3
 */

function validInput() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    title: 'My Squad Request',
    objective: 'Build the platform',
    urgency: 'medium',
    durationWeeks: 4,
    requiredCapacity: 50,
    startDate: tomorrow.toISOString().split('T')[0],
    businessUnit: 'Digital Platforms',
  };
}

function fieldNames(errors: ValidationError[]): string[] {
  return errors.map((e) => e.field);
}

describe('validateSquadRequest', () => {
  it('returns no errors for a valid input', () => {
    const errors = validateSquadRequest(validInput());
    expect(errors).toEqual([]);
  });

  it('rejects null/undefined input', () => {
    expect(validateSquadRequest(null).length).toBeGreaterThan(0);
    expect(validateSquadRequest(undefined).length).toBeGreaterThan(0);
  });

  describe('title validation', () => {
    it('requires title to be present', () => {
      const input = { ...validInput(), title: undefined };
      expect(fieldNames(validateSquadRequest(input))).toContain('title');
    });

    it('rejects empty title', () => {
      const input = { ...validInput(), title: '' };
      expect(fieldNames(validateSquadRequest(input))).toContain('title');
    });

    it('rejects whitespace-only title', () => {
      const input = { ...validInput(), title: '   ' };
      expect(fieldNames(validateSquadRequest(input))).toContain('title');
    });

    it('rejects title longer than 100 characters', () => {
      const input = { ...validInput(), title: 'x'.repeat(101) };
      expect(fieldNames(validateSquadRequest(input))).toContain('title');
    });

    it('accepts title of exactly 100 characters', () => {
      const input = { ...validInput(), title: 'x'.repeat(100) };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('title');
    });
  });

  describe('objective validation', () => {
    it('requires objective to be present', () => {
      const input = { ...validInput(), objective: undefined };
      expect(fieldNames(validateSquadRequest(input))).toContain('objective');
    });

    it('rejects empty objective', () => {
      const input = { ...validInput(), objective: '' };
      expect(fieldNames(validateSquadRequest(input))).toContain('objective');
    });

    it('rejects objective longer than 500 characters', () => {
      const input = { ...validInput(), objective: 'x'.repeat(501) };
      expect(fieldNames(validateSquadRequest(input))).toContain('objective');
    });

    it('accepts objective of exactly 500 characters', () => {
      const input = { ...validInput(), objective: 'x'.repeat(500) };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('objective');
    });
  });

  describe('urgency validation', () => {
    it('requires urgency to be present', () => {
      const input = { ...validInput(), urgency: undefined };
      expect(fieldNames(validateSquadRequest(input))).toContain('urgency');
    });

    it('rejects invalid urgency value', () => {
      const input = { ...validInput(), urgency: 'critical' };
      expect(fieldNames(validateSquadRequest(input))).toContain('urgency');
    });

    it.each(['low', 'medium', 'high'])('accepts urgency = "%s"', (urgency) => {
      const input = { ...validInput(), urgency };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('urgency');
    });
  });

  describe('durationWeeks validation', () => {
    it('requires durationWeeks to be present', () => {
      const input = { ...validInput(), durationWeeks: undefined };
      expect(fieldNames(validateSquadRequest(input))).toContain('durationWeeks');
    });

    it('rejects zero', () => {
      const input = { ...validInput(), durationWeeks: 0 };
      expect(fieldNames(validateSquadRequest(input))).toContain('durationWeeks');
    });

    it('rejects negative values', () => {
      const input = { ...validInput(), durationWeeks: -5 };
      expect(fieldNames(validateSquadRequest(input))).toContain('durationWeeks');
    });

    it('rejects non-integer values', () => {
      const input = { ...validInput(), durationWeeks: 3.5 };
      expect(fieldNames(validateSquadRequest(input))).toContain('durationWeeks');
    });

    it('rejects values above 52', () => {
      const input = { ...validInput(), durationWeeks: 53 };
      expect(fieldNames(validateSquadRequest(input))).toContain('durationWeeks');
    });

    it('accepts 1 (minimum)', () => {
      const input = { ...validInput(), durationWeeks: 1 };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('durationWeeks');
    });

    it('accepts 52 (maximum)', () => {
      const input = { ...validInput(), durationWeeks: 52 };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('durationWeeks');
    });
  });

  describe('requiredCapacity validation', () => {
    it('requires requiredCapacity to be present', () => {
      const input = { ...validInput(), requiredCapacity: undefined };
      expect(fieldNames(validateSquadRequest(input))).toContain('requiredCapacity');
    });

    it('rejects values not in increment of 10', () => {
      const input = { ...validInput(), requiredCapacity: 15 };
      expect(fieldNames(validateSquadRequest(input))).toContain('requiredCapacity');
    });

    it('rejects 0', () => {
      const input = { ...validInput(), requiredCapacity: 0 };
      expect(fieldNames(validateSquadRequest(input))).toContain('requiredCapacity');
    });

    it.each([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])(
      'accepts requiredCapacity = %d',
      (cap) => {
        const input = { ...validInput(), requiredCapacity: cap };
        expect(fieldNames(validateSquadRequest(input))).not.toContain('requiredCapacity');
      }
    );
  });

  describe('startDate validation', () => {
    it('requires startDate to be present', () => {
      const input = { ...validInput(), startDate: undefined };
      expect(fieldNames(validateSquadRequest(input))).toContain('startDate');
    });

    it('rejects invalid date strings', () => {
      const input = { ...validInput(), startDate: 'not-a-date' };
      expect(fieldNames(validateSquadRequest(input))).toContain('startDate');
    });

    it('rejects dates in the past', () => {
      const input = { ...validInput(), startDate: '2020-01-01' };
      expect(fieldNames(validateSquadRequest(input))).toContain('startDate');
    });

    it('accepts today', () => {
      const today = new Date().toISOString().split('T')[0];
      const input = { ...validInput(), startDate: today };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('startDate');
    });

    it('accepts a future date', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const input = { ...validInput(), startDate: future.toISOString().split('T')[0] };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('startDate');
    });
  });

  describe('businessUnit validation', () => {
    it('requires businessUnit to be present', () => {
      const input = { ...validInput(), businessUnit: undefined };
      expect(fieldNames(validateSquadRequest(input))).toContain('businessUnit');
    });

    it('rejects incorrect business unit', () => {
      const input = { ...validInput(), businessUnit: 'Other Unit' };
      const errors = validateSquadRequest(input);
      expect(fieldNames(errors)).toContain('businessUnit');
    });

    it('accepts "Digital Platforms"', () => {
      const input = { ...validInput(), businessUnit: 'Digital Platforms' };
      expect(fieldNames(validateSquadRequest(input))).not.toContain('businessUnit');
    });
  });

  describe('multiple errors', () => {
    it('returns errors for ALL invalid fields, not just the first', () => {
      const input = {
        title: '',
        objective: '',
        urgency: 'invalid',
        durationWeeks: 0,
        requiredCapacity: 5,
        startDate: '2020-01-01',
        businessUnit: 'Wrong Unit',
      };
      const errors = validateSquadRequest(input);
      const fields = fieldNames(errors);
      expect(fields).toContain('title');
      expect(fields).toContain('objective');
      expect(fields).toContain('urgency');
      expect(fields).toContain('durationWeeks');
      expect(fields).toContain('requiredCapacity');
      expect(fields).toContain('startDate');
      expect(fields).toContain('businessUnit');
    });
  });
});
