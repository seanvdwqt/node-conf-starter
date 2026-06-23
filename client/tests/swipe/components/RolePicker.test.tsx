import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RolePicker } from '../../../src/swipe/components/RolePicker';
import type { Role } from '../../../src/swipe/types';

const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'engineer',
    displayName: 'Engineer',
    colour: 'blue-500',
    skills: [],
  },
  {
    id: 'role-2',
    name: 'architect',
    displayName: 'Architect',
    colour: 'purple-500',
    skills: [],
  },
  {
    id: 'role-3',
    name: 'tester',
    displayName: 'Tester',
    colour: 'green-500',
    skills: [],
  },
];

describe('RolePicker', () => {
  it('renders all roles as chips', () => {
    render(
      <RolePicker
        roles={mockRoles}
        selectedRole={null}
        onRoleSelect={() => {}}
        cartCountByRole={{}}
      />
    );

    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Architect')).toBeInTheDocument();
    expect(screen.getByText('Tester')).toBeInTheDocument();
  });

  it('highlights the selected role with filled background', () => {
    render(
      <RolePicker
        roles={mockRoles}
        selectedRole="role-1"
        onRoleSelect={() => {}}
        cartCountByRole={{}}
      />
    );

    const selectedButton = screen.getByRole('button', { name: /Engineer/i });
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    expect(selectedButton).toHaveClass('bg-blue-500', 'text-white');

    const unselectedButton = screen.getByRole('button', { name: /Architect/i });
    expect(unselectedButton).toHaveAttribute('aria-pressed', 'false');
    expect(unselectedButton).toHaveClass('border-purple-500');
    expect(unselectedButton).not.toHaveClass('bg-purple-500');
  });

  it('shows badge count when greater than 0', () => {
    render(
      <RolePicker
        roles={mockRoles}
        selectedRole={null}
        onRoleSelect={() => {}}
        cartCountByRole={{ 'role-1': 3, 'role-3': 1 }}
      />
    );

    // Engineer has 3 in cart
    expect(screen.getByText('3')).toBeInTheDocument();
    // Tester has 1 in cart
    expect(screen.getByText('1')).toBeInTheDocument();
    // Architect has 0 — no badge rendered
    const architectButton = screen.getByRole('button', { name: /Architect/i });
    expect(architectButton).not.toHaveTextContent(/\d/);
  });

  it('does not show badge when count is 0', () => {
    render(
      <RolePicker
        roles={mockRoles}
        selectedRole={null}
        onRoleSelect={() => {}}
        cartCountByRole={{ 'role-1': 0 }}
      />
    );

    const engineerButton = screen.getByRole('button', { name: /Engineer/i });
    expect(engineerButton).not.toHaveTextContent(/\d/);
  });

  it('shows prompt when no role is selected', () => {
    render(
      <RolePicker
        roles={mockRoles}
        selectedRole={null}
        onRoleSelect={() => {}}
        cartCountByRole={{}}
      />
    );

    expect(
      screen.getByText('Select a role to browse candidates')
    ).toBeInTheDocument();
  });

  it('does not show prompt when a role is selected', () => {
    render(
      <RolePicker
        roles={mockRoles}
        selectedRole="role-1"
        onRoleSelect={() => {}}
        cartCountByRole={{}}
      />
    );

    expect(
      screen.queryByText('Select a role to browse candidates')
    ).not.toBeInTheDocument();
  });

  it('calls onRoleSelect when a chip is clicked', () => {
    const onRoleSelect = vi.fn();

    render(
      <RolePicker
        roles={mockRoles}
        selectedRole={null}
        onRoleSelect={onRoleSelect}
        cartCountByRole={{}}
      />
    );

    fireEvent.click(screen.getByText('Architect'));

    expect(onRoleSelect).toHaveBeenCalledTimes(1);
    expect(onRoleSelect).toHaveBeenCalledWith('role-2');
  });

  it('shows empty state when roles array is empty', () => {
    render(
      <RolePicker
        roles={[]}
        selectedRole={null}
        onRoleSelect={() => {}}
        cartCountByRole={{}}
      />
    );

    expect(screen.getByText('No roles available')).toBeInTheDocument();
    // No buttons should be rendered
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
