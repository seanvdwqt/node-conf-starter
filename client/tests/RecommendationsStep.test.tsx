import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecommendationsStep from '../src/components/steps/RecommendationsStep';
import type { RecommendationResponse } from '../src/api/squadRequests';

// Mock the API module
vi.mock('../src/api/squadRequests', () => ({
  getRecommendations: vi.fn(),
}));

import { getRecommendations } from '../src/api/squadRequests';
const mockGetRecommendations = vi.mocked(getRecommendations);

const MOCK_RESPONSE: RecommendationResponse = {
  shortlists: [
    {
      roleId: 'role-1',
      roleName: 'Backend Engineer',
      hasGap: false,
      candidates: [
        {
          candidateId: 'c-1',
          name: 'Alice Johnson',
          matchScore: 92,
          availability: 'available',
          workload: 'normal',
          matchedSkills: [
            { name: 'TypeScript', proficiency: 3, requiredProficiency: 2 },
            { name: 'Node.js', proficiency: 2, requiredProficiency: 2 },
          ],
          yearsExperience: 5,
          currentTeam: 'Platform Team',
          previousProjects: [{ name: 'Project X', role: 'Lead Dev' }],
          explanation: 'Strong match on core skills with solid experience.',
          scoreBreakdown: [{ rule: 'skill-match', weight: 0.5, contribution: 46 }],
        },
        {
          candidateId: 'c-2',
          name: 'Bob Smith',
          matchScore: 78,
          availability: 'partially_available',
          workload: 'high',
          matchedSkills: [
            { name: 'TypeScript', proficiency: 2, requiredProficiency: 2 },
          ],
          yearsExperience: 8,
          currentTeam: 'Payments Team',
          previousProjects: [],
          explanation: 'Good skill fit but high workload.',
          scoreBreakdown: [{ rule: 'skill-match', weight: 0.5, contribution: 39 }],
        },
      ],
    },
    {
      roleId: 'role-2',
      roleName: 'UX Designer',
      hasGap: true,
      candidates: [],
    },
  ],
};

describe('RecommendationsStep', () => {
  const onCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching', () => {
    mockGetRecommendations.mockReturnValue(new Promise(() => {})); // never resolves
    render(<RecommendationsStep squadRequestId="req-1" onCompleted={onCompleted} />);
    expect(screen.getByTestId('recommendations-loading')).toBeInTheDocument();
  });

  it('renders recommendations after successful fetch', async () => {
    mockGetRecommendations.mockResolvedValue(MOCK_RESPONSE);
    render(<RecommendationsStep squadRequestId="req-1" onCompleted={onCompleted} />);

    await waitFor(() => {
      expect(screen.getByTestId('recommendations-step')).toBeInTheDocument();
    });

    // Role sections rendered
    expect(screen.getByTestId('role-section-role-1')).toBeInTheDocument();
    expect(screen.getByTestId('role-section-role-2')).toBeInTheDocument();

    // Candidate names
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();

    // Explanation text
    expect(screen.getByText('Strong match on core skills with solid experience.')).toBeInTheDocument();
  });

  it('shows GapIndicator for roles with no matches', async () => {
    mockGetRecommendations.mockResolvedValue(MOCK_RESPONSE);
    render(<RecommendationsStep squadRequestId="req-1" onCompleted={onCompleted} />);

    await waitFor(() => {
      expect(screen.getByTestId('recommendations-step')).toBeInTheDocument();
    });

    // GapIndicator renders with the role name
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('UX Designer', { selector: '.font-medium' })).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockGetRecommendations.mockRejectedValue(new Error('Network error'));
    render(<RecommendationsStep squadRequestId="req-1" onCompleted={onCompleted} />);

    await waitFor(() => {
      expect(screen.getByTestId('recommendations-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('calls onCompleted when continue button is clicked', async () => {
    mockGetRecommendations.mockResolvedValue(MOCK_RESPONSE);
    render(<RecommendationsStep squadRequestId="req-1" onCompleted={onCompleted} />);

    await waitFor(() => {
      expect(screen.getByTestId('recommendations-continue-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('recommendations-continue-btn'));
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('calls getRecommendations with the squad request ID', async () => {
    mockGetRecommendations.mockResolvedValue(MOCK_RESPONSE);
    render(<RecommendationsStep squadRequestId="req-42" onCompleted={onCompleted} />);

    await waitFor(() => {
      expect(mockGetRecommendations).toHaveBeenCalledWith('req-42');
    });
  });
});
