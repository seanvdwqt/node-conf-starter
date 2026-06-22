import { describe, it, expect } from 'vitest';
import { validateCustomSkill } from '../../src/validation/customSkill.js';

describe('validateCustomSkill', () => {
  it('accepts a valid description of 1 character', () => {
    const result = validateCustomSkill('A');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts a valid description of 200 characters', () => {
    const result = validateCustomSkill('a'.repeat(200));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts a typical description', () => {
    const result = validateCustomSkill('Knowledge of cloud infrastructure');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects null', () => {
    const result = validateCustomSkill(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects undefined', () => {
    const result = validateCustomSkill(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects empty string', () => {
    const result = validateCustomSkill('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a description longer than 200 characters', () => {
    const result = validateCustomSkill('a'.repeat(201));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
