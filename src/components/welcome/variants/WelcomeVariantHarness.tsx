'use client';

import React, { useState, useEffect } from 'react';
import { LandingVariantId } from './types';
import { VariantSwitcherHUD } from './VariantSwitcherHUD';
import { WelcomeHero } from '../WelcomeHero';
import { EventTypeCards } from '../EventTypeCards';
import { SavedEventsList } from '../SavedEventsList';
import { EditorialBroadsheetHero } from './EditorialBroadsheetHero';
import { CinematicNocturneHero } from './CinematicNocturneHero';
import { ExpressiveUtsavHero } from './ExpressiveUtsavHero';
import { InteractiveChronicleHero } from './InteractiveChronicleHero';
import { Event, EventType } from '../../../features/events/types';

export interface WelcomeVariantHarnessProps {
  onOpenSample: () => void;
  onCreateEvent: () => void;
  onSelectType: (type: EventType) => void;
  personalEvents: Event[];
  onSelectSavedEvent: (id: string) => void;
  onDeleteEvent: (id: string, title: string) => void;
}

const STORAGE_KEY = 'eventpilot_landing_variant';

export function WelcomeVariantHarness({
  onOpenSample,
  onCreateEvent,
  onSelectType,
  personalEvents,
  onSelectSavedEvent,
  onDeleteEvent,
}: WelcomeVariantHarnessProps) {
  const [activeVariant, setActiveVariant] = useState<LandingVariantId>('baseline');
  const [isReducedMotionForced, setIsReducedMotionForced] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Restore saved variant preference from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (
        saved === 'baseline' ||
        saved === 'editorial' ||
        saved === 'cinematic' ||
        saved === 'expressive' ||
        saved === 'interactive'
      ) {
        setActiveVariant(saved);
      }
    } catch {
      // Ignore storage errors on restricted environments
    }
  }, []);

  const handleSelectVariant = (id: LandingVariantId) => {
    setActiveVariant(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore
    }
  };

  const handleToggleReducedMotion = () => {
    setIsReducedMotionForced((prev) => !prev);
  };

  const heroProps = {
    onOpenSample,
    onCreateEvent,
    onSelectType,
  };

  return (
    <div className={`relative ${isReducedMotionForced ? 'motion-reduce' : ''}`}>
      {/* Active Design Variant Renderer */}
      {activeVariant === 'baseline' && (
        <div className="space-y-6">
          <WelcomeHero onOpenSample={onOpenSample} onCreateEvent={onCreateEvent} />
          <EventTypeCards onSelectType={onSelectType} />
        </div>
      )}

      {activeVariant === 'editorial' && (
        <EditorialBroadsheetHero {...heroProps} />
      )}

      {activeVariant === 'cinematic' && (
        <CinematicNocturneHero {...heroProps} />
      )}

      {activeVariant === 'expressive' && (
        <ExpressiveUtsavHero {...heroProps} />
      )}

      {activeVariant === 'interactive' && (
        <InteractiveChronicleHero {...heroProps} />
      )}

      {/* Persistent Saved Events Ledger (Unified across all variants) */}
      {mounted && (
        <SavedEventsList
          events={personalEvents}
          onSelectEvent={onSelectSavedEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}

      {/* Floating Design Variant Switcher HUD */}
      {mounted && (
        <VariantSwitcherHUD
          activeVariant={activeVariant}
          onSelectVariant={handleSelectVariant}
          isReducedMotionForced={isReducedMotionForced}
          onToggleReducedMotion={handleToggleReducedMotion}
        />
      )}
    </div>
  );
}
