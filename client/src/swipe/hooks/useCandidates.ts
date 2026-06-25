/**
 * useCandidates — Fetches candidates from GET /api/candidates and derives availability
 *
 * Validates: Requirements 1.2, 1.3, 2.1, 10.1, 10.4
 */

import { useCallback, useEffect, useState } from 'react';
import type { SwipeCandidate } from '../types';
import { deriveAvailability } from '../utils';

export interface UseCandidatesResult {
  candidates: SwipeCandidate[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCandidates(): UseCandidatesResult {
  const [candidates, setCandidates] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/candidates');

      if (!response.ok) {
        throw new Error(
          `Failed to fetch candidates: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      const mapped: SwipeCandidate[] = data.map(
        (raw: Record<string, unknown>) => {
          // Map nested skill objects to flat CandidateSkill shape
          const rawSkills = (raw.skills as Array<Record<string, unknown>>) ?? [];
          const skills = rawSkills.map((s) => {
            const nested = s.skill as Record<string, unknown> | undefined;
            return {
              id: (s.id as string) ?? (s.skillId as string) ?? '',
              name: nested?.name as string ?? (s.name as string) ?? '',
              category: nested?.category as string ?? (s.category as string) ?? '',
              proficiency: (s.proficiency as number) ?? 1,
            };
          });

          return {
            id: raw.id as string,
            name: raw.name as string,
            email: raw.email as string,
            currentRole: raw.currentRole as string,
            businessUnit: raw.businessUnit as string,
            capacityFree: raw.capacityFree as number,
            currentWorkload: raw.currentWorkload as number,
            yearsExperience: raw.yearsExperience as number,
            currentTeam: raw.currentTeam as string,
            skills,
            projects: (raw.projects as Array<Record<string, unknown>> ?? []).map((p) => ({
              id: p.id as string,
              projectName: p.projectName as string,
              rolePlayed: p.rolePlayed as string,
            })),
            availability: deriveAvailability(raw.capacityFree as number | null | undefined),
          };
        }
      );

      setCandidates(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch candidates';
      setError(message);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return { candidates, loading, error, refetch: fetchCandidates };
}
