import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  TeamSuggestionCard,
  TeamSuggestion,
} from '../src/components/ui/TeamSuggestionCard';

const mockSuggestion: TeamSuggestion = {
  teamScore: 82,
  explanation: 'Strong React and testing coverage with high availability',
  members: [
    {
      candidateId: 'c1',
      name: 'Alice Johnson',
      role: 'Engineer',
      matchScore: 88,
      matchedSkills: [
        { name: 'React', proficiency: 3 },
        { name: 'TypeScript', proficiency: 2 },
      ],
      availability: 'available',
      yearsExperience: 7,
      currentTeam: 'Platform',
    },
    {
      candidateId: 'c2',
      name: 'Bob Smith',
      role: 'Tester',
      matchScore: 76,
      matchedSkills: [{ name: 'Playwright', proficiency: 2 }],
      availability: 'partially_available',
      yearsExperience: 4,
      currentTeam: 'QA Guild',
    },
  ],
};

describe('TeamSuggestionCard', () => {
  it('renders the combined team score', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders the explanation text', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    expect(
      screen.getByText('Strong React and testing coverage with high availability')
    ).toBeInTheDocument();
  });

  it('renders all team member names and roles', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Tester')).toBeInTheDocument();
  });

  it('renders individual match scores for each member', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('76')).toBeInTheDocument();
  });

  it('renders matched skills with proficiency indicators', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Playwright')).toBeInTheDocument();
    // Check proficiency indicators are present (aria-labels)
    expect(screen.getByLabelText('Proficiency level 3 of 3')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Proficiency level 2 of 3')).toHaveLength(2);
  });

  it('renders availability badges for each member', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    expect(screen.getByLabelText('Availability: Available')).toBeInTheDocument();
    expect(screen.getByLabelText('Availability: Partial')).toBeInTheDocument();
  });

  it('calls onClick when the card is clicked', () => {
    const handleClick = vi.fn();
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={handleClick} />);
    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders the entire card as a clickable button element', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has an accessible label with team score and explanation', () => {
    render(<TeamSuggestionCard suggestion={mockSuggestion} onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Team suggestion with score 82. Strong React and testing coverage with high availability'
    );
  });

  it('renders members with no skills gracefully', () => {
    const noSkillsSuggestion: TeamSuggestion = {
      teamScore: 60,
      explanation: 'Available team with broad experience',
      members: [
        {
          candidateId: 'c3',
          name: 'Carol White',
          role: 'Architect',
          matchScore: 60,
          matchedSkills: [],
          availability: 'available',
          yearsExperience: 10,
          currentTeam: 'Solutions',
        },
      ],
    };
    render(<TeamSuggestionCard suggestion={noSkillsSuggestion} onClick={() => {}} />);
    expect(screen.getByText('Carol White')).toBeInTheDocument();
    expect(screen.getByText('Architect')).toBeInTheDocument();
  });
});
