import { describe, it, expect } from 'vitest';
import {
  deriveAvailability,
  filterCandidatesByRole,
  addToCart,
  removeFromCart,
} from '../../src/swipe/utils';
import type { CartItem, SwipeCandidate } from '../../src/swipe/types';

// --- Helpers ---

function makeCandidate(overrides: Partial<SwipeCandidate> = {}): SwipeCandidate {
  return {
    id: 'c1',
    name: 'Alice',
    email: 'alice@example.com',
    currentRole: 'engineer',
    businessUnit: 'Digital',
    capacityFree: 80,
    currentWorkload: 20,
    yearsExperience: 5,
    currentTeam: 'Team A',
    skills: [],
    projects: [],
    availability: 'available',
    ...overrides,
  };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  const candidate = makeCandidate({ id: overrides.candidateId ?? 'c1' });
  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    role: 'engineer',
    addedAt: Date.now(),
    candidate,
    ...overrides,
  };
}

// --- deriveAvailability ---

describe('deriveAvailability', () => {
  it('returns "available" for capacityFree >= 75', () => {
    expect(deriveAvailability(75)).toBe('available');
    expect(deriveAvailability(100)).toBe('available');
    expect(deriveAvailability(99)).toBe('available');
  });

  it('returns "partially_available" for capacityFree 25–74', () => {
    expect(deriveAvailability(25)).toBe('partially_available');
    expect(deriveAvailability(50)).toBe('partially_available');
    expect(deriveAvailability(74)).toBe('partially_available');
  });

  it('returns "unavailable" for capacityFree < 25', () => {
    expect(deriveAvailability(0)).toBe('unavailable');
    expect(deriveAvailability(24)).toBe('unavailable');
    expect(deriveAvailability(1)).toBe('unavailable');
  });

  it('returns "unavailable" for null', () => {
    expect(deriveAvailability(null)).toBe('unavailable');
  });

  it('returns "unavailable" for undefined', () => {
    expect(deriveAvailability(undefined)).toBe('unavailable');
  });
});

// --- filterCandidatesByRole ---

describe('filterCandidatesByRole', () => {
  const candidates: SwipeCandidate[] = [
    makeCandidate({ id: 'c1', currentRole: 'engineer', availability: 'available', yearsExperience: 3 }),
    makeCandidate({ id: 'c2', currentRole: 'engineer', availability: 'partially_available', yearsExperience: 7 }),
    makeCandidate({ id: 'c3', currentRole: 'engineer', availability: 'unavailable', yearsExperience: 10 }),
    makeCandidate({ id: 'c4', currentRole: 'tester', availability: 'available', yearsExperience: 5 }),
    makeCandidate({ id: 'c5', currentRole: 'engineer', availability: 'available', yearsExperience: 8 }),
  ];

  it('filters by role', () => {
    const result = filterCandidatesByRole(candidates, 'engineer', new Set());
    expect(result.every((c) => c.currentRole === 'engineer')).toBe(true);
  });

  it('excludes unavailable candidates', () => {
    const result = filterCandidatesByRole(candidates, 'engineer', new Set());
    expect(result.find((c) => c.id === 'c3')).toBeUndefined();
  });

  it('excludes candidates in excludeIds set', () => {
    const result = filterCandidatesByRole(candidates, 'engineer', new Set(['c1']));
    expect(result.find((c) => c.id === 'c1')).toBeUndefined();
  });

  it('sorts available before partially_available', () => {
    const result = filterCandidatesByRole(candidates, 'engineer', new Set());
    const availabilities = result.map((c) => c.availability);
    const availableIndex = availabilities.lastIndexOf('available');
    const partialIndex = availabilities.indexOf('partially_available');
    if (partialIndex !== -1) {
      expect(availableIndex).toBeLessThan(partialIndex);
    }
  });

  it('sorts by yearsExperience descending within same availability', () => {
    const result = filterCandidatesByRole(candidates, 'engineer', new Set());
    // available group: c5 (8 years) should come before c1 (3 years)
    const availableGroup = result.filter((c) => c.availability === 'available');
    expect(availableGroup[0].id).toBe('c5');
    expect(availableGroup[1].id).toBe('c1');
  });

  it('returns empty array when no candidates match the role', () => {
    const result = filterCandidatesByRole(candidates, 'architect', new Set());
    expect(result).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const original = [...candidates];
    filterCandidatesByRole(candidates, 'engineer', new Set());
    expect(candidates).toEqual(original);
  });
});

// --- addToCart ---

describe('addToCart', () => {
  it('adds a candidate to an empty cart', () => {
    const candidate = makeCandidate({ id: 'c1', name: 'Alice' });
    const result = addToCart([], candidate, 'engineer');
    expect(result).toHaveLength(1);
    expect(result[0].candidateId).toBe('c1');
    expect(result[0].candidateName).toBe('Alice');
    expect(result[0].role).toBe('engineer');
  });

  it('returns unchanged cart when candidate is already present', () => {
    const candidate = makeCandidate({ id: 'c1' });
    const cart: CartItem[] = [makeCartItem({ candidateId: 'c1' })];
    const result = addToCart(cart, candidate, 'engineer');
    expect(result).toBe(cart); // same reference
  });

  it('returns unchanged cart when cart is at capacity (20)', () => {
    const cart: CartItem[] = Array.from({ length: 20 }, (_, i) =>
      makeCartItem({ candidateId: `c${i}` })
    );
    const newCandidate = makeCandidate({ id: 'new' });
    const result = addToCart(cart, newCandidate, 'engineer');
    expect(result).toBe(cart); // same reference
    expect(result).toHaveLength(20);
  });

  it('appends new item at the end', () => {
    const existing = makeCartItem({ candidateId: 'c1' });
    const newCandidate = makeCandidate({ id: 'c2', name: 'Bob' });
    const result = addToCart([existing], newCandidate, 'tester');
    expect(result).toHaveLength(2);
    expect(result[0].candidateId).toBe('c1');
    expect(result[1].candidateId).toBe('c2');
    expect(result[1].role).toBe('tester');
  });

  it('returns a new array (does not mutate original)', () => {
    const cart: CartItem[] = [makeCartItem({ candidateId: 'c1' })];
    const candidate = makeCandidate({ id: 'c2' });
    const result = addToCart(cart, candidate, 'engineer');
    expect(result).not.toBe(cart);
    expect(cart).toHaveLength(1);
  });
});

// --- removeFromCart ---

describe('removeFromCart', () => {
  it('removes the item matching candidateId', () => {
    const cart: CartItem[] = [
      makeCartItem({ candidateId: 'c1' }),
      makeCartItem({ candidateId: 'c2' }),
      makeCartItem({ candidateId: 'c3' }),
    ];
    const result = removeFromCart(cart, 'c2');
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.candidateId)).toEqual(['c1', 'c3']);
  });

  it('returns the same reference if no item matches', () => {
    const cart: CartItem[] = [makeCartItem({ candidateId: 'c1' })];
    const result = removeFromCart(cart, 'nonexistent');
    expect(result).toBe(cart);
  });

  it('preserves order of remaining items', () => {
    const cart: CartItem[] = [
      makeCartItem({ candidateId: 'c1' }),
      makeCartItem({ candidateId: 'c2' }),
      makeCartItem({ candidateId: 'c3' }),
      makeCartItem({ candidateId: 'c4' }),
    ];
    const result = removeFromCart(cart, 'c2');
    expect(result.map((i) => i.candidateId)).toEqual(['c1', 'c3', 'c4']);
  });

  it('handles removing from single-item cart', () => {
    const cart: CartItem[] = [makeCartItem({ candidateId: 'c1' })];
    const result = removeFromCart(cart, 'c1');
    expect(result).toHaveLength(0);
  });

  it('handles empty cart gracefully', () => {
    const result = removeFromCart([], 'c1');
    expect(result).toEqual([]);
  });
});
