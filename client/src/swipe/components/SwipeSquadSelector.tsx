import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRoles } from '../hooks/useRoles';
import { useCandidates } from '../hooks/useCandidates';
import { useSquadCart } from '../hooks/useSquadCart';
import { filterCandidatesByRole } from '../utils';
import { RolePicker } from './RolePicker';
import { SwipeCardStack } from './SwipeCardStack';
import { SquadCart } from './SquadCart';
import { CartReview } from './CartReview';
import type { SwipeCandidate } from '../types';

/**
 * SwipeSquadSelector — Top-level container component orchestrating the
 * swipe flow for browsing and selecting team members by role.
 *
 * Manages state for the active role, candidate filtering, cart management,
 * and view transitions between swiping and cart review.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.6, 10.1, 10.2, 10.4
 */

export interface SwipeSquadSelectorProps {
  onClose: () => void;
}

export const SwipeSquadSelector: React.FC<SwipeSquadSelectorProps> = ({
  onClose,
}) => {
  const { roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { candidates, loading: candidatesLoading, error: candidatesError, refetch: refetchCandidates } = useCandidates();
  const { cart, add, remove, clear, isFull, countByRole } = useSquadCart();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [view, setView] = useState<'swipe' | 'review'>('swipe');
  const [showFullToast, setShowFullToast] = useState<boolean>(false);
  const [cardKey, setCardKey] = useState<number>(0); // triggers bounce on new card

  const loading = rolesLoading || candidatesLoading;
  const error = rolesError || candidatesError;

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!showFullToast) return;
    const timer = setTimeout(() => {
      setShowFullToast(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showFullToast]);

  // Reset currentIndex and skippedIds when role changes
  useEffect(() => {
    setCurrentIndex(0);
    setSkippedIds(new Set());
  }, [selectedRole]);

  // Compute filtered candidates: exclude cart members AND permanently skipped
  const filteredCandidates = useMemo(() => {
    if (!selectedRole) return [];
    const excludeIds = new Set([
      ...cart.map((i) => i.candidateId),
      ...skippedIds,
    ]);
    return filterCandidatesByRole(candidates, selectedRole, excludeIds);
  }, [candidates, selectedRole, cart, skippedIds]);

  // Wrap currentIndex around the deck for looping (right swipe keeps cards)
  const wrappedIndex = filteredCandidates.length > 0
    ? currentIndex % filteredCandidates.length
    : 0;

  // Reset if deck shrinks below current position
  useEffect(() => {
    if (filteredCandidates.length > 0 && currentIndex >= filteredCandidates.length) {
      setCurrentIndex(0);
    }
  }, [filteredCandidates.length, currentIndex]);

  const handleRoleSelect = useCallback((roleId: string) => {
    setSelectedRole(roleId);
  }, []);

  // Left swipe = permanently skip (remove from deck)
  const handleSwipeLeft = useCallback(() => {
    const candidate = filteredCandidates[wrappedIndex];
    if (candidate) {
      setSkippedIds((prev) => new Set([...prev, candidate.id]));
      // Deck will shrink by 1; index stays or wraps
      setCardKey((k) => k + 1);
    }
  }, [filteredCandidates, wrappedIndex]);

  // Right swipe = next (keep in deck, loop around)
  const handleSwipeRight = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setCardKey((k) => k + 1);
  }, []);

  const handleSwipeDown = useCallback(
    (candidate: SwipeCandidate) => {
      if (isFull) {
        setShowFullToast(true);
        return;
      }
      add(candidate, selectedRole!);
      // Candidate is removed from deck via cart excludeIds
      setCardKey((k) => k + 1);
    },
    [isFull, add, selectedRole]
  );

  const handleRetry = useCallback(() => {
    refetchRoles();
    refetchCandidates();
  }, [refetchRoles, refetchCandidates]);

  const handleReview = useCallback(() => {
    setView('review');
  }, []);

  const handleBackToSwiping = useCallback(() => {
    setView('swipe');
  }, []);

  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  // Loading state
  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 bg-sky-50 flex flex-col"
        data-testid="swipe-squad-selector"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="fixed inset-0 z-50 bg-sky-50 flex flex-col"
        data-testid="swipe-squad-selector"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm" role="alert">
            <p className="text-red-600 font-medium mb-2">
              Failed to load data
            </p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cart review view
  if (view === 'review') {
    return (
      <div
        className="fixed inset-0 z-50 bg-sky-50 flex flex-col"
        data-testid="swipe-squad-selector"
      >
        <CartReview
          items={cart}
          roles={roles}
          onRemove={remove}
          onDone={handleDone}
          onBack={handleBackToSwiping}
        />
      </div>
    );
  }

  // Swipe view (default)
  return (
    <div
      className="fixed inset-0 z-50 bg-sky-50 flex flex-col"
      data-testid="swipe-squad-selector"
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Swipe Squad</h1>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Role Picker */}
      <div className="px-4 py-3">
        <RolePicker
          roles={roles}
          selectedRole={selectedRole}
          onRoleSelect={handleRoleSelect}
          cartCountByRole={countByRole}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 px-4 py-2 flex items-center justify-center">
        {selectedRole === null ? (
          <p className="text-gray-500 text-center" data-testid="select-role-prompt">
            Select a role to start swiping
          </p>
        ) : (
          <SwipeCardStack
            candidates={filteredCandidates}
            currentIndex={wrappedIndex}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeDown={handleSwipeDown}
            cardKey={cardKey}
          />
        )}
      </div>

      {/* Squad Cart */}
      <SquadCart
        items={cart}
        onRemove={remove}
        onReview={handleReview}
        onClear={clear}
        showFullToast={showFullToast}
        onToastDismiss={() => setShowFullToast(false)}
      />
    </div>
  );
};
