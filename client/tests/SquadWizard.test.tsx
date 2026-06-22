import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SquadWizard from '../src/components/SquadWizard';

describe('SquadWizard', () => {
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

  it('navigates forward when Next is clicked', () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');
    fireEvent.click(nextBtn);
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(screen.getByTestId('step-2-placeholder')).toBeInTheDocument();
  });

  it('navigates back when Back is clicked', () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');
    fireEvent.click(nextBtn); // go to step 2
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

  it('navigates through all 5 steps', () => {
    render(<SquadWizard />);
    const nextBtn = screen.getByTestId('wizard-next-btn');

    for (let step = 1; step <= 5; step++) {
      expect(screen.getByText(`Step ${step} of 5`)).toBeInTheDocument();
      if (step === 1) {
        expect(screen.getByTestId('create-request-form')).toBeInTheDocument();
      } else {
        expect(screen.getByTestId(`step-${step}-placeholder`)).toBeInTheDocument();
      }
      if (step < 5) fireEvent.click(nextBtn);
    }
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
