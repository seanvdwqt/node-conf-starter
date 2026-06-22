import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefineRolesStep } from '../src/components/steps/DefineRolesStep';
import type { RoleWithSkills } from '../src/api/squadRequests';

// Mock API module
vi.mock('../src/api/squadRequests', () => ({
  getRoles: vi.fn(),
  getCandidates: vi.fn(),
  updateRoles: vi.fn(),
}));

import { getRoles, getCandidates, updateRoles } from '../src/api/squadRequests';

const mockRoles: RoleWithSkills[] = [
  {
    id: 'role-1',
    name: 'engineer',
    skills: [
      {
        id: 'rs-1',
        roleId: 'role-1',
        skillId: 'skill-1',
        skill: { id: 'skill-1', name: 'TypeScript', category: 'technical' },
      },
      {
        id: 'rs-2',
        roleId: 'role-1',
        skillId: 'skill-2',
        skill: { id: 'skill-2', name: 'React', category: 'technical' },
      },
    ],
  },
  {
    id: 'role-2',
    name: 'tester',
    skills: [
      {
        id: 'rs-3',
        roleId: 'role-2',
        skillId: 'skill-3',
        skill: { id: 'skill-3', name: 'Playwright', category: 'technical' },
      },
    ],
  },
];

describe('DefineRolesStep', () => {
  const defaultProps = {
    squadRequestId: 'req-123',
    onCompleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
    (getCandidates as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (updateRoles as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('shows loading state initially', () => {
    render(<DefineRolesStep {...defaultProps} />);
    expect(screen.getByTestId('define-roles-loading')).toBeInTheDocument();
  });

  it('fetches and displays available roles', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });
    expect(screen.getByTestId('role-card-role-1')).toBeInTheDocument();
    expect(screen.getByTestId('role-card-role-2')).toBeInTheDocument();
  });

  it('displays error when roles fetch fails', async () => {
    (getRoles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-error')).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to load roles. Please try again.')).toBeInTheDocument();
  });

  it('expands skills when a role is selected', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    // Skills should be visible
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('collapses skills when a role is deselected', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    // Select then deselect
    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
  });

  it('toggles skill category between mandatory and preferred', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    const categoryBtn = screen.getByTestId('skill-category-role-1-0');
    expect(categoryBtn).toHaveTextContent('preferred');

    fireEvent.click(categoryBtn);
    expect(categoryBtn).toHaveTextContent('mandatory');

    fireEvent.click(categoryBtn);
    expect(categoryBtn).toHaveTextContent('preferred');
  });

  it('allows setting proficiency level via clickable dots', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    const skillRow = screen.getByTestId('skill-row-role-1-0');
    const dot3 = within(skillRow).getByLabelText('Set proficiency to 3');
    fireEvent.click(dot3);

    // After clicking dot 3, all 3 dots should be "pressed"
    const dot1 = within(skillRow).getByLabelText('Set proficiency to 1');
    const dot2 = within(skillRow).getByLabelText('Set proficiency to 2');
    expect(dot1).toHaveAttribute('aria-pressed', 'true');
    expect(dot2).toHaveAttribute('aria-pressed', 'true');
    expect(dot3).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows adding a custom skill', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    const input = screen.getByTestId('custom-skill-input-role-1');
    const addBtn = screen.getByTestId('add-custom-skill-btn-role-1');

    fireEvent.change(input, { target: { value: 'GraphQL' } });
    fireEvent.click(addBtn);

    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('(custom)')).toBeInTheDocument();
  });

  it('disables add button when custom skill input is empty', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    const addBtn = screen.getByTestId('add-custom-skill-btn-role-1');
    expect(addBtn).toBeDisabled();
  });

  it('allows removing a custom skill', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    // Add a custom skill
    const input = screen.getByTestId('custom-skill-input-role-1');
    fireEvent.change(input, { target: { value: 'Docker' } });
    fireEvent.click(screen.getByTestId('add-custom-skill-btn-role-1'));

    expect(screen.getByText('Docker')).toBeInTheDocument();

    // Remove it (it's the 3rd skill, index 2)
    fireEvent.click(screen.getByTestId('remove-skill-role-1-2'));
    expect(screen.queryByText('Docker')).not.toBeInTheDocument();
  });

  it('disables submit button when no role is selected', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId('define-roles-submit');
    expect(submitBtn).toBeDisabled();
    expect(defaultProps.onCompleted).not.toHaveBeenCalled();
  });

  it('calls updateRoles and onCompleted on successful submit', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    // Select a role (it has predefined skills, so valid)
    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    // Submit
    fireEvent.click(screen.getByTestId('define-roles-submit'));

    await waitFor(() => {
      expect(updateRoles).toHaveBeenCalledWith('req-123', [
        {
          roleId: 'role-1',
          skills: [
            {
              skillId: 'skill-1',
              name: 'TypeScript',
              category: 'preferred',
              requiredProficiency: 1,
              isCustom: false,
              customDescription: undefined,
            },
            {
              skillId: 'skill-2',
              name: 'React',
              category: 'preferred',
              requiredProficiency: 1,
              isCustom: false,
              customDescription: undefined,
            },
          ],
        },
      ]);
      expect(defaultProps.onCompleted).toHaveBeenCalled();
    });
  });

  it('shows error message when updateRoles API call fails', async () => {
    (updateRoles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Server error'));

    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));
    fireEvent.click(screen.getByTestId('define-roles-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('define-roles-error')).toBeInTheDocument();
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    expect(defaultProps.onCompleted).not.toHaveBeenCalled();
  });

  it('submits with correct payload including custom skills and proficiency', async () => {
    render(<DefineRolesStep {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('define-roles-step')).toBeInTheDocument();
    });

    // Select role
    fireEvent.click(screen.getByTestId('role-checkbox-role-1'));

    // Set first skill as mandatory with proficiency 2
    fireEvent.click(screen.getByTestId('skill-category-role-1-0'));
    const skillRow = screen.getByTestId('skill-row-role-1-0');
    fireEvent.click(within(skillRow).getByLabelText('Set proficiency to 2'));

    // Add custom skill
    const input = screen.getByTestId('custom-skill-input-role-1');
    fireEvent.change(input, { target: { value: 'Custom Skill' } });
    fireEvent.click(screen.getByTestId('add-custom-skill-btn-role-1'));

    // Submit
    fireEvent.click(screen.getByTestId('define-roles-submit'));

    await waitFor(() => {
      expect(updateRoles).toHaveBeenCalledWith('req-123', [
        {
          roleId: 'role-1',
          skills: [
            {
              skillId: 'skill-1',
              name: 'TypeScript',
              category: 'mandatory',
              requiredProficiency: 2,
              isCustom: false,
              customDescription: undefined,
            },
            {
              skillId: 'skill-2',
              name: 'React',
              category: 'preferred',
              requiredProficiency: 1,
              isCustom: false,
              customDescription: undefined,
            },
            {
              skillId: null,
              name: 'Custom Skill',
              category: 'preferred',
              requiredProficiency: 1,
              isCustom: true,
              customDescription: 'Custom Skill',
            },
          ],
        },
      ]);
    });
  });
});
