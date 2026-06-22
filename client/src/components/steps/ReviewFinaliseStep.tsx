import React, { useEffect, useState, useCallback } from 'react';
import {
  finaliseRequest,
  getRecommendations,
  RecommendationResponse,
  RoleShortlist,
  RecommendedCandidate,
  ApiError,
  FinaliseResponse,
} from '../../api/squadRequests';
import { ScoreBadge } from '../ui/ScoreBadge';
import { GapIndicator } from '../ui/GapIndicator';

export interface ReviewFinaliseStepProps {
  squadRequestId: string;
  onFinalised: () => void;
  onReset: () => void;
  onBack: () => void;
}

/**
 * Step 5: Review & Finalise
 *
 * Displays a full summary of the squad assembly: request details, selected candidates
 * with their scores and explanations, and any remaining coverage gaps. The Delivery Lead
 * can navigate back to modify selections, reset all selections, or finalise the request.
 */
export const ReviewFinaliseStep: React.FC<ReviewFinaliseStepProps> = ({
  squadRequestId,
  onFinalised,
  onReset,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlists, setShortlists] = useState<RoleShortlist[]>([]);
  const [finalising, setFinalising] = useState(false);
  const [finalised, setFinalised] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');

  // Fetch current squad state (recommendations with selections) on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSquadState() {
      try {
        setLoading(true);
        setError(null);
        const response: RecommendationResponse = await getRecommendations(squadRequestId);
        if (!cancelled) {
          setShortlists(response.shortlists);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load squad summary. Please try again.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSquadState();
    return () => {
      cancelled = true;
    };
  }, [squadRequestId]);

  /** Identify roles with coverage gaps (no candidates or hasGap). */
  const gapRoles: string[] = shortlists
    .filter((s) => s.hasGap || s.candidates.length === 0)
    .map((s) => s.roleName);

  /** Handle finalisation. */
  const handleFinalise = useCallback(async () => {
    setFinalising(true);
    setError(null);
    try {
      const response: FinaliseResponse = await finaliseRequest(squadRequestId);
      setFinalised(true);
      setConfirmationMessage(
        response.message || 'Squad assembly has been finalised successfully.',
      );
      onFinalised();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to finalise the squad request. Please try again.',
      );
    } finally {
      setFinalising(false);
    }
  }, [squadRequestId, onFinalised]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500" data-testid="review-loading">
        <p>Loading squad summary...</p>
      </div>
    );
  }

  // Success state after finalisation
  if (finalised) {
    return (
      <div className="p-6 text-center" data-testid="review-finalised">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Squad Assembly Complete</h2>
        <p className="text-gray-600" data-testid="confirmation-message">
          {confirmationMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="review-finalise-step">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Review & Finalise</h2>
      <p className="text-sm text-gray-500 mb-6">
        Review your squad selections below. You can go back to modify candidates, reset all
        selections, or finalise the squad request.
      </p>

      {/* Error banner */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
          data-testid="review-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Coverage gaps */}
      {gapRoles.length > 0 && (
        <div className="mb-6" data-testid="review-gaps">
          <GapIndicator roles={gapRoles} />
        </div>
      )}

      {/* Role summaries */}
      <div className="space-y-6 mb-8">
        {shortlists
          .filter((s) => !s.hasGap && s.candidates.length > 0)
          .map((shortlist) => (
            <RoleSummarySection key={shortlist.roleId} shortlist={shortlist} />
          ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            data-testid="review-back-btn"
          >
            ← Back to Modify
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            data-testid="review-reset-btn"
          >
            Reset Selections
          </button>
        </div>
        <button
          type="button"
          onClick={handleFinalise}
          disabled={finalising}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="review-finalise-btn"
        >
          {finalising ? 'Finalising...' : 'Finalise Squad'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RoleSummarySectionProps {
  shortlist: RoleShortlist;
}

/** Displays selected candidates for a single role in the review summary. */
function RoleSummarySection({ shortlist }: RoleSummarySectionProps) {
  const { roleName, candidates } = shortlist;

  return (
    <div data-testid={`review-role-${shortlist.roleId}`}>
      <h3 className="text-lg font-medium text-gray-700 capitalize mb-3">{roleName}</h3>
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <CandidateSummaryCard key={candidate.candidateId} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}

interface CandidateSummaryCardProps {
  candidate: RecommendedCandidate;
}

/** Compact candidate summary for the review step showing name, score, and explanation. */
function CandidateSummaryCard({ candidate }: CandidateSummaryCardProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      data-testid={`review-candidate-${candidate.candidateId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{candidate.name}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>{candidate.yearsExperience} yrs experience</span>
            <span className="text-gray-300">|</span>
            <span>{candidate.currentTeam}</span>
            <span className="text-gray-300">|</span>
            <span
              className={`capitalize ${
                candidate.availability === 'available'
                  ? 'text-green-600'
                  : candidate.availability === 'partially_available'
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            >
              {candidate.availability.replace('_', ' ')}
            </span>
            {candidate.workload === 'high' && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-orange-600 font-medium">High workload</span>
              </>
            )}
          </div>
        </div>
        <ScoreBadge score={candidate.matchScore} />
      </div>

      {/* Matched skills */}
      {candidate.matchedSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {candidate.matchedSkills.map((skill) => (
            <span
              key={skill.name}
              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            >
              {skill.name}
              <span className="ml-1 text-gray-400">({skill.proficiency}/{skill.requiredProficiency})</span>
            </span>
          ))}
        </div>
      )}

      {/* Explanation */}
      {candidate.explanation && (
        <p className="mt-2 text-xs leading-relaxed text-gray-600 italic">
          {candidate.explanation}
        </p>
      )}
    </div>
  );
}

export default ReviewFinaliseStep;
