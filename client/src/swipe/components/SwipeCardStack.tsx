import React, { useRef, useCallback, useEffect } from 'react';
import type { SwipeCandidate } from '../types';
import { SwipeCard } from './SwipeCard';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

export interface SwipeCardStackProps {
  candidates: SwipeCandidate[];
  currentIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: (candidate: SwipeCandidate) => void;
  onDeckEmpty?: () => void;
  cardKey?: number;
}

/**
 * SwipeCardStack — Manages the deck of candidate cards and handles
 * swipe gesture detection and keyboard navigation.
 *
 * Renders only the top 2 cards in DOM (current + peek behind).
 * Integrates useSwipeGesture for touch/mouse gesture detection.
 *
 * Validates: Requirements 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.3, 8.1, 8.2, 8.3, 8.4
 */
export const SwipeCardStack: React.FC<SwipeCardStackProps> = ({
  candidates,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  onDeckEmpty,
  cardKey = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topCardRef = useRef<HTMLDivElement>(null);

  const isDeckExhausted = candidates.length === 0;

  // Notify parent when deck is exhausted
  useEffect(() => {
    if (isDeckExhausted && onDeckEmpty) {
      onDeckEmpty();
    }
  }, [isDeckExhausted, onDeckEmpty]);

  const currentCandidate = isDeckExhausted ? null : candidates[currentIndex];
  const nextCandidate =
    candidates.length > 1
      ? candidates[(currentIndex + 1) % candidates.length]
      : null;

  const handleSwipeDown = useCallback(() => {
    if (currentCandidate) {
      onSwipeDown(currentCandidate);
    }
  }, [currentCandidate, onSwipeDown]);

  const swipeState = useSwipeGesture(
    topCardRef,
    {
      onSwipeLeft,
      onSwipeRight,
      onSwipeDown: handleSwipeDown,
    },
    { threshold: 100, velocityThreshold: 0.5, preventScroll: true }
  );

  const retainFocus = useCallback(() => {
    // Use setTimeout to ensure focus is retained after React re-render
    setTimeout(() => {
      containerRef.current?.focus();
    }, 0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isDeckExhausted || !currentCandidate) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onSwipeLeft();
          retainFocus();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSwipeRight();
          retainFocus();
          break;
        case 'ArrowDown':
        case 'Enter':
          e.preventDefault();
          onSwipeDown(currentCandidate);
          retainFocus();
          break;
      }
    },
    [isDeckExhausted, currentCandidate, onSwipeLeft, onSwipeRight, onSwipeDown, retainFocus]
  );

  // Build transform style for the top card based on swipe state
  const topCardStyle: React.CSSProperties = {
    transform: `translateX(${swipeState.offset.x}px) translateY(${swipeState.offset.y}px) rotate(${swipeState.rotation}deg)`,
    transition: swipeState.isDragging ? 'none' : 'transform 0.3s ease-out',
    zIndex: 2,
  };

  // Peek card style — slightly scaled down and shifted back
  const peekCardStyle: React.CSSProperties = {
    transform: 'scale(0.95) translateY(8px)',
    zIndex: 1,
    opacity: 0.7,
  };

  if (isDeckExhausted) {
    return (
      <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Candidate card stack. Use arrow keys: Left to skip, Right for next, Down or Enter to add to cart."
        aria-roledescription="swipe deck"
        onKeyDown={handleKeyDown}
        data-testid="swipe-card-stack"
        className="relative w-full h-72 sm:h-80 md:h-96 max-w-sm sm:max-w-md md:max-w-lg mx-auto flex items-center justify-center"
      >
        <p className="text-gray-500 text-center" data-testid="empty-state">
          No more candidates for this role
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="application"
      aria-label="Candidate card stack. Use arrow keys: Left to skip, Right for next, Down or Enter to add to cart."
      aria-roledescription="swipe deck"
      onKeyDown={handleKeyDown}
      data-testid="swipe-card-stack"
      className="relative w-full h-72 sm:h-80 md:h-96 max-w-sm sm:max-w-md md:max-w-lg mx-auto focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 rounded-xl"
    >
      {/* Peek card (next card behind) */}
      {nextCandidate && (
        <SwipeCard candidate={nextCandidate} style={peekCardStyle} />
      )}

      {/* Top card (current candidate) */}
      {currentCandidate && (
        <div
          ref={topCardRef}
          className="absolute inset-0"
          style={{ zIndex: 2 }}
        >
          <div
            key={cardKey}
            className="absolute inset-0 animate-[bounce-in_0.3s_ease-out]"
          >
            <SwipeCard
              candidate={currentCandidate}
              style={topCardStyle}
              isDragging={swipeState.isDragging}
              direction={swipeState.direction}
            />
          </div>
        </div>
      )}
    </div>
  );
};
