import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GapIndicator } from '../../../src/components/ui/GapIndicator';

describe('GapIndicator', () => {
  it('renders nothing when roles array is empty', () => {
    const { container } = render(<GapIndicator roles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays a warning alert role', () => {
    render(<GapIndicator roles={['architect']} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays the "Coverage Gap" heading', () => {
    render(<GapIndicator roles={['architect']} />);
    expect(screen.getByText('Coverage Gap')).toBeInTheDocument();
  });

  it('displays a single unfilled role', () => {
    render(<GapIndicator roles={['architect']} />);
    expect(screen.getByText('architect')).toBeInTheDocument();
  });

  it('displays multiple unfilled roles', () => {
    render(<GapIndicator roles={['architect', 'tester', 'engineer']} />);
    expect(screen.getByText('architect')).toBeInTheDocument();
    expect(screen.getByText('tester')).toBeInTheDocument();
    expect(screen.getByText('engineer')).toBeInTheDocument();
  });

  it('has accessible label for the warning', () => {
    render(<GapIndicator roles={['tester']} />);
    expect(screen.getByLabelText('Coverage gap warning')).toBeInTheDocument();
  });
});
