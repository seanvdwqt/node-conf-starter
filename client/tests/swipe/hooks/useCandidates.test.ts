import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCandidates } from '../../../src/swipe/hooks/useCandidates';

const rawCandidates = [
  {
    id: '1',
    name: 'Alice',
    email: 'alice@example.com',
    currentRole: 'engineer',
    businessUnit: 'Platform',
    capacityFree: 80,
    currentWorkload: 20,
    yearsExperience: 5,
    currentTeam: 'Team Alpha',
    skills: [],
    projects: [],
  },
  {
    id: '2',
    name: 'Bob',
    email: 'bob@example.com',
    currentRole: 'architect',
    businessUnit: 'Infra',
    capacityFree: 50,
    currentWorkload: 50,
    yearsExperience: 8,
    currentTeam: 'Team Beta',
    skills: [],
    projects: [],
  },
  {
    id: '3',
    name: 'Charlie',
    email: 'charlie@example.com',
    currentRole: 'tester',
    businessUnit: 'QA',
    capacityFree: 10,
    currentWorkload: 90,
    yearsExperience: 3,
    currentTeam: 'Team Gamma',
    skills: [],
    projects: [],
  },
];

describe('useCandidates', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in loading state', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})) // never resolves
    );

    const { result } = renderHook(() => useCandidates());

    expect(result.current.loading).toBe(true);
    expect(result.current.candidates).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches candidates and derives availability', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(rawCandidates),
        } as Response)
      )
    );

    const { result } = renderHook(() => useCandidates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.candidates).toHaveLength(3);
    expect(result.current.candidates[0].availability).toBe('available'); // 80 >= 75
    expect(result.current.candidates[1].availability).toBe('partially_available'); // 50 in 25-74
    expect(result.current.candidates[2].availability).toBe('unavailable'); // 10 < 25
    expect(result.current.error).toBeNull();
  });

  it('handles non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: () => Promise.resolve({}),
        } as Response)
      )
    );

    const { result } = renderHook(() => useCandidates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.error).toBe(
      'Failed to fetch candidates: 503 Service Unavailable'
    );
  });

  it('handles network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network error')))
    );

    const { result } = renderHook(() => useCandidates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('refetch clears error and re-fetches', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawCandidates),
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useCandidates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');

    // Refetch succeeds
    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.candidates).toHaveLength(3);
    expect(result.current.candidates[0].availability).toBe('available');
  });

  it('derives availability as unavailable for null capacityFree', async () => {
    const candidateWithNullCapacity = [
      {
        id: '4',
        name: 'Diana',
        email: 'diana@example.com',
        currentRole: 'engineer',
        businessUnit: 'Platform',
        capacityFree: null,
        currentWorkload: 0,
        yearsExperience: 2,
        currentTeam: 'Team Delta',
        skills: [],
        projects: [],
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(candidateWithNullCapacity),
        } as Response)
      )
    );

    const { result } = renderHook(() => useCandidates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.candidates[0].availability).toBe('unavailable');
  });
});
