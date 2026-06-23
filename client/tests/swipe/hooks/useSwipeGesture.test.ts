/**
 * Unit tests for useSwipeGesture hook
 *
 * Tests cover: pointer event handling, direction detection, threshold logic,
 * velocity-based swipes, dead zone behaviour, rotation calculation, and
 * sub-threshold gesture cancellation.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 10.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeGesture } from '../../../src/swipe/hooks/useSwipeGesture';
import type { SwipeCallbacks } from '../../../src/swipe/types';

// Polyfill PointerEvent for jsdom (which doesn't support it natively)
class MockPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;

  constructor(type: string, params: PointerEventInit & { pointerId?: number; pointerType?: string } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? 'mouse';
  }
}

// @ts-expect-error - polyfill for jsdom
globalThis.PointerEvent = MockPointerEvent;

// Helper to create a mock element with pointer capture support
function createMockElement(): HTMLDivElement {
  const element = document.createElement('div');
  element.setPointerCapture = vi.fn();
  element.releasePointerCapture = vi.fn();
  return element;
}

// Helper to create a PointerEvent with given coordinates
function createPointerEvent(
  type: string,
  options: {
    clientX?: number;
    clientY?: number;
    pointerId?: number;
    button?: number;
  } = {}
): PointerEvent {
  return new PointerEvent(type, {
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    pointerId: options.pointerId ?? 1,
    button: options.button ?? 0,
    bubbles: true,
    cancelable: true,
  });
}

// Helper to simulate a full swipe gesture
function simulateSwipe(
  element: HTMLElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  duration: number = 200
) {
  const startTime = 1000;
  const dateNowSpy = vi.spyOn(Date, 'now');
  // pointerdown reads Date.now() for startTime
  dateNowSpy.mockReturnValueOnce(startTime);

  act(() => {
    element.dispatchEvent(
      createPointerEvent('pointerdown', { clientX: startX, clientY: startY })
    );
  });

  act(() => {
    element.dispatchEvent(
      createPointerEvent('pointermove', { clientX: endX, clientY: endY })
    );
  });

  // pointerup reads Date.now() for elapsed calculation
  dateNowSpy.mockReturnValueOnce(startTime + duration);

  act(() => {
    element.dispatchEvent(
      createPointerEvent('pointerup', { clientX: endX, clientY: endY })
    );
  });

  dateNowSpy.mockRestore();
}

describe('useSwipeGesture', () => {
  let element: HTMLDivElement;
  let elementRef: React.RefObject<HTMLElement>;
  let mockRaf: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    element = createMockElement();
    document.body.appendChild(element);
    elementRef = { current: element } as React.RefObject<HTMLElement>;

    // Mock requestAnimationFrame to execute immediately
    mockRaf = vi.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', mockRaf);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return default SwipeState', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      expect(result.current).toEqual({
        offset: { x: 0, y: 0 },
        direction: null,
        isDragging: false,
        rotation: 0,
      });
    });
  });

  describe('drag state tracking', () => {
    it('should set isDragging to true on pointerdown', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should update offset during pointermove', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointermove', { clientX: 150, clientY: 120 })
        );
      });

      expect(result.current.offset.x).toBe(50);
      expect(result.current.offset.y).toBe(20);
    });

    it('should call setPointerCapture on pointerdown', () => {
      const callbacks: SwipeCallbacks = {};
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 0, clientY: 0 })
        );
      });

      expect(element.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('should call releasePointerCapture on pointerup', () => {
      const callbacks: SwipeCallbacks = {};
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 0, clientY: 0 })
        );
      });

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerup', { clientX: 0, clientY: 0 })
        );
      });

      expect(element.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it('should ignore non-primary button presses', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', {
            clientX: 100,
            clientY: 100,
            button: 2, // right-click
          })
        );
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('swipe direction detection (Req 4.5)', () => {
    it('should detect left swipe when deltaX < 0 and exceeds threshold', () => {
      const onSwipeLeft = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeLeft };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      simulateSwipe(element, 200, 100, 50, 100); // -150px horizontal

      expect(onSwipeLeft).toHaveBeenCalledOnce();
    });

    it('should detect right swipe when deltaX > 0 and exceeds threshold', () => {
      const onSwipeRight = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeRight };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      simulateSwipe(element, 50, 100, 200, 100); // +150px horizontal

      expect(onSwipeRight).toHaveBeenCalledOnce();
    });

    it('should detect down swipe when deltaY > 0, exceeds threshold, and deltaY > |deltaX|', () => {
      const onSwipeDown = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeDown };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      simulateSwipe(element, 100, 50, 110, 200); // +150px vertical, +10px horizontal

      expect(onSwipeDown).toHaveBeenCalledOnce();
    });

    it('should prioritize down when vertical displacement dominates', () => {
      const onSwipeDown = vi.fn();
      const onSwipeRight = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeDown, onSwipeRight };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      simulateSwipe(element, 100, 50, 140, 200); // deltaY=150 > deltaX=40

      expect(onSwipeDown).toHaveBeenCalledOnce();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should prioritize horizontal when horizontal displacement dominates', () => {
      const onSwipeDown = vi.fn();
      const onSwipeRight = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeDown, onSwipeRight };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      simulateSwipe(element, 50, 100, 200, 140); // deltaX=150 > deltaY=40

      expect(onSwipeRight).toHaveBeenCalledOnce();
      expect(onSwipeDown).not.toHaveBeenCalled();
    });
  });

  describe('threshold handling (Req 4.4)', () => {
    it('should not fire callback when distance is below threshold', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const onSwipeDown = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeLeft, onSwipeRight, onSwipeDown };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      // Move only 50px (below default 100px threshold) with low velocity
      // We need to ensure elapsed time is large so velocity is low
      // 50px / 5000ms = 0.01 px/ms (well below 0.5 threshold)
      const dateNowSpy = vi.spyOn(Date, 'now');
      dateNowSpy.mockReturnValue(1000);

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointermove', { clientX: 150, clientY: 100 })
        );
      });

      dateNowSpy.mockReturnValue(6000); // 5000ms elapsed

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerup', { clientX: 150, clientY: 100 })
        );
      });

      dateNowSpy.mockRestore();

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(onSwipeDown).not.toHaveBeenCalled();
    });

    it('should reset offset to {0, 0} on sub-threshold gesture', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      simulateSwipe(element, 100, 100, 130, 100, 1000); // 30px, slow

      expect(result.current.offset).toEqual({ x: 0, y: 0 });
      expect(result.current.isDragging).toBe(false);
      expect(result.current.direction).toBeNull();
    });

    it('should support custom threshold value', () => {
      const onSwipeRight = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeRight };
      renderHook(() =>
        useSwipeGesture(elementRef, callbacks, { threshold: 50 })
      );

      // Move 60px (above custom 50px threshold) but slow velocity
      simulateSwipe(element, 100, 100, 160, 100, 500);

      expect(onSwipeRight).toHaveBeenCalledOnce();
    });
  });

  describe('velocity-based swipe detection (Req 4.7)', () => {
    it('should trigger swipe on high velocity even below distance threshold', () => {
      const onSwipeRight = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeRight };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      // Move only 60px but very fast (60px in 50ms = 1.2 px/ms > 0.5 threshold)
      simulateSwipe(element, 100, 100, 160, 100, 50);

      expect(onSwipeRight).toHaveBeenCalledOnce();
    });

    it('should trigger left swipe on high velocity leftward', () => {
      const onSwipeLeft = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeLeft };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      // Move -60px fast (60px in 50ms = 1.2 px/ms)
      simulateSwipe(element, 160, 100, 100, 100, 50);

      expect(onSwipeLeft).toHaveBeenCalledOnce();
    });

    it('should trigger down swipe on high vertical velocity', () => {
      const onSwipeDown = vi.fn();
      const callbacks: SwipeCallbacks = { onSwipeDown };
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      // Move +60px down fast (60px in 50ms = 1.2 px/ms), dominant vertical
      simulateSwipe(element, 100, 100, 105, 160, 50);

      expect(onSwipeDown).toHaveBeenCalledOnce();
    });
  });

  describe('dead zone (Req 10.3)', () => {
    it('should not prevent default within 15px vertical dead zone', () => {
      const callbacks: SwipeCallbacks = {};
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      const moveEvent = createPointerEvent('pointermove', {
        clientX: 100,
        clientY: 110, // only 10px vertical — within dead zone
      });
      const preventDefaultSpy = vi.spyOn(moveEvent, 'preventDefault');

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should call preventDefault beyond 15px vertical displacement', () => {
      const callbacks: SwipeCallbacks = {};
      renderHook(() =>
        useSwipeGesture(elementRef, callbacks, { preventScroll: true })
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      const moveEvent = createPointerEvent('pointermove', {
        clientX: 100,
        clientY: 120, // 20px vertical — beyond dead zone
      });
      const preventDefaultSpy = vi.spyOn(moveEvent, 'preventDefault');

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call preventDefault when preventScroll is false', () => {
      const callbacks: SwipeCallbacks = {};
      renderHook(() =>
        useSwipeGesture(elementRef, callbacks, { preventScroll: false })
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      const moveEvent = createPointerEvent('pointermove', {
        clientX: 100,
        clientY: 130, // beyond dead zone but preventScroll is false
      });
      const preventDefaultSpy = vi.spyOn(moveEvent, 'preventDefault');

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('rotation calculation', () => {
    it('should calculate rotation based on horizontal offset', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointermove', { clientX: 150, clientY: 100 })
        );
      });

      // 50px * 0.1 = 5 degrees
      expect(result.current.rotation).toBe(5);
    });

    it('should cap rotation at ±15 degrees', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointermove', { clientX: 400, clientY: 100 })
        );
      });

      // 300px * 0.1 = 30, but capped at 15
      expect(result.current.rotation).toBe(15);
    });

    it('should apply negative rotation for leftward offset', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 200, clientY: 100 })
        );
      });

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointermove', { clientX: 100, clientY: 100 })
        );
      });

      // -100px * 0.1 = -10 degrees
      expect(result.current.rotation).toBe(-10);
    });
  });

  describe('cleanup and edge cases', () => {
    it('should reset state on pointercancel', () => {
      const callbacks: SwipeCallbacks = {};
      const { result } = renderHook(() =>
        useSwipeGesture(elementRef, callbacks)
      );

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
        );
      });

      act(() => {
        element.dispatchEvent(
          createPointerEvent('pointermove', { clientX: 200, clientY: 100 })
        );
      });

      act(() => {
        element.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.offset).toEqual({ x: 0, y: 0 });
    });

    it('should not fire callbacks if no matching callback is provided', () => {
      const callbacks: SwipeCallbacks = {}; // no callbacks
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      // Should not throw
      simulateSwipe(element, 200, 100, 50, 100);
    });

    it('should set touch-action to none on element', () => {
      const callbacks: SwipeCallbacks = {};
      renderHook(() => useSwipeGesture(elementRef, callbacks));

      expect(element.style.touchAction).toBe('none');
    });
  });
});
