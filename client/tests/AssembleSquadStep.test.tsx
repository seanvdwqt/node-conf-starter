import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssembleSquadStep from '../src/components/steps/AssembleSquadStep';
import type { RecommendationResponse } from '../src/api/squadRequests';

// Mock the API module
vi.mock('../src/api/squadRequests', () => ({
  getRecommendations: vi.fn(),
  saveSquad: vi.fn(),
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

import { getRecommendations, saveSquad } from '../src/api/squadRequests';

const mockGetRecommendations = getRecommendations as ReturnType<typeof vi.fn>;
const mockSaveSquad = saveSquad as ReturnType<typeof vi.fn>;

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
          explanation: 'Strong React skills.',
          scoreBreakdown: [{ rule: 'skillMatch', weight: 0.3, contribution: 25 }],
        },
        {
          candidateId: 'c2',
          name: 'Bob Jones',
          matchScore: 70,
          availability: 'partially_available',
          workload: 'high',
          matchedSkills: [{ name: 'TypeScript', proficiency: 2, requiredProficiency: 2 }],
          yearsExperience: 3,
          currentTeam: 'Team Beta',
          previousProjects: [{ name: 'Project Y', role: 'Dev' }],
          explanation: 'Partial availability, high workload.',
          scoreBreakdown: [{ rule: 'skillMatch', weight: 0.3, contribution: 20 }],
        },
      ],
    },
    {
      roleId: 'role-2',
      roleName: 'Tester',
      hasGap: false,
      candidates: [
        {
          candidateId: 'c3',
          name: 'Charlie Davis',
          matchScore: 90,
          availability: 'available',
          workload: 'normal',
          matchedSkills: [{ name: 'Cypress', proficiency: 3, requiredProficiency: 2 }],
          yearsExperience: 7,
          currentTeam: 'Team Alpha',
          previousProjects: [],
          explanation: 'Expert tester.',
          scoreBreakdown: [{ rule: 'skillMatch', weight: 0.3, contribution: 27 }],
        },
      ],
    },
  ],
};

describe('AssembleSquadStep', () => {
  const defaultProps = {
    squadRequestId: 'req-123',
    onCompleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecommendations.mockResolvedValue(MOCK_RESPONSE);
    mockSaveSquad.mockResolvedValue({ id: 'req-123', status: 'assembled' });
  });

  it('shows loading state then renders candidates', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    expect(screen.getByTestId('assemble-squad-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('assemble-squad-step')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Charlie Davis')).toBeInTheDocument();
  });

  it('shows missing roles indicator when no candidates are selected', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('missing-roles-indicator')).toBeInTheDocument();
    });

    // The GapIndicator should show both role names within the coverage gap alert
    const gapIndicator = screen.getByTestId('missing-roles-indicator');
    expect(gapIndicator).toHaveTextContent('Engineer');
    expect(gapIndicator).toHaveTextContent('Tester');
  });

  it('disables submit button when mandatory roles are not filled', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('assemble-squad-submit')).toBeInTheDocument();
    });

    expect(screen.getByTestId('assemble-squad-submit')).toBeDisabled();
  });

  it('selects an available candidate without showing warning', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-candidate-c1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-candidate-c1'));

    // Should be checked, no modal
    expect(screen.getByTestId('select-candidate-c1')).toBeChecked();
    expect(screen.queryByTestId('warning-modal')).not.toBeInTheDocument();
  });

  it('shows warning modal when selecting partially_available or high workload candidate', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-candidate-c2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-candidate-c2'));

    // Warning modal should appear with reasons
    const modal = screen.getByTestId('warning-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent(/partially available/i);
    expect(modal).toHaveTextContent(/high workload/i);
  });

  it('confirms warning and adds candidate to selections', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-candidate-c2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-candidate-c2'));
    expect(screen.getByTestId('warning-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('warning-confirm-btn'));

    // Modal dismissed, candidate selected
    expect(screen.queryByTestId('warning-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('select-candidate-c2')).toBeChecked();
  });

  it('dismisses warning without selecting candidate', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-candidate-c2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-candidate-c2'));
    fireEvent.click(screen.getByTestId('warning-dismiss-btn'));

    expect(screen.queryByTestId('warning-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('select-candidate-c2')).not.toBeChecked();
  });

  it('enables submit when all mandatory roles have selections', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-candidate-c1')).toBeInTheDocument();
    });

    // Select one candidate for each role
    fireEvent.click(screen.getByTestId('select-candidate-c1')); // Engineer
    fireEvent.click(screen.getByTestId('select-candidate-c3')); // Tester

    expect(screen.getByTestId('assemble-squad-submit')).not.toBeDisabled();
  });

  it('calls saveSquad and onCompleted on submit', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-candidate-c1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-candidate-c1'));
    fireEvent.click(screen.getByTestId('select-candidate-c3'));
    fireEvent.click(screen.getByTestId('assemble-squad-submit'));

    await waitFor(() => {
      expect(mockSaveSquad).toHaveBeenCalledWith('req-123', expect.any(Array));
    });

    expect(defaultProps.onCompleted).toHaveBeenCalled();
  });

  it('displays selection counter', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('selection-counter')).toBeInTheDocument();
    });

    expect(screen.getByTestId('selection-counter')).toHaveTextContent('0 / 20 selected');

    fireEvent.click(screen.getByTestId('select-candidate-c1'));
    expect(screen.getByTestId('selection-counter')).toHaveTextContent('1 / 20 selected');
  });

  it('shows error banner on API failure', async () => {
    mockGetRecommendations.mockRejectedValueOnce(new Error('Network error'));

    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('assemble-squad-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load recommendations/i)).toBeInTheDocument();
  });

  it('deselects a candidate and updates missing roles', async () => {
    render(<AssembleSquadStep {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-candidate-c1')).toBeInTheDocument();
    });

    // Select both roles
    fireEvent.click(screen.getByTestId('select-candidate-c1'));
    fireEvent.click(screen.getByTestId('select-candidate-c3'));

    // Missing roles indicator should be gone
    expect(screen.queryByTestId('missing-roles-indicator')).not.toBeInTheDocument();

    // Deselect engineer
    fireEvent.click(screen.getByTestId('select-candidate-c1'));

    // Missing roles should reappear showing Engineer
    expect(screen.getByTestId('missing-roles-indicator')).toBeInTheDocument();
  });
});
