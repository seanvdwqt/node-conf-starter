import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoles } from '../../../src/swipe/hooks/useRoles';

const mockRoles = [
  {
    id: '1',
    name: 'engineer',
    displayName: 'Engineer',
    colour: 'blue-500',
    skills: [],
  },
  {
    id: '2',
    name: 'architect',
    displayName: 'Architect',
    colour: 'purple-500',
    skills: [],
  },
];

describe('useRoles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in loading state', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})) // never resolves
    );

    const { result } = renderHook(() => useRoles());

    expect(result.current.loading).toBe(true);
    expect(result.current.roles).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches roles successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoles),
        } as Response)
      )
    );

    const { result } = renderHook(() => useRoles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual(mockRoles);
    expect(result.current.error).toBeNull();
  });

  it('handles non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({}),
        } as Response)
      )
    );

    const { result } = renderHook(() => useRoles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch roles: 500 Internal Server Error');
  });

  it('handles network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network error')))
    );

    const { result } = renderHook(() => useRoles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('refetch clears error and re-fetches', async () => {
    // First call fails
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoles),
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useRoles());

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
    expect(result.current.roles).toEqual(mockRoles);
  });
});
