'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  headerActions?: React.ReactNode;
  accentBar?: boolean;
  contentPadding?: boolean;
}

function subscribe() {
  return () => {};
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  headerActions,
  accentBar,
  contentPadding = true,
}: DialogProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      // Disable body scroll when modal is active
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside dialog
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        // Trap focus
        if (e.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !isClient) return null;

  const maxWidthStyles = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '4xl': 'max-w-7xl',
    '5xl': 'max-w-7xl',
  }[maxWidth] || 'max-w-xl';

  const dialogElement = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="presentation"
    >
      {/* Full-screen backdrop with soft blur and warm editorial dimming */}
      <div
        className="fixed inset-0 bg-neutral-text/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface - Centered, bounded max height, pinned header, scrollable body */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={`relative w-full ${maxWidthStyles} max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col bg-neutral-surface rounded-xl border border-neutral-border shadow-drawer z-10 my-auto overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150`}
      >
        {/* Optional Panchang Top Accent */}
        {accentBar && (
          <div className="h-1.5 w-full bg-gradient-to-r from-[#D97706] via-[#C2410C] to-[#B45309] flex-shrink-0" />
        )}

        {/* Pinned Dialog Header */}
        <div className="flex items-start justify-between border-b border-neutral-border px-4 py-4 sm:px-8 sm:py-6 flex-shrink-0 bg-neutral-surface">
          <div className="pr-2 flex-1 min-w-0">
            {typeof title === 'string' ? (
              <h2
                id="dialog-title"
                className="font-display text-xl sm:text-2xl font-semibold text-neutral-text leading-tight break-words"
              >
                {title}
              </h2>
            ) : (
              <div id="dialog-title" className="break-words">{title}</div>
            )}
            {description && (
              <p id="dialog-description" className="text-xs sm:text-sm text-neutral-muted mt-1 leading-normal">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3 sm:ml-4">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-neutral-muted hover:text-neutral-text hover:bg-neutral-subtle p-1.5 rounded-md transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className={`flex-1 overflow-y-auto ${contentPadding ? 'px-4 py-4 sm:px-8 sm:py-6' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(dialogElement, document.body);
}
