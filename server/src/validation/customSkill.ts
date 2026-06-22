/**
 * Validates a custom skill description.
 * Custom skills must have a description between 1 and 200 characters (inclusive).
 */
export function validateCustomSkill(
  description: string | null | undefined
): { valid: boolean; error?: string } {
  if (description === null || description === undefined) {
    return { valid: false, error: 'Custom skill description is required' };
  }

  if (description.length === 0) {
    return { valid: false, error: 'Custom skill description must not be empty' };
  }

  if (description.length > 200) {
    return {
      valid: false,
      error: `Custom skill description must be at most 200 characters (got ${description.length})`,
    };
  }

  return { valid: true };
}
