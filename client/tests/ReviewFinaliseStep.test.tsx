import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewFinaliseStep from '../src/components/steps/ReviewFinaliseStep';
import type { RecommendationResponse, FinaliseResponse } from '../src/api/squadRequests';

// Mock the API module
vi.mock('../src/api/squadRequests', () => ({
  getRecommendations: vi.fn(),
  finaliseRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, body: { code: string; message: string }) {
      super(body.message);
      this.status = status;
      this.code = body.code;
    }
  },
}));

import { getRecommendations, finaliseRequest } from '../src/api/squadRequests';

const mockGetRecommendations = getRecommendations as ReturnType<typeof vi.fn>;
const mockFinaliseRequest = finaliseRequest as ReturnType<typeof vi.fn>;

const MOCK_RESPONSE: RecommendationResponse = {
  shortlists: [
    {
      roleId: 'role-1',
      roleName: 'Engineer',
      hasGap: false,
      candidates: [
        {
          candidateId: 'c1',
          name: 'Alice Smith',
          matchScore: 85,
          availability: 'available',
          workload: 'normal',
          matchedSkills: [{ name: 'React', proficiency: 3, requiredProficiency: 2 }],
          yearsExperience: 5,
          currentTeam: 'Team Alpha',
          previousProjects: [{ name: 'Project X', role: 'Engineer' }],
          explanation: 'Strong React skills with excellent availability.',
          scoreBreakdown: [{ rule: 'skillMatch', weight: 0.3, contribution: 25 }],
        },
      ],
    },
    {
      roleId: 'role-2',
      roleName: 'Tester',
      hasGap: false,
      candidates: [
        {
          candidateId: 'c2',
          name: 'Bob Jones',
          matchScore: 70,
          availability: 'partially_available',
          workload: 'high',
          matchedSkills: [{ name: 'Cypress', proficiency: 2, requiredProficiency: 2 }],
          yearsExperience: 3,
          currentTeam: 'Team Beta',
          previousProjects: [],
          explanation: 'Good Cypress skills but partially available.',
          scoreBreakdown: [{ rule: 'skillMatch', weight: 0.3, contribution: 20 }],
        },
      ],
    },
  ],
};

const MOCK_RESPONSE_WITH_GAP: RecommendationResponse = {
  shortlists: [
    ...MOCK_RESPONSE.shortlists,
    {
      roleId: 'role-3',
      roleName: 'Architect',
      hasGap: true,
      candidates: [],
    },
  ],
};

const MOCK_FINALISE_RESPONSE: FinaliseResponse = {
  id: 'req-123',
  status: 'finalised',
  message: 'Squad assembly has been finalised successfully.',
};

describe('ReviewFinaliseStep', () => {
  const defaultProps = {
    squadRequestId: 'req-123',
    selections: [
      { roleId: 'role-1', candidateIds: ['c1'] },
      { roleId: 'role-2', candidateIds: ['c2'] },
    ],
    onFinalised: vi.fn(),
    onReset: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecommendations.mockResolvedValue(MOCK_RESPONSE);
    mockFinaliseRequest.mockResolvedValue(MOCK_FINALISE_RESPONSE);
  });

  it('shows loading state then renders summary', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    expect(screen.getByTestId('review-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('review-finalise-step')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('displays candidate scores', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-finalise-step')).toBeInTheDocument();
    });

    // Scores should be visible
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('displays candidate explanations', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-finalise-step')).toBeInTheDocument();
    });

    expect(screen.getByText('Strong React skills with excellent availability.')).toBeInTheDocument();
    expect(screen.getByText('Good Cypress skills but partially available.')).toBeInTheDocument();
  });

  it('displays matched skills with proficiency', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-finalise-step')).toBeInTheDocument();
    });

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Cypress')).toBeInTheDocument();
  });

  it('displays coverage gaps when present', async () => {
    mockGetRecommendations.mockResolvedValue(MOCK_RESPONSE_WITH_GAP);

    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-gaps')).toBeInTheDocument();
    });

    expect(screen.getByText('Architect')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-back-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('review-back-btn'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('calls onReset when reset button is clicked', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-reset-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('review-reset-btn'));
    expect(defaultProps.onReset).toHaveBeenCalled();
  });

  it('calls finaliseRequest and shows confirmation on success', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-finalise-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('review-finalise-btn'));

    await waitFor(() => {
      expect(mockFinaliseRequest).toHaveBeenCalledWith('req-123');
    });

    await waitFor(() => {
      expect(screen.getByTestId('review-finalised')).toBeInTheDocument();
    });

    expect(screen.getByTestId('confirmation-message')).toHaveTextContent(
      'Squad assembly has been finalised successfully.',
    );
    expect(defaultProps.onFinalised).toHaveBeenCalled();
  });

  it('shows error banner on finalise failure', async () => {
    mockFinaliseRequest.mockRejectedValueOnce(new Error('Network error'));

    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-finalise-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('review-finalise-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('review-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it('shows error banner when recommendations fail to load', async () => {
    mockGetRecommendations.mockRejectedValueOnce(new Error('Network error'));

    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it('displays role section headers', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-role-role-1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('review-role-role-2')).toBeInTheDocument();
  });

  it('displays availability and workload info for candidates', async () => {
    render(<ReviewFinaliseStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-finalise-step')).toBeInTheDocument();
    });

    // Bob is partially_available and high workload
    const bobCard = screen.getByTestId('review-candidate-c2');
    expect(bobCard).toHaveTextContent(/partially available/i);
    expect(bobCard).toHaveTextContent(/high workload/i);
  });
});
