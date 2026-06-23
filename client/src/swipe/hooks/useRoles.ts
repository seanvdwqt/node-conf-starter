/**
 * useRoles — Fetches roles from GET /api/roles
 *
 * Validates: Requirements 1.2, 1.3, 2.1, 2.5, 10.1, 10.4
 */

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '../types';

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
      setRoles(data);
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
