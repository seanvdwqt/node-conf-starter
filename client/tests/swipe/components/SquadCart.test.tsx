import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SquadCart } from '../../../src/swipe/components/SquadCart';
import type { CartItem, SwipeCandidate } from '../../../src/swipe/types';

function makeCandidate(overrides: Partial<SwipeCandidate> = {}): SwipeCandidate {
  return {
    id: 'c-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    currentRole: 'engineer',
    businessUnit: 'Digital',
    capacityFree: 80,
    currentWorkload: 20,
    yearsExperience: 5,
    currentTeam: 'Platform',
    skills: [],
    projects: [],
    availability: 'available',
    ...overrides,
  };
}

function makeCartItems(count: number): CartItem[] {
  return Array.from({ length: count }, (_, i) => ({
    candidateId: `c-${i + 1}`,
    candidateName: `Candidate ${i + 1}`,
    role: i % 2 === 0 ? 'engineer' : 'tester',
    addedAt: Date.now() + i,
    candidate: makeCandidate({ id: `c-${i + 1}`, name: `Candidate ${i + 1}` }),
  }));
}

describe('SquadCart', () => {
  const defaultProps = {
    items: [] as CartItem[],
    onRemove: vi.fn(),
    onReview: vi.fn(),
    onClear: vi.fn(),
  };

  it('shows cart count badge with item count', () => {
    const items = makeCartItems(3);
    render(<SquadCart {...defaultProps} items={items} />);

    const badge = screen.getByLabelText('Squad cart: 3 members');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows cart count badge with 0 when empty', () => {
    render(<SquadCart {...defaultProps} items={[]} />);

    const badge = screen.getByLabelText('Squad cart: 0 members');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('expands on click to show members list', () => {
    const items = makeCartItems(2);
    render(<SquadCart {...defaultProps} items={items} />);

    // Panel not visible initially
    expect(screen.queryByText('Squad Cart (2/20)')).not.toBeInTheDocument();

    // Click badge to expand
    fireEvent.click(screen.getByLabelText('Squad cart: 2 members'));

    // Panel should now be visible
    expect(screen.getByText('Squad Cart (2/20)')).toBeInTheDocument();
  });

  it('each member shows name and role', () => {
    const items: CartItem[] = [
      {
        candidateId: 'c-1',
        candidateName: 'Alice Smith',
        role: 'engineer',
        addedAt: Date.now(),
        candidate: makeCandidate({ id: 'c-1', name: 'Alice Smith' }),
      },
      {
        candidateId: 'c-2',
        candidateName: 'Bob Jones',
        role: 'tester',
        addedAt: Date.now() + 1,
        candidate: makeCandidate({ id: 'c-2', name: 'Bob Jones' }),
      },
    ];

    render(<SquadCart {...defaultProps} items={items} />);

    // Expand cart
    fireEvent.click(screen.getByLabelText('Squad cart: 2 members'));

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('engineer')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('tester')).toBeInTheDocument();
  });

  it('remove button calls onRemove with correct candidateId', () => {
    const onRemove = vi.fn();
    const items: CartItem[] = [
      {
        candidateId: 'c-42',
        candidateName: 'Charlie Brown',
        role: 'architect',
        addedAt: Date.now(),
        candidate: makeCandidate({ id: 'c-42', name: 'Charlie Brown' }),
      },
    ];

    render(<SquadCart {...defaultProps} items={items} onRemove={onRemove} />);

    // Expand cart
    fireEvent.click(screen.getByLabelText('Squad cart: 1 members'));

    // Click remove button
    fireEvent.click(screen.getByLabelText('Remove Charlie Brown'));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('c-42');
  });

  it('"Review Squad" button calls onReview', () => {
    const onReview = vi.fn();
    const items = makeCartItems(2);

    render(<SquadCart {...defaultProps} items={items} onReview={onReview} />);

    // Expand cart
    fireEvent.click(screen.getByLabelText('Squad cart: 2 members'));

    // Click Review Squad
    fireEvent.click(screen.getByText('Review Squad'));

    expect(onReview).toHaveBeenCalledTimes(1);
  });

  it('shows full cart toast when showFullToast is true', () => {
    const items = makeCartItems(20);

    render(
      <SquadCart {...defaultProps} items={items} showFullToast={true} />
    );

    expect(
      screen.getByText('Cart full — maximum 20 members')
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('hides toast when showFullToast is false', () => {
    const items = makeCartItems(20);

    render(
      <SquadCart {...defaultProps} items={items} showFullToast={false} />
    );

    expect(
      screen.queryByText('Cart full — maximum 20 members')
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toast dismiss button calls onToastDismiss', () => {
    const onToastDismiss = vi.fn();
    const items = makeCartItems(20);

    render(
      <SquadCart
        {...defaultProps}
        items={items}
        showFullToast={true}
        onToastDismiss={onToastDismiss}
      />
    );

    fireEvent.click(screen.getByLabelText('Dismiss notification'));

    expect(onToastDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show "Review Squad" button when cart is empty', () => {
    render(<SquadCart {...defaultProps} items={[]} />);

    // Expand cart
    fireEvent.click(screen.getByLabelText('Squad cart: 0 members'));

    expect(screen.queryByText('Review Squad')).not.toBeInTheDocument();
    expect(screen.getByText('No members selected')).toBeInTheDocument();
  });

  it('collapses when badge is clicked again', () => {
    const items = makeCartItems(1);
    render(<SquadCart {...defaultProps} items={items} />);

    const badge = screen.getByLabelText('Squad cart: 1 members');

    // Expand
    fireEvent.click(badge);
    expect(screen.getByText('Squad Cart (1/20)')).toBeInTheDocument();

    // Collapse
    fireEvent.click(badge);
    expect(screen.queryByText('Squad Cart (1/20)')).not.toBeInTheDocument();
  });
});
