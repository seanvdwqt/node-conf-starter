import { useEffect, useState, useMemo } from 'react';
import { getRecommendations, RecommendationResponse, RoleShortlist, RecommendedCandidate } from '../../api/squadRequests';
import { CandidateCard, CandidateData } from '../ui/CandidateCard';
import { GapIndicator } from '../ui/GapIndicator';
import { FilterBar, FilterState, SortField } from '../ui/FilterBar';

export interface RecommendationsStepProps {
  squadRequestId: string;
  onCompleted: () => void;
}

/**
 * Step 3: Recommendations display.
 * Calls POST /api/squad-requests/:id/recommend on mount, then displays
 * a ranked shortlist (up to 10 per role) with rich candidate data.
 *
 * Requirements: 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 5.9
 */
export default function RecommendationsStep({ squadRequestId, onCompleted }: RecommendationsStepProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/sort state
  const [sortField, setSortField] = useState<SortField>('score');
  const [filters, setFilters] = useState<FilterState>({ team: null });

  // Fetch recommendations on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);
        const response = await getRecommendations(squadRequestId);
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRecommendations();
    return () => { cancelled = true; };
  }, [squadRequestId]);

  // Extract unique teams from all candidates
  const allTeams = useMemo(() => {
    if (!data) return [];
    const teams = new Set<string>();
    data.shortlists.forEach((shortlist) => {
      shortlist.candidates.forEach((c) => {
        if (c.currentTeam) teams.add(c.currentTeam);
      });
    });
    return Array.from(teams).sort();
  }, [data]);

  // Compute average proficiency for a candidate (used for proficiency sort)
  function avgProficiency(candidate: RecommendedCandidate): number {
    if (candidate.matchedSkills.length === 0) return 0;
    const sum = candidate.matchedSkills.reduce((acc, s) => acc + s.proficiency, 0);
    return sum / candidate.matchedSkills.length;
  }

  // Apply filters and sorting to a shortlist's candidates
  function processedCandidates(shortlist: RoleShortlist): RecommendedCandidate[] {
    let candidates = [...shortlist.candidates];

    // Filter by team
    if (filters.team) {
      candidates = candidates.filter((c) => c.currentTeam === filters.team);
    }

    // Sort
    candidates.sort((a, b) => {
      switch (sortField) {
        case 'score':
          return b.matchScore - a.matchScore;
        case 'experience':
          return b.yearsExperience - a.yearsExperience;
        case 'proficiency':
          return avgProficiency(b) - avgProficiency(a);
        default:
          return 0;
      }
    });

    // Cap at 10 per role
    return candidates.slice(0, 10);
  }

  // Map API candidate to CandidateCard data shape
  function toCandidateData(candidate: RecommendedCandidate, roleName: string): CandidateData {
    return {
      candidateId: candidate.candidateId,
      name: candidate.name,
      role: roleName,
      matchScore: candidate.matchScore,
      availability: candidate.availability,
      workload: candidate.workload,
      matchedSkills: candidate.matchedSkills.map((s) => ({
        name: s.name,
        proficiency: Math.min(3, Math.max(1, Math.round(s.proficiency))) as 1 | 2 | 3,
        requiredProficiency: Math.min(3, Math.max(1, Math.round(s.requiredProficiency))) as 1 | 2 | 3,
      })),
      yearsExperience: candidate.yearsExperience,
      currentTeam: candidate.currentTeam,
      previousProjects: candidate.previousProjects,
      explanation: candidate.explanation,
    };
  }

  // Roles with gaps
  const gapRoles = useMemo(() => {
    if (!data) return [];
    return data.shortlists
      .filter((s) => s.hasGap)
      .map((s) => s.roleName);
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12" data-testid="recommendations-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="mt-4 text-sm text-gray-600">Generating recommendations…</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6" data-testid="recommendations-error">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // No data (shouldn't happen if no error)
  if (!data || data.shortlists.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500" data-testid="recommendations-empty">
        No recommendations available. Please define roles first.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="recommendations-step">
      {/* Filter/Sort Bar */}
      <FilterBar
        teams={allTeams}
        onFilterChange={setFilters}
        onSortChange={setSortField}
      />

      {/* Gap Indicator */}
      {gapRoles.length > 0 && <GapIndicator roles={gapRoles} />}

      {/* Role Shortlists */}
      {data.shortlists.map((shortlist) => {
        const candidates = processedCandidates(shortlist);

        return (
          <section key={shortlist.roleId} data-testid={`role-section-${shortlist.roleId}`}>
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              {shortlist.roleName}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({candidates.length} candidate{candidates.length !== 1 ? 's' : ''})
              </span>
            </h2>

            {candidates.length === 0 && shortlist.hasGap && (
              <p className="text-sm text-amber-600 italic">
                No suitable candidates found for this role.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.candidateId}
                  candidate={toCandidateData(candidate, shortlist.roleName)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Continue Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCompleted}
          className="w-full px-6 py-3 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          data-testid="recommendations-continue-btn"
        >
          Continue to Squad Assembly
        </button>
      </div>
    </div>
  );
}
