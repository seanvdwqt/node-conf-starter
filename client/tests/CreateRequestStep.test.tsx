import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateRequestStep from '../src/components/steps/CreateRequestStep';

// Helper to get a future date string
function getFutureDate(daysFromNow = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Mock the API module
vi.mock('../src/api/squadRequests', () => ({
  createSquadRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, body: { code: string; message: string }) {
      super(body.message);
      this.name = 'ApiError';
      this.status = status;
      this.code = body.code;
    }
  },
}));

import { createSquadRequest, ApiError } from '../src/api/squadRequests';
const mockCreateSquadRequest = vi.mocked(createSquadRequest);

describe('CreateRequestStep', () => {
  const onCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CreateRequestStep onCreated={onCreated} />);

    expect(screen.getByTestId('input-title')).toBeInTheDocument();
    expect(screen.getByTestId('input-business-unit')).toBeInTheDocument();
    expect(screen.getByTestId('input-objective')).toBeInTheDocument();
    expect(screen.getByTestId('input-urgency')).toBeInTheDocument();
    expect(screen.getByTestId('input-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('input-duration')).toBeInTheDocument();
    expect(screen.getByTestId('input-capacity')).toBeInTheDocument();
    expect(screen.getByTestId('submit-request-btn')).toBeInTheDocument();
  });

  it('shows business unit as disabled with "Digital Platforms"', () => {
    render(<CreateRequestStep onCreated={onCreated} />);

    const buInput = screen.getByTestId('input-business-unit') as HTMLInputElement;
    expect(buInput.value).toBe('Digital Platforms');
    expect(buInput.disabled).toBe(true);
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<CreateRequestStep onCreated={onCreated} />);

    fireEvent.click(screen.getByTestId('submit-request-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-title')).toHaveTextContent('Title is required');
      expect(screen.getByTestId('error-objective')).toHaveTextContent('Objective is required');
      expect(screen.getByTestId('error-start-date')).toHaveTextContent('Start date is required');
      expect(screen.getByTestId('error-duration')).toHaveTextContent('Duration is required');
      expect(screen.getByTestId('error-capacity')).toHaveTextContent('Required capacity is required');
    });

    expect(mockCreateSquadRequest).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('validates title max length (100 chars)', async () => {
    render(<CreateRequestStep onCreated={onCreated} />);

    const titleInput = screen.getByTestId('input-title');
    // The input has maxLength=100, but validation still checks
    fireEvent.change(titleInput, { target: { name: 'title', value: 'A'.repeat(101) } });

    // Fill other required fields to isolate title error
    fireEvent.change(screen.getByTestId('input-objective'), { target: { name: 'objective', value: 'Test obj' } });
    fireEvent.change(screen.getByTestId('input-start-date'), { target: { name: 'startDate', value: getFutureDate() } });
    fireEvent.change(screen.getByTestId('input-duration'), { target: { name: 'durationWeeks', value: '4' } });
    fireEvent.change(screen.getByTestId('input-capacity'), { target: { name: 'requiredCapacity', value: '50' } });

    fireEvent.click(screen.getByTestId('submit-request-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-title')).toHaveTextContent('Title must be 100 characters or fewer');
    });
  });

  it('validates start date is not in the past', async () => {
    render(<CreateRequestStep onCreated={onCreated} />);

    const titleInput = screen.getByTestId('input-title') as HTMLInputElement;
    const objectiveInput = screen.getByTestId('input-objective') as HTMLTextAreaElement;
    const startDateInput = screen.getByTestId('input-start-date') as HTMLInputElement;
    const durationInput = screen.getByTestId('input-duration') as HTMLInputElement;
    const capacitySelect = screen.getByTestId('input-capacity') as HTMLSelectElement;

    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(objectiveInput, { target: { value: 'Obj' } });
    fireEvent.change(startDateInput, { target: { value: '2020-01-01' } });
    fireEvent.change(durationInput, { target: { value: '4' } });
    fireEvent.change(capacitySelect, { target: { value: '50' } });

    fireEvent.submit(screen.getByTestId('create-request-form'));

    await waitFor(() => {
      expect(screen.getByTestId('error-start-date')).toHaveTextContent('Start date cannot be in the past');
    });
  });

  it('validates duration must be 1-52', async () => {
    render(<CreateRequestStep onCreated={onCreated} />);

    const titleInput = screen.getByTestId('input-title') as HTMLInputElement;
    const objectiveInput = screen.getByTestId('input-objective') as HTMLTextAreaElement;
    const startDateInput = screen.getByTestId('input-start-date') as HTMLInputElement;
    const durationInput = screen.getByTestId('input-duration') as HTMLInputElement;
    const capacitySelect = screen.getByTestId('input-capacity') as HTMLSelectElement;

    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(objectiveInput, { target: { value: 'Obj' } });
    fireEvent.change(startDateInput, { target: { value: getFutureDate() } });
    fireEvent.change(durationInput, { target: { value: '53' } });
    fireEvent.change(capacitySelect, { target: { value: '50' } });

    fireEvent.submit(screen.getByTestId('create-request-form'));

    await waitFor(() => {
      expect(screen.getByTestId('error-duration')).toHaveTextContent('Duration must be a whole number between 1 and 52');
    });
  });

  it('calls API and onCreated on successful submission', async () => {
    mockCreateSquadRequest.mockResolvedValueOnce({
      id: 'req-123',
      title: 'Test Squad',
      businessUnit: 'Digital Platforms',
      objective: 'Test objective',
      urgency: 'high',
      startDate: getFutureDate(),
      durationWeeks: 4,
      requiredCapacity: 50,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<CreateRequestStep onCreated={onCreated} />);

    fireEvent.change(screen.getByTestId('input-title'), { target: { name: 'title', value: 'Test Squad' } });
    fireEvent.change(screen.getByTestId('input-objective'), { target: { name: 'objective', value: 'Test objective' } });
    fireEvent.change(screen.getByTestId('input-urgency'), { target: { name: 'urgency', value: 'high' } });
    fireEvent.change(screen.getByTestId('input-start-date'), { target: { name: 'startDate', value: getFutureDate() } });
    fireEvent.change(screen.getByTestId('input-duration'), { target: { name: 'durationWeeks', value: '4' } });
    fireEvent.change(screen.getByTestId('input-capacity'), { target: { name: 'requiredCapacity', value: '50' } });

    fireEvent.click(screen.getByTestId('submit-request-btn'));

    await waitFor(() => {
      expect(mockCreateSquadRequest).toHaveBeenCalledWith({
        title: 'Test Squad',
        businessUnit: 'Digital Platforms',
        objective: 'Test objective',
        urgency: 'high',
        startDate: getFutureDate(),
        durationWeeks: 4,
        requiredCapacity: 50,
      });
      expect(onCreated).toHaveBeenCalledWith('req-123');
    });
  });

  it('displays server error and preserves form data on API failure', async () => {
    const apiError = new ApiError(400, { code: 'VALIDATION_ERROR', message: 'Title already exists' });
    mockCreateSquadRequest.mockRejectedValueOnce(apiError);

    render(<CreateRequestStep onCreated={onCreated} />);

    fireEvent.change(screen.getByTestId('input-title'), { target: { name: 'title', value: 'Duplicate Title' } });
    fireEvent.change(screen.getByTestId('input-objective'), { target: { name: 'objective', value: 'Obj' } });
    fireEvent.change(screen.getByTestId('input-start-date'), { target: { name: 'startDate', value: getFutureDate() } });
    fireEvent.change(screen.getByTestId('input-duration'), { target: { name: 'durationWeeks', value: '4' } });
    fireEvent.change(screen.getByTestId('input-capacity'), { target: { name: 'requiredCapacity', value: '50' } });

    fireEvent.click(screen.getByTestId('submit-request-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('server-error')).toHaveTextContent('Title already exists');
    });

    // Form data is preserved
    expect((screen.getByTestId('input-title') as HTMLInputElement).value).toBe('Duplicate Title');
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('clears field error when user modifies that field', async () => {
    render(<CreateRequestStep onCreated={onCreated} />);

    // Submit empty to get errors
    fireEvent.click(screen.getByTestId('submit-request-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-title')).toBeInTheDocument();
    });

    // Type in title to clear its error
    fireEvent.change(screen.getByTestId('input-title'), { target: { name: 'title', value: 'Now filled' } });

    expect(screen.queryByTestId('error-title')).not.toBeInTheDocument();
  });
});
