import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SwipeCard } from '../../../src/swipe/components/SwipeCard';
import type { SwipeCandidate } from '../../../src/swipe/types';

const mockCandidate: SwipeCandidate = {
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
    { id: 's2', name: 'TypeScript', category: 'frontend', proficiency: 3 },
    { id: 's3', name: 'Node.js', category: 'backend', proficiency: 2 },
    { id: 's4', name: 'CSS', category: 'frontend', proficiency: 2 },
    { id: 's5', name: 'GraphQL', category: 'backend', proficiency: 1 },
    { id: 's6', name: 'Python', category: 'backend', proficiency: 1 },
  ],
  projects: [{ id: 'p1', projectName: 'Project X', rolePlayed: 'Lead Dev' }],
  availability: 'available',
};

describe('SwipeCard', () => {
  it('renders candidate name and role', () => {
    render(<SwipeCard candidate={mockCandidate} />);

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('engineer')).toBeInTheDocument();
  });

  it('renders availability status badge', () => {
    render(<SwipeCard candidate={mockCandidate} />);

    expect(screen.getByTestId('availability-badge')).toHaveTextContent('Available');
  });

  it('renders partially_available badge correctly', () => {
    const partial: SwipeCandidate = {
      ...mockCandidate,
      availability: 'partially_available',
    };
    render(<SwipeCard candidate={partial} />);

    expect(screen.getByTestId('availability-badge')).toHaveTextContent('Partially Available');
  });

  it('renders years of experience', () => {
    render(<SwipeCard candidate={mockCandidate} />);

    expect(screen.getByTestId('years-experience')).toHaveTextContent('7 yrs experience');
  });

  it('renders current team', () => {
    render(<SwipeCard candidate={mockCandidate} />);

    expect(screen.getByTestId('current-team')).toHaveTextContent('Team Alpha');
  });

  it('shows up to 5 skills sorted by proficiency descending', () => {
    render(<SwipeCard candidate={mockCandidate} />);

    // Should show top 5 skills (React, TypeScript at 3, Node.js, CSS at 2, GraphQL at 1)
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    // 6th skill (Python) should not be shown
    expect(screen.queryByText('Python')).not.toBeInTheDocument();
  });

  it('shows fewer skills if candidate has fewer than 5', () => {
    const fewSkills: SwipeCandidate = {
      ...mockCandidate,
      skills: [
        { id: 's1', name: 'React', category: 'frontend', proficiency: 3 },
        { id: 's2', name: 'TypeScript', category: 'frontend', proficiency: 2 },
      ],
    };
    render(<SwipeCard candidate={fewSkills} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('shows skip hint overlay when isDragging and direction is left', () => {
    render(<SwipeCard candidate={mockCandidate} isDragging direction="left" />);

    expect(screen.getByTestId('hint-skip')).toBeInTheDocument();
    expect(screen.getByText('SKIP')).toBeInTheDocument();
  });

  it('shows next hint overlay when isDragging and direction is right', () => {
    render(<SwipeCard candidate={mockCandidate} isDragging direction="right" />);

    expect(screen.getByTestId('hint-next')).toBeInTheDocument();
    expect(screen.getByText('NEXT →')).toBeInTheDocument();
  });

  it('shows add hint overlay when isDragging and direction is down', () => {
    render(<SwipeCard candidate={mockCandidate} isDragging direction="down" />);

    expect(screen.getByTestId('hint-add')).toBeInTheDocument();
    expect(screen.getByText('+ ADD')).toBeInTheDocument();
  });

  it('does not show any hint overlay when not dragging', () => {
    render(<SwipeCard candidate={mockCandidate} isDragging={false} direction="left" />);

    expect(screen.queryByTestId('hint-skip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hint-next')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hint-add')).not.toBeInTheDocument();
  });

  it('does not show any hint overlay when direction is null', () => {
    render(<SwipeCard candidate={mockCandidate} isDragging direction={null} />);

    expect(screen.queryByTestId('hint-skip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hint-next')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hint-add')).not.toBeInTheDocument();
  });

  it('applies style prop to the card element', () => {
    const customStyle = { transform: 'translateX(50px) translateY(10px) rotate(5deg)' };
    render(<SwipeCard candidate={mockCandidate} style={customStyle} />);

    const card = screen.getByTestId('swipe-card');
    expect(card).toHaveStyle({ transform: 'translateX(50px) translateY(10px) rotate(5deg)' });
  });
});
