/**
 * Swipe Squad Selector — Pure utility functions
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.4, 9.1, 9.2, 9.3, 9.4
 */

import type { Availability, CartItem, SwipeCandidate } from './types';

/**
 * Derives availability tier from a candidate's capacityFree percentage.
 *
 * - ≥75 → 'available'
 * - 25–74 → 'partially_available'
 * - <25 → 'unavailable'
 * - null/undefined → 'unavailable'
 */
export function deriveAvailability(
  capacityFree: number | null | undefined
): Availability {
  if (capacityFree == null) {
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

/**
 * Filters candidates by role, excludes unavailable and cart members,
 * and sorts by availability (available first) then yearsExperience descending.
 *
 * Returns a new array — does not mutate the input.
 */
export function filterCandidatesByRole(
  candidates: SwipeCandidate[],
  roleId: string,
  excludeIds: Set<string>
): SwipeCandidate[] {
  const availabilityOrder: Record<Availability, number> = {
    available: 0,
    partially_available: 1,
    unavailable: 2,
  };

  return candidates
    .filter(
      (c) =>
        c.currentRole === roleId &&
        c.availability !== 'unavailable' &&
        !excludeIds.has(c.id)
    )
    .sort((a, b) => {
      const availDiff =
        availabilityOrder[a.availability] - availabilityOrder[b.availability];
      if (availDiff !== 0) return availDiff;
      return b.yearsExperience - a.yearsExperience;
    });
}

/**
 * Adds a candidate to the cart if:
 * - cart has fewer than 20 items
 * - candidate is not already in the cart
 *
 * Returns a new array on success, or the unchanged cart otherwise.
 */
export function addToCart(
  cart: CartItem[],
  candidate: SwipeCandidate,
  role: string
): CartItem[] {
  if (cart.length >= 20) {
    return cart;
  }
  if (cart.some((item) => item.candidateId === candidate.id)) {
    return cart;
  }

  const newItem: CartItem = {
    candidateId: candidate.id,
    candidateName: candidate.name,
    role,
    addedAt: Date.now(),
    candidate,
  };

  return [...cart, newItem];
}

/**
 * Removes a candidate from the cart by candidateId.
 * Returns a new array without the matching item, preserving order.
 * If no item matches, returns an array identical to the input.
 */
export function removeFromCart(
  cart: CartItem[],
  candidateId: string
): CartItem[] {
  const filtered = cart.filter((item) => item.candidateId !== candidateId);
  // If nothing was removed, return the original array reference
  if (filtered.length === cart.length) {
    return cart;
  }
  return filtered;
}
