import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UndoToast } from '../UndoToast';

describe('UndoToast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message, undo button, and dismiss button when open', () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();

    render(
      <UndoToast
        isOpen={true}
        message='Expense "Catering Advance" deleted.'
        onUndo={onUndo}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Expense "Catering Advance" deleted.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo deletion/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss notification/i })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <UndoToast
        isOpen={false}
        message="Deleted item"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.queryByText('Deleted item')).not.toBeInTheDocument();
  });

  it('triggers onUndo when clicking undo button and prevents duplicate clicks', () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();

    render(
      <UndoToast
        isOpen={true}
        message="Deleted item"
        onUndo={onUndo}
        onDismiss={onDismiss}
      />
    );

    const undoBtn = screen.getByRole('button', { name: /undo deletion/i });
    fireEvent.click(undoBtn);
    fireEvent.click(undoBtn);

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Restoring...')).toBeInTheDocument();
  });

  it('triggers onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();

    render(
      <UndoToast
        isOpen={true}
        message="Deleted item"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    const dismissBtn = screen.getByRole('button', { name: /dismiss notification/i });
    fireEvent.click(dismissBtn);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('expires automatically after durationMs (default 5000ms)', () => {
    const onDismiss = vi.fn();

    render(
      <UndoToast
        isOpen={true}
        message="Deleted item"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
        durationMs={5000}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('cleans up active timers when unmounted before expiry', () => {
    const onDismiss = vi.fn();

    const { unmount } = render(
      <UndoToast
        isOpen={true}
        message="Deleted item"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('restarts duration timer when message updates while toast remains open', () => {
    const onDismiss = vi.fn();

    const { rerender } = render(
      <UndoToast
        isOpen={true}
        message="Item A deleted"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
        durationMs={5000}
      />
    );

    // Advance 4000ms with Item A
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // Rerender with Item B
    rerender(
      <UndoToast
        isOpen={true}
        message="Item B deleted"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
        durationMs={5000}
      />
    );

    // Advance another 4000ms (total 8000ms from start, but 4000ms from Item B)
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    // Should NOT have dismissed yet because Item B restarted the 5000ms timer
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance the remaining 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
