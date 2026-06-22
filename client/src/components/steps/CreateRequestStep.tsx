import { useState, FormEvent } from 'react';
import { createSquadRequest } from '../../api/squadRequests';
import { ApiError } from '../../api/squadRequests';

export interface CreateRequestStepProps {
  onCreated: (id: string) => void;
}

interface FormData {
  title: string;
  businessUnit: string;
  objective: string;
  urgency: 'low' | 'medium' | 'high';
  startDate: string;
  durationWeeks: string;
  requiredCapacity: string;
}

interface FormErrors {
  title?: string;
  objective?: string;
  urgency?: string;
  startDate?: string;
  durationWeeks?: string;
  requiredCapacity?: string;
  server?: string;
}

const INITIAL_FORM: FormData = {
  title: '',
  businessUnit: 'Digital Platforms',
  objective: '',
  urgency: 'medium',
  startDate: getTodayString(),
  durationWeeks: '',
  requiredCapacity: '10',
};

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validate(form: FormData): FormErrors {
  const errors: FormErrors = {};

  // Title: required, max 100
  if (!form.title.trim()) {
    errors.title = 'Title is required';
  } else if (form.title.length > 100) {
    errors.title = 'Title must be 100 characters or fewer';
  }

  // Objective: required, max 500
  if (!form.objective.trim()) {
    errors.objective = 'Objective is required';
  } else if (form.objective.length > 500) {
    errors.objective = 'Objective must be 500 characters or fewer';
  }

  // Urgency: must be one of low/medium/high
  if (!['low', 'medium', 'high'].includes(form.urgency)) {
    errors.urgency = 'Please select a valid urgency level';
  }

  // Start date: required, must not be in the past
  if (!form.startDate) {
    errors.startDate = 'Start date is required';
  } else if (form.startDate < getTodayString()) {
    errors.startDate = 'Start date cannot be in the past';
  }

  // Duration weeks: required, integer 1-52
  if (!form.durationWeeks) {
    errors.durationWeeks = 'Duration is required';
  } else {
    const duration = Number(form.durationWeeks);
    if (!Number.isInteger(duration) || duration < 1 || duration > 52) {
      errors.durationWeeks = 'Duration must be a whole number between 1 and 52';
    }
  }

  // Required capacity: required, must be 10-100 in steps of 10
  if (!form.requiredCapacity) {
    errors.requiredCapacity = 'Required capacity is required';
  } else {
    const capacity = Number(form.requiredCapacity);
    if (capacity < 10 || capacity > 100 || capacity % 10 !== 0) {
      errors.requiredCapacity = 'Capacity must be between 10 and 100 in increments of 10';
    }
  }

  return errors;
}

export default function CreateRequestStep({ onCreated }: CreateRequestStepProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await createSquadRequest({
        title: form.title.trim(),
        businessUnit: form.businessUnit,
        objective: form.objective.trim(),
        urgency: form.urgency,
        startDate: form.startDate,
        durationWeeks: Number(form.durationWeeks),
        requiredCapacity: Number(form.requiredCapacity),
      });

      onCreated(response.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ server: err.message });
      } else {
        setErrors({ server: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5" data-testid="create-request-form">
      {/* Server error banner */}
      {errors.server && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm" data-testid="server-error">
          {errors.server}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          maxLength={100}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. Mobile App Delivery Squad"
          data-testid="input-title"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-title">{errors.title}</p>
        )}
      </div>

      {/* Business Unit (read-only) */}
      <div>
        <label htmlFor="businessUnit" className="block text-sm font-medium text-gray-700 mb-1">
          Business Unit
        </label>
        <input
          type="text"
          id="businessUnit"
          name="businessUnit"
          value={form.businessUnit}
          disabled
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
          data-testid="input-business-unit"
        />
      </div>

      {/* Objective */}
      <div>
        <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-1">
          Objective
        </label>
        <textarea
          id="objective"
          name="objective"
          value={form.objective}
          onChange={handleChange}
          maxLength={500}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Describe the delivery objective..."
          data-testid="input-objective"
        />
        {errors.objective && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-objective">{errors.objective}</p>
        )}
      </div>

      {/* Urgency */}
      <div>
        <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
          Urgency
        </label>
        <select
          id="urgency"
          name="urgency"
          value={form.urgency}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          data-testid="input-urgency"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {errors.urgency && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-urgency">{errors.urgency}</p>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Expected Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          min={getTodayString()}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          data-testid="input-start-date"
        />
        {errors.startDate && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-start-date">{errors.startDate}</p>
        )}
      </div>

      {/* Duration Weeks */}
      <div>
        <label htmlFor="durationWeeks" className="block text-sm font-medium text-gray-700 mb-1">
          Duration (weeks)
        </label>
        <input
          type="number"
          id="durationWeeks"
          name="durationWeeks"
          value={form.durationWeeks}
          onChange={handleChange}
          min={1}
          max={52}
          step={1}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="1–52"
          data-testid="input-duration"
        />
        {errors.durationWeeks && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-duration">{errors.durationWeeks}</p>
        )}
      </div>

      {/* Required Capacity */}
      <div>
        <label htmlFor="requiredCapacity" className="block text-sm font-medium text-gray-700 mb-1">
          Required Capacity (%)
        </label>
        <select
          id="requiredCapacity"
          name="requiredCapacity"
          value={form.requiredCapacity}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          data-testid="input-capacity"
        >
          <option value="10">Any (10% minimum)</option>
          {[20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
            <option key={val} value={String(val)}>
              {val}%
            </option>
          ))}
        </select>
        {errors.requiredCapacity && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-capacity">{errors.requiredCapacity}</p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={`w-full px-6 py-3 rounded-lg font-medium text-white transition-colors ${
            submitting
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          data-testid="submit-request-btn"
        >
          {submitting ? 'Creating...' : 'Create Squad Request'}
        </button>
      </div>
    </form>
  );
}
