import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('renders the Rapid Squad Assembly heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /rapid squad assembly/i })).toBeInTheDocument();
  });

  it('renders the SquadWizard component', () => {
    render(<App />);
    expect(screen.getByTestId('squad-wizard')).toBeInTheDocument();
  });
});
