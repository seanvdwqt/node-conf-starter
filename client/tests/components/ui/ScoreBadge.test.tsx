import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScoreBadge } from '../../../src/components/ui/ScoreBadge';

describe('ScoreBadge', () => {
  it('displays the score number', () => {
    render(<ScoreBadge score={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('applies green styling for scores >= 70', () => {
    const { container } = render(<ScoreBadge score={70} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('applies amber styling for scores 40–69', () => {
    const { container } = render(<ScoreBadge score={55} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
  });

  it('applies red styling for scores < 40', () => {
    const { container } = render(<ScoreBadge score={20} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies green at boundary score 70', () => {
    const { container } = render(<ScoreBadge score={70} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('applies amber at boundary score 40', () => {
    const { container } = render(<ScoreBadge score={40} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-amber-100');
  });

  it('applies red at boundary score 39', () => {
    const { container } = render(<ScoreBadge score={39} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-100');
  });

  it('has an accessible label', () => {
    render(<ScoreBadge score={85} />);
    expect(screen.getByLabelText('Match score 85')).toBeInTheDocument();
  });
});
