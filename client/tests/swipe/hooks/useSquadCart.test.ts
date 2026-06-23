import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSquadCart } from '../../../src/swipe/hooks/useSquadCart';
import type { SwipeCandidate } from '../../../src/swipe/types';

function makeCandidate(overrides: Partial<SwipeCandidate> = {}): SwipeCandidate {
  return {
    id: overrides.id ?? 'c1',
    name: overrides.name ?? 'Alice',
    email: 'alice@test.com',
    currentRole: overrides.currentRole ?? 'engineer',
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

describe('useSquadCart', () => {
  it('initialises with empty cart', () => {
    const { result } = renderHook(() => useSquadCart());

    expect(result.current.cart).toEqual([]);
    expect(result.current.isFull).toBe(false);
    expect(result.current.countByRole).toEqual({});
  });

  it('adds a candidate to the cart', () => {
    const { result } = renderHook(() => useSquadCart());
    const candidate = makeCandidate();

    act(() => {
      result.current.add(candidate, 'engineer');
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].candidateId).toBe('c1');
    expect(result.current.cart[0].candidateName).toBe('Alice');
    expect(result.current.cart[0].role).toBe('engineer');
    expect(result.current.cart[0].candidate).toBe(candidate);
  });

  it('does not add a duplicate candidate', () => {
    const { result } = renderHook(() => useSquadCart());
    const candidate = makeCandidate();

    act(() => {
      result.current.add(candidate, 'engineer');
    });
    act(() => {
      result.current.add(candidate, 'engineer');
    });

    expect(result.current.cart).toHaveLength(1);
  });

  it('removes a candidate from the cart', () => {
    const { result } = renderHook(() => useSquadCart());
    const c1 = makeCandidate({ id: 'c1', name: 'Alice' });
    const c2 = makeCandidate({ id: 'c2', name: 'Bob' });

    act(() => {
      result.current.add(c1, 'engineer');
      result.current.add(c2, 'tester');
    });
    act(() => {
      result.current.remove('c1');
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].candidateId).toBe('c2');
  });

  it('clears all items from the cart', () => {
    const { result } = renderHook(() => useSquadCart());

    act(() => {
      result.current.add(makeCandidate({ id: 'c1' }), 'engineer');
      result.current.add(makeCandidate({ id: 'c2' }), 'tester');
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.cart).toEqual([]);
    expect(result.current.isFull).toBe(false);
    expect(result.current.countByRole).toEqual({});
  });

  it('reports isFull when cart reaches 20 items', () => {
    const { result } = renderHook(() => useSquadCart());

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.add(makeCandidate({ id: `c${i}` }), 'engineer');
      }
    });

    expect(result.current.cart).toHaveLength(20);
    expect(result.current.isFull).toBe(true);
  });

  it('does not add beyond 20 items', () => {
    const { result } = renderHook(() => useSquadCart());

    act(() => {
      for (let i = 0; i < 21; i++) {
        result.current.add(makeCandidate({ id: `c${i}` }), 'engineer');
      }
    });

    expect(result.current.cart).toHaveLength(20);
  });

  it('contains returns true for candidates in the cart', () => {
    const { result } = renderHook(() => useSquadCart());

    act(() => {
      result.current.add(makeCandidate({ id: 'c1' }), 'engineer');
    });

    expect(result.current.contains('c1')).toBe(true);
    expect(result.current.contains('c99')).toBe(false);
  });

  it('countByRole groups items by their role', () => {
    const { result } = renderHook(() => useSquadCart());

    act(() => {
      result.current.add(makeCandidate({ id: 'c1' }), 'engineer');
      result.current.add(makeCandidate({ id: 'c2' }), 'engineer');
      result.current.add(makeCandidate({ id: 'c3' }), 'tester');
    });

    expect(result.current.countByRole).toEqual({
      engineer: 2,
      tester: 1,
    });
  });

  it('countByRole updates after remove', () => {
    const { result } = renderHook(() => useSquadCart());

    act(() => {
      result.current.add(makeCandidate({ id: 'c1' }), 'engineer');
      result.current.add(makeCandidate({ id: 'c2' }), 'engineer');
    });
    act(() => {
      result.current.remove('c1');
    });

    expect(result.current.countByRole).toEqual({ engineer: 1 });
  });

  it('isFull becomes false again after removing from a full cart', () => {
    const { result } = renderHook(() => useSquadCart());

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.add(makeCandidate({ id: `c${i}` }), 'engineer');
      }
    });

    expect(result.current.isFull).toBe(true);

    act(() => {
      result.current.remove('c0');
    });

    expect(result.current.isFull).toBe(false);
    expect(result.current.cart).toHaveLength(19);
  });
});
