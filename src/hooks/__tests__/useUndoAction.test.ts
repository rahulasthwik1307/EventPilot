import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useUndoAction } from '../useUndoAction';

describe('useUndoAction hook', () => {
  it('initializes with default closed state and null item', () => {
    const { result } = renderHook(() => useUndoAction<{ id: string; name: string }>());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingItem).toBeNull();
    expect(result.current.message).toBe('');
  });

  it('stages an item with a message and opens state', () => {
    const { result } = renderHook(() => useUndoAction<{ id: string; name: string }>());

    act(() => {
      result.current.stage({ id: 'item_1', name: 'Floral decor' }, 'Deleted Floral decor');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.pendingItem).toEqual({ id: 'item_1', name: 'Floral decor' });
    expect(result.current.message).toBe('Deleted Floral decor');
  });

  it('dismisses staged item and resets state', () => {
    const { result } = renderHook(() => useUndoAction<{ id: string }>());

    act(() => {
      result.current.stage({ id: 'item_1' }, 'Deleted item');
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingItem).toBeNull();
    expect(result.current.message).toBe('');
  });

  it('consumes staged item atomically and clears state', () => {
    const { result } = renderHook(() => useUndoAction<{ id: string; amount: number }>());

    act(() => {
      result.current.stage({ id: 'exp_1', amount: 5000 }, 'Expense deleted');
    });

    let consumed: { id: string; amount: number } | null = null;
    act(() => {
      consumed = result.current.consume();
    });

    expect(consumed).toEqual({ id: 'exp_1', amount: 5000 });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingItem).toBeNull();
    expect(result.current.message).toBe('');
  });

  it('returns null when consuming an empty state', () => {
    const { result } = renderHook(() => useUndoAction<string>());

    let consumed: string | null = null;
    act(() => {
      consumed = result.current.consume();
    });

    expect(consumed).toBeNull();
  });
});
