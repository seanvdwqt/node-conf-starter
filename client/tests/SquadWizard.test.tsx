import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SquadWizard from '../src/components/SquadWizard';

// Mock the API module since step components make API calls
vi.mock('../src/api/squadRequests', () => ({
  createSquadRequest: vi.fn(),
  getRoles: vi.fn().mockResolvedValue([]),
  getCandidates: vi.fn().mockResolvedValue([]),
  updateRoles: vi.fn().mockResolvedValue({}),
  getRecommendations: vi.fn().mockResolvedValue({ shortlists: [] }),
  saveSquad: vi.fn().mockResolvedValue({}),
  finaliseRequest: vi.fn().mockResolvedValue({ id: '1', status: 'finalised', message: 'Done' }),
}));

describe('SquadWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the wizard container', () => {
    render(<SquadWizard />);
    expect(screen.getByTestId('squad-wizard')).toBeInTheDocument();
  });

  it('starts on step 1', () => {
    render(<SquadWizard />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByTestId('create-request-form')).toBeInTheDocument();
  });

  it('has back button disabled on step 1', () => {
    render(<SquadWizard />);
    const backBtn = screen.getByTestId('wizard-back-btn');
    expect(backBtn).toBeDisabled();
  });

  it('navigates forward when Next is clicked', async () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');
    fireEvent.click(nextBtn);
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    // Step 2 renders DefineRolesStep which shows loading then content
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });
  });

  it('navigates back when Back is clicked', async () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');
    fireEvent.click(nextBtn); // go to step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    });
    const backBtn = screen.getByTestId('wizard-back-btn');
    fireEvent.click(backBtn);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByTestId('create-request-form')).toBeInTheDocument();
  });

  it('shows all 5 step indicators', () => {
    render(<SquadWizard />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`step-indicator-${i}`)).toBeInTheDocument();
    }
  });

  it('navigates through all 5 steps', async () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');

    // Step 1
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByTestId('create-request-form')).toBeInTheDocument();

    // Step 2
    fireEvent.click(nextBtn);
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    // Step 3
    fireEvent.click(nextBtn);
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();

    // Step 4
    fireEvent.click(nextBtn);
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();

    // Step 5
    fireEvent.click(nextBtn);
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
  });

  it('shows Finalise button on last step', () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');

    // Navigate to step 5
    fireEvent.click(nextBtn); // step 2
    fireEvent.click(nextBtn); // step 3
    fireEvent.click(nextBtn); // step 4
    fireEvent.click(nextBtn); // step 5

    expect(screen.getByText('Finalise')).toBeInTheDocument();
  });

  it('does not advance beyond step 5', () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');

    // Navigate to step 5
    fireEvent.click(nextBtn); // step 2
    fireEvent.click(nextBtn); // step 3
    fireEvent.click(nextBtn); // step 4
    fireEvent.click(nextBtn); // step 5

    // Try to go further
    fireEvent.click(nextBtn);
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
  });

  it('does not go below step 1', () => {
    render(<SquadWizard />);
    const backBtn = screen.getByTestId('wizard-back-btn');

    // Try to go back from step 1
    fireEvent.click(backBtn);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('restricts to a maximum of 5 screens', () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');

    // Navigate through all steps
    for (let i = 0; i < 10; i++) {
      fireEvent.click(nextBtn);
    }

    // Should still be on step 5
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
  });
});
