import React, { useState } from 'react';
import type { CartItem } from '../types';

/**
 * Swipe Squad Selector — SquadCart component
 *
 * Floating cart indicator showing selected members count with expand/collapse.
 * Displays a badge with the cart count, expands to show the list of selected
 * members, allows removing individuals, and provides a "Review Squad" button.
 * Shows a toast notification when the cart is full.
 *
 * Validates: Requirements 5.1, 5.3, 5.4, 5.7, 10.2
 */

export interface SquadCartProps {
  items: CartItem[];
  onRemove: (candidateId: string) => void;
  onReview: () => void;
  onClear: () => void;
  isFull?: boolean;
  showFullToast?: boolean;
  onToastDismiss?: () => void;
}

export const SquadCart: React.FC<SquadCartProps> = ({
  items,
  onRemove,
  onReview,
  onClear,
  showFullToast = false,
  onToastDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Toast notification for full cart */}
      {showFullToast && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg"
        >
          <span className="text-sm font-medium">
            Cart full — maximum 20 members
          </span>
          {onToastDismiss && (
            <button
              type="button"
              onClick={onToastDismiss}
              className="ml-2 rounded p-1 hover:bg-red-700 transition-colors"
              aria-label="Dismiss notification"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Floating cart badge and expandable panel */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Expanded panel */}
        {isExpanded && (
          <div className="mb-3 w-72 rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                Squad Cart ({items.length}/20)
              </h3>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Member list */}
            <div className="max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">
                  No members selected
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <li
                      key={item.candidateId}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.candidateName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.role}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.candidateId)}
                        className="ml-2 rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={`Remove ${item.candidateName}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer with Review Squad button */}
            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={onReview}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Review Squad
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating badge button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
          aria-label={`Squad cart: ${items.length} members`}
          aria-expanded={isExpanded}
        >
          <span className="relative">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs font-bold">
              {items.length}
            </span>
          </span>
        </button>
      </div>
    </>
  );
};
