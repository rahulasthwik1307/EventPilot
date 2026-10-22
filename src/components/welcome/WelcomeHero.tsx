import React from 'react';
import { Calendar, Compass, ShieldCheck, Sparkles, ArrowRight, Heart, Wallet, Users, CheckCircle2 } from 'lucide-react';
import { CouponBadge } from '../ui/Badge';

export interface WelcomeHeroProps {
  onOpenSample: () => void;
  onCreateEvent: () => void;
}

export function WelcomeHero({ onOpenSample, onCreateEvent }: WelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden py-10 md:py-16 px-4 sm:px-6">
      {/* Decorative Auspicious Astrological Celestial Ray Motifs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-primary/5 via-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border font-medium px-6 py-3 rounded-md transition-all shadow-sm active:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-text focus-visible:outline-offset-2"
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
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-display font-semibold text-neutral-text text-base">
                  Aarav &amp; Meera&apos;s Vivaha Almanac
                </span>
                <CouponBadge variant="terracotta">Pre-Loaded Master Plan</CouponBadge>
              </div>
              <span className="text-xs font-mono text-secondary font-medium">
                89 Days to Muhurtam
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 text-xs font-mono">
              <div className="bg-neutral-subtle/60 p-2.5 rounded border border-neutral-border/50">
                <span className="text-neutral-muted block text-xs">Budget Cap</span>
                <span className="font-bold text-neutral-text">₹25,00,000</span>
              </div>
              <div className="bg-neutral-subtle/60 p-2.5 rounded border border-neutral-border/50">
                <span className="text-neutral-muted block text-xs">Milestones</span>
                <span className="font-bold text-neutral-text">9 Scheduled</span>
              </div>
              <div className="bg-neutral-subtle/60 p-2.5 rounded border border-neutral-border/50">
                <span className="text-neutral-muted block text-xs">Confirmed Seats</span>
                <span className="font-bold text-neutral-text">350 Guests</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-neutral-muted flex items-center gap-1.5 font-sans">
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
