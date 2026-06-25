import React, { useEffect, useState, useCallback } from 'react';
import {
  getRecommendations,
  saveSquad,
  RecommendationResponse,
  RoleShortlist,
  RecommendedCandidate,
  SquadSelectionPayload,
  ApiError,
} from '../../api/squadRequests';
import { CandidateCard, CandidateData } from '../ui/CandidateCard';
import { GapIndicator } from '../ui/GapIndicator';

export interface AssembleSquadStepProps {
  squadRequestId: string;
  onCompleted: (selections: Array<{ roleId: string; candidateIds: string[] }>) => void;
  onError?: (message: string) => void;
}

/** Maximum total candidates that can be selected across all roles. */
const MAX_SELECTIONS = 20;

/** Map a RecommendedCandidate to the CandidateData shape expected by CandidateCard. */
function toCandidateCardData(candidate: RecommendedCandidate, roleName: string): CandidateData {
  return {
    candidateId: candidate.candidateId,
    name: candidate.name,
    role: roleName,
    matchScore: candidate.matchScore,
    availability: candidate.availability,
    workload: candidate.workload,
    matchedSkills: candidate.matchedSkills.map((s) => ({
      name: s.name,
      proficiency: s.proficiency as 1 | 2 | 3,
      requiredProficiency: s.requiredProficiency as 1 | 2 | 3,
    })),
    yearsExperience: candidate.yearsExperience,
    currentTeam: candidate.currentTeam,
    previousProjects: candidate.previousProjects,
    explanation: candidate.explanation,
  };
}

/**
 * Step 4: Assemble Squad
 *
 * Displays recommended candidates grouped by role. The Delivery Lead selects
 * candidates to form a proposed squad. Warnings are shown for partially_available
 * or high-workload candidates. Missing mandatory roles are surfaced via GapIndicator.
 * Advancing is blocked until every role has at least one selection.
 */
export const AssembleSquadStep: React.FC<AssembleSquadStepProps> = ({
  squadRequestId,
  onCompleted,
  onError,
}) => {
  const [shortlists, setShortlists] = useState<RoleShortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Tracks selected candidates: Map<roleId, Set<candidateId>>
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});

  // Warning modal state
  const [warningCandidate, setWarningCandidate] = useState<{
    candidate: RecommendedCandidate;
    roleId: string;
    reasons: string[];
  } | null>(null);

  // Fetch recommendations on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);
        const response: RecommendationResponse = await getRecommendations(squadRequestId);
        if (!cancelled) {
          setShortlists(response.shortlists);
          // Initialise empty selections for each role
          const initial: Record<string, Set<string>> = {};
          for (const shortlist of response.shortlists) {
            initial[shortlist.roleId] = new Set();
          }
          setSelections(initial);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'An unexpected error occurred. Please try again.';
          setError(message);
          if (onError && !(err instanceof ApiError)) {
            onError(message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [squadRequestId]);

  /** Count total selected candidates across all roles. */
  const totalSelected = Object.values(selections).reduce((sum, set) => sum + set.size, 0);

  /** Determine which roles are still missing a selection. */
  const missingRoles: string[] = shortlists
    .filter((s) => !s.hasGap && (!selections[s.roleId] || selections[s.roleId].size === 0))
    .map((s) => s.roleName);

  /** Whether the form can be submitted. */
  const canSubmit = missingRoles.length === 0 && totalSelected > 0;

  /** Check if a candidate requires a warning before selection. */
  const getWarningReasons = (candidate: RecommendedCandidate): string[] => {
    const reasons: string[] = [];
    if (candidate.availability === 'partially_available') {
      reasons.push('This candidate is only partially available during the delivery period.');
    }
    if (candidate.workload === 'high') {
      reasons.push('This candidate currently has a high workload.');
    }
    return reasons;
  };

  /** Handle toggling a candidate selection. */
  const handleToggleCandidate = useCallback(
    (roleId: string, candidate: RecommendedCandidate) => {
      const roleSelections = selections[roleId] ?? new Set<string>();
      const isCurrentlySelected = roleSelections.has(candidate.candidateId);

      if (isCurrentlySelected) {
        // Deselect — no warning needed
        setSelections((prev) => {
          const updated = new Set(prev[roleId]);
          updated.delete(candidate.candidateId);
          return { ...prev, [roleId]: updated };
        });
        return;
      }

      // Check max selections
      if (totalSelected >= MAX_SELECTIONS) {
        return; // Silently prevent — button should be disabled
      }

      // Check for warnings
      const reasons = getWarningReasons(candidate);
      if (reasons.length > 0) {
        setWarningCandidate({ candidate, roleId, reasons });
        return;
      }

      // Select directly — no warnings
      setSelections((prev) => {
        const updated = new Set(prev[roleId]);
        updated.add(candidate.candidateId);
        return { ...prev, [roleId]: updated };
      });
    },
    [selections, totalSelected],
  );

  /** Confirm selection after warning acknowledgment. */
  const confirmWarningSelection = useCallback(() => {
    if (!warningCandidate) return;
    const { roleId, candidate } = warningCandidate;
    setSelections((prev) => {
      const updated = new Set(prev[roleId]);
      updated.add(candidate.candidateId);
      return { ...prev, [roleId]: updated };
    });
    setWarningCandidate(null);
  }, [warningCandidate]);

  /** Dismiss warning without selecting. */
  const dismissWarning = useCallback(() => {
    setWarningCandidate(null);
  }, []);

  /** Submit the squad selections. */
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: SquadSelectionPayload[] = [];
      for (const [roleId, candidateIds] of Object.entries(selections)) {
        for (const candidateId of candidateIds) {
          payload.push({ roleId, candidateId });
        }
      }
      await saveSquad(squadRequestId, payload);

      // Build role selections to pass to the wizard state
      const roleSelections = Object.entries(selections).map(([roleId, candidateIds]) => ({
        roleId,
        candidateIds: Array.from(candidateIds),
      }));
      onCompleted(roleSelections);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setError(message);
      if (onError && !(err instanceof ApiError)) {
        onError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, selections, squadRequestId, onCompleted, onError]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500" data-testid="assemble-squad-loading">
        <p>Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="assemble-squad-step">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Assemble Squad</h2>
      <p className="text-sm text-gray-500 mb-4">
        Select candidates for each role to form your proposed squad. You can select up to{' '}
        {MAX_SELECTIONS} candidates total.
      </p>

      {/* Selection counter */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`text-sm font-medium ${
            totalSelected >= MAX_SELECTIONS ? 'text-red-600' : 'text-gray-600'
          }`}
          data-testid="selection-counter"
        >
          {totalSelected} / {MAX_SELECTIONS} selected
        </span>
        {totalSelected >= MAX_SELECTIONS && (
          <span className="text-xs text-red-500">Maximum reached</span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
          data-testid="assemble-squad-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Missing roles indicator */}
      {missingRoles.length > 0 && (
        <div className="mb-6" data-testid="missing-roles-indicator">
          <GapIndicator roles={missingRoles} />
        </div>
      )}

      {/* Role shortlists */}
      <div className="space-y-8">
        {shortlists.map((shortlist) => (
          <RoleSection
            key={shortlist.roleId}
            shortlist={shortlist}
            selectedIds={selections[shortlist.roleId] ?? new Set()}
            totalSelected={totalSelected}
            onToggle={handleToggleCandidate}
          />
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="assemble-squad-submit"
        >
          {submitting ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>

      {/* Warning modal */}
      {warningCandidate && (
        <WarningModal
          candidateName={warningCandidate.candidate.name}
          reasons={warningCandidate.reasons}
          onConfirm={confirmWarningSelection}
          onDismiss={dismissWarning}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RoleSectionProps {
  shortlist: RoleShortlist;
  selectedIds: Set<string>;
  totalSelected: number;
  onToggle: (roleId: string, candidate: RecommendedCandidate) => void;
}

/** Section displaying candidates for a single role with selection checkboxes. */
function RoleSection({ shortlist, selectedIds, totalSelected, onToggle }: RoleSectionProps) {
  const { roleId, roleName, candidates, hasGap } = shortlist;

  if (hasGap || candidates.length === 0) {
    return (
      <div data-testid={`role-section-${roleId}`}>
        <h3 className="text-lg font-medium text-gray-700 capitalize mb-2">{roleName}</h3>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm">
          No suitable candidates found for this role.
        </div>
      </div>
    );
  }

  return (
    <div data-testid={`role-section-${roleId}`}>
      <h3 className="text-lg font-medium text-gray-700 capitalize mb-3">
        {roleName}
        <span className="ml-2 text-sm font-normal text-gray-400">
          ({selectedIds.size} selected)
        </span>
      </h3>
      <div className="grid gap-3">
        {candidates.map((candidate) => {
          const isSelected = selectedIds.has(candidate.candidateId);
          const atMax = totalSelected >= MAX_SELECTIONS && !isSelected;

          return (
            <div
              key={candidate.candidateId}
              className={`relative rounded-lg border-2 transition-colors ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-50/30'
                  : 'border-transparent'
              }`}
              data-testid={`candidate-item-${candidate.candidateId}`}
            >
              <div className="flex items-start gap-3 p-2">
                {/* Selection checkbox */}
                <div className="pt-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={atMax}
                    onChange={() => onToggle(roleId, candidate)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    aria-label={`Select ${candidate.name} for ${roleName}`}
                    data-testid={`select-candidate-${candidate.candidateId}`}
                  />
                </div>
                {/* Candidate card */}
                <div className="flex-1 min-w-0">
                  <CandidateCard candidate={toCandidateCardData(candidate, roleName)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WarningModalProps {
  candidateName: string;
  reasons: string[];
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Warning modal shown when selecting a partially_available or high-workload candidate. */
function WarningModal({ candidateName, reasons, onConfirm, onDismiss }: WarningModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="warning-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warning-modal-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3
          id="warning-modal-title"
          className="text-lg font-semibold text-amber-800 mb-3"
        >
          Selection Warning
        </h3>
        <p className="text-sm text-gray-700 mb-2">
          You are selecting <span className="font-medium">{candidateName}</span>:
        </p>
        <ul className="mb-4 space-y-1">
          {reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {reason}
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500 mb-4">
          Do you still want to add this candidate to your squad?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            data-testid="warning-dismiss-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            data-testid="warning-confirm-btn"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssembleSquadStep;
