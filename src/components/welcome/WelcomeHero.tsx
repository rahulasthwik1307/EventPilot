import React from 'react';
import { Calendar, Compass, ShieldCheck, Sparkles, ArrowRight, Heart, Wallet, Users, CheckCircle2 } from 'lucide-react';
import { CouponBadge } from '../ui/Badge';

export interface WelcomeHeroProps {
  onOpenSample: () => void;
  onCreateEvent: () => void;
}

export function WelcomeHero({ onOpenSample, onCreateEvent }: WelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden py-12 md:py-16 px-4 sm:px-6">
      {/* Decorative Auspicious Astrological Celestial Ray Motifs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-primary/5 via-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-neutral-text tracking-tight leading-[1.14]">
          Every Milestone Celebration,<br />
          <span className="text-secondary font-semibold">Chronologically Ordered</span> &amp; Costed.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-text/90 leading-relaxed font-sans text-pretty">
          From multi-day vivaha ceremonies and milestone birthdays to vibrant community festivals.
          Plan with deterministic budget certainty, timeline milestones, and local-first browser privacy.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onCreateEvent}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text hover:text-white font-semibold px-6 py-3 rounded-md transition-all shadow-sm active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-text focus-visible:outline-offset-2"
          >
            <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
            <span>Create New Celebration</span>
          </button>

          <button
            type="button"
            onClick={onOpenSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border font-medium px-6 py-3 rounded-md transition-all shadow-sm active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-text focus-visible:outline-offset-2"
          >
            <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
            <span>Explore Sample Event</span>
          </button>
        </div>

        {/* Tactile Almanac Preview Card (Interactive stationery artifact) */}
        <div className="pt-8 max-w-2xl mx-auto text-left">
          <div className="bg-neutral-surface border border-neutral-border rounded-lg shadow-card p-5 sm:p-6 relative overflow-hidden transition-all hover:border-neutral-border-strong group">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-secondary to-primary" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-status-success" aria-hidden="true" />
                <span className="font-display font-semibold text-neutral-text text-base">
                  Aarav &amp; Meera&apos;s Vivaha Almanac
                </span>
                <CouponBadge variant="terracotta">Pre-Loaded Master Plan</CouponBadge>
              </div>
              <span className="text-xs font-mono text-secondary font-medium">
                89 Days to Muhurtam
              </span>
            </div>

            {/* Flattened Data Bar (Replaces noisy nested cards with clean hairline dividers) */}
            <div className="grid grid-cols-3 divide-x divide-neutral-border/60 py-3 my-1 border-y border-neutral-border/40 text-xs font-mono">
              <div className="px-3 first:pl-0">
                <span className="text-neutral-text/75 block text-[11px] font-sans font-medium">Budget Cap</span>
                <span className="font-bold text-neutral-text text-sm">₹25,00,000</span>
              </div>
              <div className="px-3">
                <span className="text-neutral-text/75 block text-[11px] font-sans font-medium">Milestones</span>
                <span className="font-bold text-neutral-text text-sm">9 Scheduled</span>
              </div>
              <div className="px-3 last:pr-0">
                <span className="text-neutral-text/75 block text-[11px] font-sans font-medium">Confirmed Seats</span>
                <span className="font-bold text-neutral-text text-sm">350 Guests</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-neutral-text/75 flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                <span>Deterministic math &amp; browser persistence verified</span>
              </span>
              <button
                type="button"
                onClick={onOpenSample}
                className="font-semibold text-secondary hover:text-secondary-hover inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>Open Live Sample</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Local Storage Transparency Callout */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs text-neutral-text/80 bg-neutral-surface border border-neutral-border px-4 py-2 rounded-md shadow-xs">
            <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-neutral-text">Local-First Almanac:</strong> All plans and financials stay securely in your browser profile.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
