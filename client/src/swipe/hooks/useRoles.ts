/**
 * useRoles — Fetches roles from GET /api/roles
 *
 * Validates: Requirements 1.2, 1.3, 2.1, 2.5, 10.1, 10.4
 */

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '../types';
import { ROLE_COLOUR_MAP } from '../types';

export interface UseRolesResult {
  roles: Role[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/roles');

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Enrich roles with displayName and colour from ROLE_COLOUR_MAP
      const enriched: Role[] = data.map((raw: { id: string; name: string; skills?: Role['skills'] }) => ({
        ...raw,
        displayName: raw.name.charAt(0).toUpperCase() + raw.name.slice(1),
        colour: ROLE_COLOUR_MAP[raw.name.toLowerCase()] ?? 'gray-500',
        skills: raw.skills ?? [],
      }));
      setRoles(enriched);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(message);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, error, refetch: fetchRoles };
}
