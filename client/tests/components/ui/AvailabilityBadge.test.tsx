import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AvailabilityBadge } from '../../../src/components/ui/AvailabilityBadge';

describe('AvailabilityBadge', () => {
  it('renders "Available" for available status with green styling', () => {
    const { container } = render(<AvailabilityBadge status="available" />);
    expect(screen.getByText('Available')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders "Partial" for partially_available status with amber styling', () => {
    const { container } = render(<AvailabilityBadge status="partially_available" />);
    expect(screen.getByText('Partial')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
  });

  it('renders "Unavailable" for unavailable status with red styling', () => {
    const { container } = render(<AvailabilityBadge status="unavailable" />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('has an accessible label for available', () => {
    render(<AvailabilityBadge status="available" />);
    expect(screen.getByLabelText('Availability: Available')).toBeInTheDocument();
  });

  it('includes a coloured dot indicator', () => {
    const { container } = render(<AvailabilityBadge status="available" />);
    const dot = container.querySelector('span span.rounded-full');
    expect(dot).toHaveClass('bg-green-500');
  });
});
