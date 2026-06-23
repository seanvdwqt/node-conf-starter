import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SwipeSquadSelector } from '../../../src/swipe/components/SwipeSquadSelector';

/**
 * SwipeSquadSelector container component tests
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.6, 10.1, 10.2, 10.4
 */

const mockRoles = [
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
];

const mockCandidates = [
  {
    id: 'c1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    currentRole: 'role-1',
    businessUnit: 'Digital',
    capacityFree: 80,
    currentWorkload: 20,
    yearsExperience: 5,
    currentTeam: 'Team Alpha',
    skills: [],
    projects: [],
    availability: 'available',
  },
  {
    id: 'c2',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    currentRole: 'role-1',
    businessUnit: 'Digital',
    capacityFree: 50,
    currentWorkload: 50,
    yearsExperience: 3,
    currentTeam: 'Team Beta',
    skills: [],
    projects: [],
    availability: 'partially_available',
  },
  {
    id: 'c3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    currentRole: 'role-2',
    businessUnit: 'Digital',
    capacityFree: 90,
    currentWorkload: 10,
    yearsExperience: 8,
    currentTeam: 'Team Gamma',
    skills: [],
    projects: [],
    availability: 'available',
  },
];

function createFetchMock(options?: {
  rolesError?: boolean;
  candidatesError?: boolean;
}) {
  return vi.fn((url: string) => {
    if (url === '/api/roles') {
      if (options?.rolesError) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({}),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoles),
      } as Response);
    }
    if (url === '/api/candidates') {
      if (options?.candidatesError) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({}),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCandidates),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });
}

describe('SwipeSquadSelector', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    // Use a fetch that never resolves to capture loading state
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );

    render(<SwipeSquadSelector onClose={onClose} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading candidates...')).toBeInTheDocument();
  });

  it('shows error state on API failure with retry button', async () => {
    vi.stubGlobal('fetch', createFetchMock({ rolesError: true }));

    render(<SwipeSquadSelector onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('retries both fetches when retry button is clicked', async () => {
    const fetchMock = createFetchMock({ rolesError: true });
    vi.stubGlobal('fetch', fetchMock);

    render(<SwipeSquadSelector onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Now make fetch succeed on retry
    const successFetch = createFetchMock();
    vi.stubGlobal('fetch', successFetch);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // Both endpoints should have been called
    expect(successFetch).toHaveBeenCalledWith('/api/roles');
    expect(successFetch).toHaveBeenCalledWith('/api/candidates');
  });

  it('renders RolePicker after data loads', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    render(<SwipeSquadSelector onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });

    expect(screen.getByText('Architect')).toBeInTheDocument();
  });

  it('shows "Select a role" prompt when no role selected', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    render(<SwipeSquadSelector onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-role-prompt')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Select a role to start swiping')
    ).toBeInTheDocument();
  });

  it('shows SwipeCardStack when a role is selected', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    render(<SwipeSquadSelector onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Engineer'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('swipe-card-stack')).toBeInTheDocument();
    });
  });

  it('shows CartReview when review is triggered', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    render(<SwipeSquadSelector onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });

    // Select a role
    await act(async () => {
      fireEvent.click(screen.getByText('Engineer'));
    });

    // Add a candidate via keyboard (ArrowDown)
    await waitFor(() => {
      expect(screen.getByTestId('swipe-card-stack')).toBeInTheDocument();
    });

    const stack = screen.getByTestId('swipe-card-stack');
    await act(async () => {
      fireEvent.keyDown(stack, { key: 'ArrowDown' });
    });

    // Click the cart to expand it, then click "Review Squad"
    const cartButton = screen.getByLabelText(/squad cart/i);
    await act(async () => {
      fireEvent.click(cartButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Review Squad')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Review Squad'));
    });

    await waitFor(() => {
      expect(screen.getByText('Back to Swiping')).toBeInTheDocument();
    });
  });

  it('close button calls onClose', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    render(<SwipeSquadSelector onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
