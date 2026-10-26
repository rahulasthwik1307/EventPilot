'use client';

import { useState, useCallback } from 'react';

export interface UseUndoActionReturn<T> {
  pendingItem: T | null;
  message: string;
  isOpen: boolean;
  stage: (item: T, message: string) => void;
  dismiss: () => void;
  consume: () => T | null;
}

/**
 * useUndoAction hook
 * Encapsulates ephemeral action staging, state dismissal, and atomic item consumption
 * for temporary undo workflows (e.g., deletion undo toasts).
 */
export function useUndoAction<T>(): UseUndoActionReturn<T> {
  const [pending, setPending] = useState<{ item: T; message: string } | null>(null);

  const stage = useCallback((item: T, message: string) => {
    setPending({ item, message });
  }, []);

  const dismiss = useCallback(() => {
    setPending(null);
  }, []);

  const consume = useCallback((): T | null => {
    if (!pending) return null;
    const item = pending.item;
    setPending(null);
    return item;
  }, [pending]);

  return {
    pendingItem: pending?.item ?? null,
    message: pending?.message ?? '',
    isOpen: Boolean(pending),
    stage,
    dismiss,
    consume,
  };
}
