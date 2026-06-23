/**
 * useSquadCart — Custom hook for managing the squad cart state.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { useCallback, useMemo, useState } from 'react';
import type { CartItem, SwipeCandidate } from '../types';
import { addToCart, removeFromCart } from '../utils';

export interface UseSquadCartReturn {
  cart: CartItem[];
  add: (candidate: SwipeCandidate, role: string) => void;
  remove: (candidateId: string) => void;
  clear: () => void;
  isFull: boolean;
  contains: (id: string) => boolean;
  countByRole: Record<string, number>;
}

export function useSquadCart(): UseSquadCartReturn {
  const [cart, setCart] = useState<CartItem[]>([]);

  const add = useCallback((candidate: SwipeCandidate, role: string) => {
    setCart((prev) => addToCart(prev, candidate, role));
  }, []);

  const remove = useCallback((candidateId: string) => {
    setCart((prev) => removeFromCart(prev, candidateId));
  }, []);

  const clear = useCallback(() => {
    setCart([]);
  }, []);

  const isFull = useMemo(() => cart.length >= 20, [cart]);

  const contains = useCallback(
    (id: string) => cart.some((item) => item.candidateId === id),
    [cart]
  );

  const countByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of cart) {
      counts[item.role] = (counts[item.role] || 0) + 1;
    }
    return counts;
  }, [cart]);

  return { cart, add, remove, clear, isFull, contains, countByRole };
}
