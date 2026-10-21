import React from 'react';
import { Calendar, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import { CouponBadge } from '../ui/Badge';

export interface WelcomeHeroProps {
  onOpenSample: () => void;
  onCreateEvent: () => void;
}

export function WelcomeHero({ onOpenSample, onCreateEvent }: WelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden py-10 md:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2">
          <CouponBadge variant="marigold">
            Celebration &amp; Event Planning Studio
          </CouponBadge>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-neutral-text tracking-tight leading-[1.12]">
          Every Milestone Celebration,<br />
          <span className="text-secondary italic">Chronologically Ordered</span> &amp; Costed.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-text/90 leading-relaxed font-sans text-pretty">
          From multi-day vivaha ceremonies and milestone birthdays to vibrant community festivals.
          Plan with deterministic budget certainty, timeline milestones, and local-first browser privacy.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onCreateEvent}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text hover:text-white font-semibold px-6 py-3 rounded-md transition-all shadow-sm active:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-text focus-visible:outline-offset-2"
          >
            <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
            <span>Create New Celebration</span>
          </button>

          <button
            type="button"
            onClick={onOpenSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border font-medium px-6 py-3 rounded-md transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-text focus-visible:outline-offset-2"
          >
            <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
            <span>Explore Sample Event</span>
          </button>
        </div>

        {/* Local Storage Transparency Callout */}
        <div className="pt-6 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs text-neutral-text/80 bg-neutral-subtle/80 border border-neutral-border px-3.5 py-1.5 rounded-full shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
            <span>
              <strong>Local-First Storage:</strong> Your event plans remain private in this browser profile. No cloud accounts required.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
