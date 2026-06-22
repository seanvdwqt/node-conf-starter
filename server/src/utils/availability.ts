/**
 * Availability classification utility.
 *
 * Pure function that maps a candidate's free capacity percentage
 * to a human-readable availability indicator.
 *
 * Thresholds:
 *   ≥75% free  → "available"
 *   25–74% free → "partially_available"
 *   <25% free  → "unavailable"
 *   null/undefined → "unavailable"
 */

export type AvailabilityIndicator =
  | 'available'
  | 'partially_available'
  | 'unavailable';

/**
 * Classifies a candidate's availability based on their free capacity percentage.
 *
 * @param capacityFree - Percentage of capacity free (0–100), or null/undefined if unknown
 * @returns The availability indicator classification
 */
export function classifyAvailability(
  capacityFree: number | null | undefined
): AvailabilityIndicator {
  if (capacityFree === null || capacityFree === undefined) {
    return 'unavailable';
  }

  if (capacityFree >= 75) {
    return 'available';
  }

  if (capacityFree >= 25) {
    return 'partially_available';
  }

  return 'unavailable';
}
