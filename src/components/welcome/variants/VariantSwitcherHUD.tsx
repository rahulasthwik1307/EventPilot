'use client';

import React, { useState, useEffect } from 'react';
import { LandingVariantId, LANDING_VARIANTS } from './types';
import { Layers, ChevronUp, ChevronDown, Sparkles, Eye, Info, Check } from 'lucide-react';

export interface VariantSwitcherHUDProps {
  activeVariant: LandingVariantId;
  onSelectVariant: (id: LandingVariantId) => void;
  isReducedMotionForced: boolean;
  onToggleReducedMotion: () => void;
}

export function VariantSwitcherHUD({
  activeVariant,
  onSelectVariant,
  isReducedMotionForced,
  onToggleReducedMotion,
}: VariantSwitcherHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentMeta = LANDING_VARIANTS.find((v) => v.id === activeVariant) || LANDING_VARIANTS[0];

  // Keyboard shortcut: press 'v' or 'V' to cycle variants when not in input/textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        const currentIndex = LANDING_VARIANTS.findIndex((v) => v.id === activeVariant);
        const nextIndex = (currentIndex + 1) % LANDING_VARIANTS.length;
        onSelectVariant(LANDING_VARIANTS[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVariant, onSelectVariant]);

  return (
    <aside
      aria-label="Design variant switcher"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl"
    >
      <div className="bg-neutral-text text-neutral-bg rounded-xl shadow-2xl border border-neutral-border-strong/40 p-2 sm:p-2.5 backdrop-blur-xl bg-opacity-95 transition-all duration-200">
        {/* Main Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2">
          {/* Brand & Active Concept */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-neutral-text font-bold text-xs">
                EP
              </span>
              <div>
                <span className="text-xs font-semibold tracking-wide uppercase text-neutral-subtle/80 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>Design Variant Studio</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-xs text-neutral-subtle/70 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
              aria-expanded={isExpanded}
              aria-label="Toggle design notes"
            >
              <Info className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Design Notes</span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Segmented Switcher Controls */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto py-1 sm:py-0 scrollbar-none">
            {LANDING_VARIANTS.map((v, idx) => {
              const isActive = v.id === activeVariant;
              const shortLabel = idx === 0 ? 'Baseline' : `${idx}. ${v.label.split('. ')[1] || v.label}`;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-neutral-text font-semibold shadow-sm'
                      : 'text-neutral-subtle/80 hover:text-white hover:bg-white/10'
                  }`}
                  aria-pressed={isActive}
                >
                  {isActive && <Check className="w-3 h-3 text-neutral-text stroke-[3]" />}
                  <span>{shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Shortcut indicator & Reduced Motion toggle */}
          <div className="hidden md:flex items-center gap-3 text-xs text-neutral-subtle/60 pl-2 border-l border-white/10">
            <span className="font-mono">Press [V] to cycle</span>
            <button
              type="button"
              onClick={onToggleReducedMotion}
              className={`px-2 py-1 rounded text-xs transition-colors border ${
                isReducedMotionForced
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-semibold'
                  : 'bg-white/5 text-neutral-subtle/80 border-white/10 hover:bg-white/10'
              }`}
              title="Force reduced motion simulation for accessibility check"
            >
              {isReducedMotionForced ? 'Motion: Off' : 'Motion: Full'}
            </button>
          </div>
        </div>

        {/* Expandable Design Rationale Panel */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10 px-2 text-xs space-y-2 animate-tab-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-white text-sm">
                  {currentMeta.label} — <span className="text-primary font-normal">{currentMeta.category}</span>
                </p>
                <p className="text-neutral-subtle/80 mt-0.5">{currentMeta.tagline}</p>
              </div>
              <div className="text-xs font-mono text-neutral-subtle/70 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                Active Theme: {currentMeta.id.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-neutral-subtle/85">
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block font-medium text-white/90 mb-1">Typography Architecture:</span>
                <span>{currentMeta.typography}</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block font-medium text-white/90 mb-1">Color Palette &amp; Ground:</span>
                <span>{currentMeta.palette}</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block font-medium text-white/90 mb-1">Motion &amp; Texture Philosophy:</span>
                <span>{currentMeta.motionNote}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
