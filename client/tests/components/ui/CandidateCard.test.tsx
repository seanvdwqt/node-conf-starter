import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CandidateCard, CandidateData } from '../../../src/components/ui/CandidateCard';

const mockCandidate: CandidateData = {
  candidateId: '1',
  name: 'Jane Smith',
  role: 'Engineer',
  matchScore: 85,
  availability: 'available',
  workload: 'normal',
  matchedSkills: [
    { name: 'React', proficiency: 3 },
    { name: 'TypeScript', proficiency: 2, requiredProficiency: 2 },
  ],
  yearsExperience: 7,
  currentTeam: 'Payments',
  previousProjects: [
    { name: 'Project Alpha', role: 'Lead Engineer' },
    { name: 'Project Beta', role: 'Developer' },
  ],
  explanation: 'Strong match on React and TypeScript with full availability.',
};

describe('CandidateCard', () => {
  it('displays candidate name and role', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
  });

  it('displays the match score badge', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('displays the availability badge', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('displays years of experience', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('7 yrs experience')).toBeInTheDocument();
  });

  it('displays current team', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('displays matched skills with proficiency indicators', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('displays explanation text', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(
      screen.getByText('Strong match on React and TypeScript with full availability.')
    ).toBeInTheDocument();
  });

  it('shows high workload indicator when workload is high', () => {
    const highWorkloadCandidate = { ...mockCandidate, workload: 'high' as const };
    render(<CandidateCard candidate={highWorkloadCandidate} />);
    expect(screen.getByText('High workload')).toBeInTheDocument();
  });

  it('does not show high workload indicator for normal workload', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.queryByText('High workload')).not.toBeInTheDocument();
  });

  it('collapses previous projects by default', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
  });

  it('expands previous projects on button click', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    fireEvent.click(screen.getByText('Previous Projects (2)'));
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('collapses projects again on second click', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    const button = screen.getByText('Previous Projects (2)');
    fireEvent.click(button);
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
  });
});
