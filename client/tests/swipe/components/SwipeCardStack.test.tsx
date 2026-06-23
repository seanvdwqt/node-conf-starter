import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SwipeCardStack } from '../../../src/swipe/components/SwipeCardStack';
import type { SwipeCandidate } from '../../../src/swipe/types';

// Mock useSwipeGesture to avoid pointer event complexity in unit tests
vi.mock('../../../src/swipe/hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => ({
    offset: { x: 0, y: 0 },
    direction: null,
    isDragging: false,
    rotation: 0,
  }),
}));

const createCandidate = (overrides: Partial<SwipeCandidate> = {}): SwipeCandidate => ({
  id: 'c1',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  currentRole: 'engineer',
  businessUnit: 'Digital Platforms',
  capacityFree: 80,
  currentWorkload: 20,
  yearsExperience: 7,
  currentTeam: 'Team Alpha',
  skills: [
    { id: 's1', name: 'React', category: 'frontend', proficiency: 3 },
    { id: 's2', name: 'TypeScript', category: 'frontend', proficiency: 2 },
  ],
  projects: [{ id: 'p1', projectName: 'Project X', rolePlayed: 'Lead Dev' }],
  availability: 'available',
  ...overrides,
});

const mockCandidates: SwipeCandidate[] = [
  createCandidate({ id: 'c1', name: 'Alice Johnson' }),
  createCandidate({ id: 'c2', name: 'Bob Smith', currentRole: 'engineer' }),
  createCandidate({ id: 'c3', name: 'Charlie Brown', currentRole: 'engineer' }),
];

describe('SwipeCardStack', () => {
  const defaultProps = {
    candidates: mockCandidates,
    currentIndex: 0,
    onSwipeLeft: vi.fn(),
    onSwipeRight: vi.fn(),
    onSwipeDown: vi.fn(),
    onDeckEmpty: vi.fn(),
  };

  it('renders the current candidate card', () => {
    render(<SwipeCardStack {...defaultProps} />);

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('shows empty state when deck is exhausted', () => {
    render(<SwipeCardStack {...defaultProps} currentIndex={3} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No more candidates for this role')).toBeInTheDocument();
  });

  it('calls onDeckEmpty when deck is exhausted', () => {
    const onDeckEmpty = vi.fn();
    render(<SwipeCardStack {...defaultProps} currentIndex={3} onDeckEmpty={onDeckEmpty} />);

    expect(onDeckEmpty).toHaveBeenCalled();
  });

  it('fires onSwipeLeft when ArrowLeft is pressed', () => {
    const onSwipeLeft = vi.fn();
    render(<SwipeCardStack {...defaultProps} onSwipeLeft={onSwipeLeft} />);

    const stack = screen.getByTestId('swipe-card-stack');
    fireEvent.keyDown(stack, { key: 'ArrowLeft' });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('fires onSwipeRight when ArrowRight is pressed', () => {
    const onSwipeRight = vi.fn();
    render(<SwipeCardStack {...defaultProps} onSwipeRight={onSwipeRight} />);

    const stack = screen.getByTestId('swipe-card-stack');
    fireEvent.keyDown(stack, { key: 'ArrowRight' });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('fires onSwipeDown with current candidate when ArrowDown is pressed', () => {
    const onSwipeDown = vi.fn();
    render(<SwipeCardStack {...defaultProps} onSwipeDown={onSwipeDown} />);

    const stack = screen.getByTestId('swipe-card-stack');
    fireEvent.keyDown(stack, { key: 'ArrowDown' });

    expect(onSwipeDown).toHaveBeenCalledTimes(1);
    expect(onSwipeDown).toHaveBeenCalledWith(mockCandidates[0]);
  });

  it('fires onSwipeDown with current candidate when Enter is pressed', () => {
    const onSwipeDown = vi.fn();
    render(<SwipeCardStack {...defaultProps} onSwipeDown={onSwipeDown} />);

    const stack = screen.getByTestId('swipe-card-stack');
    fireEvent.keyDown(stack, { key: 'Enter' });

    expect(onSwipeDown).toHaveBeenCalledTimes(1);
    expect(onSwipeDown).toHaveBeenCalledWith(mockCandidates[0]);
  });

  it('only renders up to 2 cards at a time', () => {
    render(<SwipeCardStack {...defaultProps} />);

    const cards = screen.getAllByTestId('swipe-card');
    expect(cards.length).toBeLessThanOrEqual(2);
  });

  it('has correct ARIA attributes', () => {
    render(<SwipeCardStack {...defaultProps} />);

    const stack = screen.getByTestId('swipe-card-stack');
    expect(stack).toHaveAttribute('tabindex', '0');
    expect(stack).toHaveAttribute('role', 'application');
    expect(stack).toHaveAttribute(
      'aria-label',
      'Candidate card stack. Use arrow keys: Left to skip, Right for next, Down or Enter to add to cart.'
    );
    expect(stack).toHaveAttribute('aria-roledescription', 'swipe deck');
  });

  it('has correct ARIA attributes on empty state', () => {
    render(<SwipeCardStack {...defaultProps} currentIndex={3} />);

    const stack = screen.getByTestId('swipe-card-stack');
    expect(stack).toHaveAttribute('tabindex', '0');
    expect(stack).toHaveAttribute('role', 'application');
    expect(stack).toHaveAttribute('aria-roledescription', 'swipe deck');
  });

  it('does not fire keyboard events when deck is exhausted', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const onSwipeDown = vi.fn();
    render(
      <SwipeCardStack
        {...defaultProps}
        currentIndex={3}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        onSwipeDown={onSwipeDown}
      />
    );

    const stack = screen.getByTestId('swipe-card-stack');
    fireEvent.keyDown(stack, { key: 'ArrowLeft' });
    fireEvent.keyDown(stack, { key: 'ArrowRight' });
    fireEvent.keyDown(stack, { key: 'ArrowDown' });
    fireEvent.keyDown(stack, { key: 'Enter' });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onSwipeDown).not.toHaveBeenCalled();
  });

  it('renders peek card when there is a next candidate', () => {
    render(<SwipeCardStack {...defaultProps} currentIndex={0} />);

    // Should see both Alice (top) and Bob (peek)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('does not render peek card when on the last candidate', () => {
    render(<SwipeCardStack {...defaultProps} currentIndex={2} />);

    // Only Charlie should be visible (no next card)
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    const cards = screen.getAllByTestId('swipe-card');
    expect(cards).toHaveLength(1);
  });
});
