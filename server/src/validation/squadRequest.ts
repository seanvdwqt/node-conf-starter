/**
 * Squad Request Validation
 *
 * Validates all fields of a squad request input and returns
 * an array of field-level errors. All violations are reported
 * (not just the first one).
 *
 * Requirements: 1.3, 1.4, 1.5, 1.6, 2.3
 */

export interface ValidationError {
  field: string;
  message: string;
}

const VALID_URGENCY = ['low', 'medium', 'high'] as const;
const VALID_CAPACITY = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
const REQUIRED_BUSINESS_UNIT = 'Digital Platforms';

export function validateSquadRequest(input: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input === null || input === undefined || typeof input !== 'object') {
    errors.push({ field: 'input', message: 'Request body must be an object' });
    return errors;
  }

  const data = input as Record<string, unknown>;

  // Title: non-empty, ≤100 chars
  if (data.title === undefined || data.title === null) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (typeof data.title !== 'string') {
    errors.push({ field: 'title', message: 'Title must be a string' });
  } else if (data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title must not be empty' });
  } else if (data.title.length > 100) {
    errors.push({ field: 'title', message: 'Title must be 100 characters or fewer' });
  }

  // Objective: non-empty, ≤500 chars
  if (data.objective === undefined || data.objective === null) {
    errors.push({ field: 'objective', message: 'Objective is required' });
  } else if (typeof data.objective !== 'string') {
    errors.push({ field: 'objective', message: 'Objective must be a string' });
  } else if (data.objective.trim().length === 0) {
    errors.push({ field: 'objective', message: 'Objective must not be empty' });
  } else if (data.objective.length > 500) {
    errors.push({ field: 'objective', message: 'Objective must be 500 characters or fewer' });
  }

  // Urgency: must be "low", "medium", or "high"
  if (data.urgency === undefined || data.urgency === null) {
    errors.push({ field: 'urgency', message: 'Urgency is required' });
  } else if (typeof data.urgency !== 'string') {
    errors.push({ field: 'urgency', message: 'Urgency must be a string' });
  } else if (!VALID_URGENCY.includes(data.urgency as typeof VALID_URGENCY[number])) {
    errors.push({ field: 'urgency', message: 'Urgency must be one of: low, medium, high' });
  }

  // durationWeeks: integer between 1 and 52
  if (data.durationWeeks === undefined || data.durationWeeks === null) {
    errors.push({ field: 'durationWeeks', message: 'Duration in weeks is required' });
  } else if (typeof data.durationWeeks !== 'number') {
    errors.push({ field: 'durationWeeks', message: 'Duration must be a number' });
  } else if (!Number.isInteger(data.durationWeeks)) {
    errors.push({ field: 'durationWeeks', message: 'Duration must be a whole number' });
  } else if (data.durationWeeks < 1 || data.durationWeeks > 52) {
    errors.push({ field: 'durationWeeks', message: 'Duration must be between 1 and 52 weeks' });
  }

  // requiredCapacity: must be one of 10, 20, ..., 100
  if (data.requiredCapacity === undefined || data.requiredCapacity === null) {
    errors.push({ field: 'requiredCapacity', message: 'Required capacity is required' });
  } else if (typeof data.requiredCapacity !== 'number') {
    errors.push({ field: 'requiredCapacity', message: 'Required capacity must be a number' });
  } else if (!VALID_CAPACITY.includes(data.requiredCapacity as typeof VALID_CAPACITY[number])) {
    errors.push({
      field: 'requiredCapacity',
      message: 'Required capacity must be one of: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100',
    });
  }

  // startDate: valid date string, must be ≥ today
  if (data.startDate === undefined || data.startDate === null) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  } else if (typeof data.startDate !== 'string') {
    errors.push({ field: 'startDate', message: 'Start date must be a string' });
  } else {
    const parsed = new Date(data.startDate);
    if (isNaN(parsed.getTime())) {
      errors.push({ field: 'startDate', message: 'Start date must be a valid date' });
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDay = new Date(parsed);
      startDay.setHours(0, 0, 0, 0);
      if (startDay < today) {
        errors.push({ field: 'startDate', message: 'Start date must not be in the past' });
      }
    }
  }

  // businessUnit: must be "Digital Platforms"
  if (data.businessUnit === undefined || data.businessUnit === null) {
    errors.push({ field: 'businessUnit', message: 'Business unit is required' });
  } else if (typeof data.businessUnit !== 'string') {
    errors.push({ field: 'businessUnit', message: 'Business unit must be a string' });
  } else if (data.businessUnit !== REQUIRED_BUSINESS_UNIT) {
    errors.push({
      field: 'businessUnit',
      message: 'Only the "Digital Platforms" business unit is supported in this prototype',
    });
  }

  return errors;
}
