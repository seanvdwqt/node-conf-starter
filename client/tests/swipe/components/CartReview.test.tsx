import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartReview } from '../../../src/swipe/components/CartReview';
import type { CartItem, Role } from '../../../src/swipe/types';

const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'architect',
    displayName: 'Architect',
    colour: 'purple-500',
    skills: [],
  },
  {
    id: 'role-2',
    name: 'engineer',
    displayName: 'Engineer',
    colour: 'blue-500',
    skills: [],
  },
  {
    id: 'role-3',
    name: 'tester',
    displayName: 'Tester',
    colour: 'green-500',
    skills: [],
  },
];

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    candidateId: 'candidate-1',
    candidateName: 'Alice Smith',
    role: 'engineer',
    addedAt: 1000,
    candidate: {
      id: 'candidate-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      currentRole: 'engineer',
      businessUnit: 'Digital',
      capacityFree: 80,
      currentWorkload: 20,
      yearsExperience: 5,
      currentTeam: 'Alpha',
      skills: [],
      projects: [],
      availability: 'available',
    },
    ...overrides,
  };
}

const mockItems: CartItem[] = [
  makeCartItem({
    candidateId: 'c1',
    candidateName: 'Alice Smith',
    role: 'engineer',
    addedAt: 2000,
  }),
  makeCartItem({
    candidateId: 'c2',
    candidateName: 'Bob Jones',
    role: 'architect',
    addedAt: 1000,
  }),
  makeCartItem({
    candidateId: 'c3',
    candidateName: 'Charlie Brown',
    role: 'engineer',
    addedAt: 1500,
  }),
];

describe('CartReview', () => {
  it('groups members by role alphabetically', () => {
    render(
      <CartReview
        items={mockItems}
        roles={mockRoles}
        onRemove={() => {}}
        onDone={() => {}}
        onBack={() => {}}
      />
    );

    const headings = screen.getAllByRole('heading', { level: 3 });
    const headingTexts = headings.map((h) => h.textContent);

    // Roles should be in alphabetical order: Architect, Engineer, Tester
    expect(headingTexts).toEqual(['Architect', 'Engineer', 'Tester']);
  });

  it('orders candidates within group by addedAt timestamp ascending', () => {
    render(
      <CartReview
        items={mockItems}
        roles={mockRoles}
        onRemove={() => {}}
        onDone={() => {}}
        onBack={() => {}}
      />
    );

    // Within engineer group: Charlie (addedAt: 1500) comes before Alice (addedAt: 2000)
    const listItems = screen.getAllByRole('listitem');
    const engineerItems = listItems.filter(
      (li) =>
        li.textContent?.includes('Alice Smith') ||
        li.textContent?.includes('Charlie Brown')
    );

    expect(engineerItems[0]).toHaveTextContent('Charlie Brown');
    expect(engineerItems[1]).toHaveTextContent('Alice Smith');
  });

  it('shows gap indicators for roles with no selections', () => {
    // Only engineer items, no architect or tester
    const engineerOnlyItems: CartItem[] = [
      makeCartItem({
        candidateId: 'c1',
        candidateName: 'Alice Smith',
        role: 'engineer',
        addedAt: 1000,
      }),
    ];

    render(
      <CartReview
        items={engineerOnlyItems}
        roles={mockRoles}
        onRemove={() => {}}
        onDone={() => {}}
        onBack={() => {}}
      />
    );

    // Should see gap indicators for architect and tester
    expect(screen.getByText('No Architect selected')).toBeInTheDocument();
    expect(screen.getByText('No Tester selected')).toBeInTheDocument();

    // No gap indicator for engineer since it has a selection
    expect(
      screen.queryByText('No Engineer selected')
    ).not.toBeInTheDocument();
  });

  it('calls onRemove with correct candidateId when Remove button clicked', () => {
    const onRemove = vi.fn();

    render(
      <CartReview
        items={mockItems}
        roles={mockRoles}
        onRemove={onRemove}
        onDone={() => {}}
        onBack={() => {}}
      />
    );

    const removeButton = screen.getByLabelText('Remove Bob Jones');
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('c2');
  });

  it('calls onDone when Done button is clicked', () => {
    const onDone = vi.fn();

    render(
      <CartReview
        items={mockItems}
        roles={mockRoles}
        onRemove={() => {}}
        onDone={onDone}
        onBack={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Done'));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('disables Done button when cart is empty', () => {
    render(
      <CartReview
        items={[]}
        roles={mockRoles}
        onRemove={() => {}}
        onDone={() => {}}
        onBack={() => {}}
      />
    );

    const doneButton = screen.getByText('Done');
    expect(doneButton).toBeDisabled();
  });

  it('calls onBack when Back to Swiping button is clicked', () => {
    const onBack = vi.fn();

    render(
      <CartReview
        items={mockItems}
        roles={mockRoles}
        onRemove={() => {}}
        onDone={() => {}}
        onBack={onBack}
      />
    );

    fireEvent.click(screen.getByText('Back to Swiping'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows empty state message when no items', () => {
    render(
      <CartReview
        items={[]}
        roles={mockRoles}
        onRemove={() => {}}
        onDone={() => {}}
        onBack={() => {}}
      />
    );

    expect(
      screen.getByText(
        'No candidates selected yet. Add at least one candidate to finalise.'
      )
    ).toBeInTheDocument();
  });
});
