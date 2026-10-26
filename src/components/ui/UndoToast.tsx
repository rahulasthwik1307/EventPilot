'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

export interface UndoToastProps {
  isOpen: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export function UndoToast({
  isOpen,
  message,
  onUndo,
  onDismiss,
  durationMs = 5000,
}: UndoToastProps) {
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsRestoring(false);
      return;
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isOpen, message, onDismiss, durationMs]);

  if (!isOpen) return null;

  const handleUndoClick = () => {
    if (isRestoring) return;
    setIsRestoring(true);
    onUndo();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md bg-neutral-surface border border-neutral-border-strong text-neutral-text rounded-xl shadow-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
        <p className="text-xs font-medium text-neutral-text truncate">{message}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleUndoClick}
          disabled={isRestoring}
          aria-label="Undo deletion"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary hover:text-primary-hover bg-primary-subtle hover:bg-primary-subtle/80 border border-primary/30 rounded-md transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isRestoring ? 'Restoring...' : 'Undo'}</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 text-neutral-muted hover:text-neutral-text rounded-md hover:bg-neutral-subtle transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
