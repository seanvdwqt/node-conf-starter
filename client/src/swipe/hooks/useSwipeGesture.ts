/**
 * useSwipeGesture — Custom hook for cross-platform swipe gesture detection
 *
 * Uses Pointer Events API (pointerdown, pointermove, pointerup) for unified
 * touch and mouse support. Implements dead zone, velocity detection, and
 * requestAnimationFrame for smooth drag tracking.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 10.3
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SwipeCallbacks, SwipeOptions, SwipeState } from '../types';

const DEFAULT_OPTIONS: SwipeOptions = {
  threshold: 100,
  velocityThreshold: 0.5,
  preventScroll: true,
};

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isDragging: boolean;
  pointerId: number | null;
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: SwipeCallbacks,
  options?: Partial<SwipeOptions>
): SwipeState {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [swipeState, setSwipeState] = useState<SwipeState>({
    offset: { x: 0, y: 0 },
    direction: null,
    isDragging: false,
    rotation: 0,
  });

  // Track the actual DOM element so the effect re-runs when it changes
  const [trackedElement, setTrackedElement] = useState<HTMLElement | null>(null);

  // Sync ref to state on every render — this catches when ref.current goes from null to a real element
  useEffect(() => {
    const el = elementRef.current;
    if (el !== trackedElement) {
      setTrackedElement(el);
    }
  });

  // Use refs to store mutable drag state without causing re-renders
  const dragStateRef = useRef<DragState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isDragging: false,
    pointerId: null,
  });

  const rafRef = useRef<number | null>(null);
  const callbacksRef = useRef(callbacks);
  const optionsRef = useRef(mergedOptions);

  // Keep refs in sync with latest values
  callbacksRef.current = callbacks;
  optionsRef.current = mergedOptions;

  const calculateRotation = useCallback((offsetX: number): number => {
    // Rotate slightly based on horizontal offset, capped at ±15 degrees
    const rotation = offsetX * 0.1;
    return Math.max(-15, Math.min(15, rotation));
  }, []);

  const determineDirection = useCallback(
    (deltaX: number, deltaY: number): 'left' | 'right' | 'down' | null => {
      // Determine direction by dominant axis
      if (deltaY > 0 && deltaY > Math.abs(deltaX)) {
        return 'down';
      }
      if (deltaX < 0) {
        return 'left';
      }
      if (deltaX > 0) {
        return 'right';
      }
      return null;
    },
    []
  );

  const resetState = useCallback(() => {
    setSwipeState({
      offset: { x: 0, y: 0 },
      direction: null,
      isDragging: false,
      rotation: 0,
    });
  }, []);

  const updateFrame = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag.isDragging) return;

    const offsetX = drag.currentX - drag.startX;
    const offsetY = drag.currentY - drag.startY;
    const direction = determineDirection(offsetX, offsetY);
    const rotation = calculateRotation(offsetX);

    setSwipeState({
      offset: { x: offsetX, y: offsetY },
      direction,
      isDragging: true,
      rotation,
    });
  }, [determineDirection, calculateRotation]);

  useEffect(() => {
    const element = trackedElement;
    if (!element) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only handle primary button (left click / touch)
      if (e.button !== 0) return;

      const drag = dragStateRef.current;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.currentX = e.clientX;
      drag.currentY = e.clientY;
      drag.startTime = Date.now();
      drag.isDragging = true;
      drag.pointerId = e.pointerId;

      // Capture pointer for reliable tracking
      element.setPointerCapture(e.pointerId);

      setSwipeState((prev) => ({ ...prev, isDragging: true }));
    };

    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.isDragging) return;

      drag.currentX = e.clientX;
      drag.currentY = e.clientY;

      const deltaY = Math.abs(drag.currentY - drag.startY);

      // 15px dead zone: if vertical displacement < 15px, treat as scroll
      if (optionsRef.current.preventScroll && deltaY > 15) {
        e.preventDefault();
      }

      // Use requestAnimationFrame for smooth updates
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateFrame);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.isDragging) return;

      drag.isDragging = false;

      // Release pointer capture
      if (drag.pointerId !== null) {
        try {
          element.releasePointerCapture(drag.pointerId);
        } catch {
          // Pointer may already be released
        }
        drag.pointerId = null;
      }

      // Cancel any pending animation frame
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const deltaX = e.clientX - drag.startX;
      const deltaY = e.clientY - drag.startY;
      const elapsed = Date.now() - drag.startTime;

      // Avoid division by zero
      const time = Math.max(elapsed, 1);
      const velocityX = Math.abs(deltaX) / time;
      const velocityY = Math.abs(deltaY) / time;

      const { threshold, velocityThreshold } = optionsRef.current;

      let swipeDirection: 'left' | 'right' | 'down' | null = null;

      // Determine direction by dominant axis
      // Down: deltaY > 0, AND (distance OR velocity threshold met), AND deltaY > |deltaX|
      if (
        deltaY > 0 &&
        (deltaY > threshold || velocityY > velocityThreshold) &&
        deltaY > Math.abs(deltaX)
      ) {
        swipeDirection = 'down';
      }
      // Horizontal: |deltaX| > threshold OR velocityX > velocityThreshold
      else if (
        Math.abs(deltaX) > threshold ||
        velocityX > velocityThreshold
      ) {
        swipeDirection = deltaX < 0 ? 'left' : 'right';
      }

      // Fire appropriate callback
      if (swipeDirection === 'left' && callbacksRef.current.onSwipeLeft) {
        callbacksRef.current.onSwipeLeft();
      } else if (swipeDirection === 'right' && callbacksRef.current.onSwipeRight) {
        callbacksRef.current.onSwipeRight();
      } else if (swipeDirection === 'down' && callbacksRef.current.onSwipeDown) {
        callbacksRef.current.onSwipeDown();
      }

      // Reset state (snap back to original position)
      resetState();
    };

    const handlePointerCancel = () => {
      const drag = dragStateRef.current;
      drag.isDragging = false;
      drag.pointerId = null;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      resetState();
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerCancel);

    // Prevent default drag behaviour on the element
    element.style.touchAction = 'none';

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerCancel);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [trackedElement, updateFrame, resetState]);

  return swipeState;
}
