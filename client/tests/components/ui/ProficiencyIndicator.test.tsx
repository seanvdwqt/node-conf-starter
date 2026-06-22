import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProficiencyIndicator } from '../../../src/components/ui/ProficiencyIndicator';

describe('ProficiencyIndicator', () => {
  it('renders 3 dots total', () => {
    const { container } = render(<ProficiencyIndicator level={2} />);
    const dots = container.querySelectorAll('span > span');
    expect(dots).toHaveLength(3);
  });

  it('fills 1 dot for level 1', () => {
    const { container } = render(<ProficiencyIndicator level={1} />);
    const dots = container.querySelectorAll('span > span');
    expect(dots[0]).toHaveClass('bg-indigo-500');
    expect(dots[1]).toHaveClass('bg-gray-200');
    expect(dots[2]).toHaveClass('bg-gray-200');
  });

  it('fills 2 dots for level 2', () => {
    const { container } = render(<ProficiencyIndicator level={2} />);
    const dots = container.querySelectorAll('span > span');
    expect(dots[0]).toHaveClass('bg-indigo-500');
    expect(dots[1]).toHaveClass('bg-indigo-500');
    expect(dots[2]).toHaveClass('bg-gray-200');
  });

  it('fills 3 dots for level 3', () => {
    const { container } = render(<ProficiencyIndicator level={3} />);
    const dots = container.querySelectorAll('span > span');
    expect(dots[0]).toHaveClass('bg-indigo-500');
    expect(dots[1]).toHaveClass('bg-indigo-500');
    expect(dots[2]).toHaveClass('bg-indigo-500');
  });

  it('has an accessible label', () => {
    render(<ProficiencyIndicator level={2} />);
    expect(screen.getByLabelText('Proficiency level 2 of 3')).toBeInTheDocument();
  });
});
