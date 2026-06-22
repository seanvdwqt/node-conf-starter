import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from '../../../src/components/ui/FilterBar';

describe('FilterBar', () => {
  const defaultProps = {
    teams: ['Alpha', 'Beta', 'Gamma'],
    onFilterChange: vi.fn(),
    onSortChange: vi.fn(),
  };

  it('renders sort buttons for score, experience, and proficiency', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Proficiency')).toBeInTheDocument();
  });

  it('renders team dropdown with all teams', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByLabelText('Team:')).toBeInTheDocument();
    expect(screen.getByText('All teams')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('calls onSortChange when a sort button is clicked', () => {
    const onSortChange = vi.fn();
    render(<FilterBar {...defaultProps} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByText('Experience'));
    expect(onSortChange).toHaveBeenCalledWith('experience');
  });

  it('calls onFilterChange when team is selected', () => {
    const onFilterChange = vi.fn();
    render(<FilterBar {...defaultProps} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByLabelText('Team:'), { target: { value: 'Beta' } });
    expect(onFilterChange).toHaveBeenCalledWith({ team: 'Beta' });
  });

  it('calls onFilterChange with null when "All teams" is selected', () => {
    const onFilterChange = vi.fn();
    render(<FilterBar {...defaultProps} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByLabelText('Team:'), { target: { value: '' } });
    expect(onFilterChange).toHaveBeenCalledWith({ team: null });
  });

  it('highlights the active sort button', () => {
    render(<FilterBar {...defaultProps} />);
    const scoreButton = screen.getByText('Score');
    expect(scoreButton).toHaveClass('bg-indigo-600', 'text-white');
  });
});
