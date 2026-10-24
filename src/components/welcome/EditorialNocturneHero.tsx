'use client';

import React from 'react';
import { EventType } from '../../features/events/types';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  Cake,
  Users,
  Clock,
  Coins,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export interface EditorialNocturneHeroProps {
  onOpenSample: () => void;
  onCreateEvent: () => void;
  onSelectType: (type: EventType) => void;
}

export function EditorialNocturneHero({
  onOpenSample,
  onCreateEvent,
  onSelectType,
}: EditorialNocturneHeroProps) {
  const archetypes: {
    type: EventType;
    numeral: string;
    folio: string;
    badgeLabel: string;
    title: string;
    tagline: string;
    description: string;
    specs: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
    }[];
    icon: React.ComponentType<{ className?: string }>;
    btnLabel: string;
  }[] = [
    {
      type: 'wedding',
      numeral: 'I',
      folio: 'MASTER FOLIO',
      badgeLabel: 'Comprehensive',
      title: 'Vivaha & Weddings',
      tagline: 'Multi-Day Ceremonial Sequence',
      description:
        'Architectural coordination of sacred rites from Sangeet to Reception with 8-seat family dining matrices.',
      specs: [
        { icon: Users, label: '350 Seats' },
        { icon: Coins, label: '12 Ledgers' },
        { icon: Clock, label: '9 Rites' },
      ],
      icon: Heart,
      btnLabel: 'Start Wedding',
    },
    {
      type: 'birthday',
      numeral: 'II',
      folio: 'JUBILEE FOLIO',
      badgeLabel: 'Intimate Atelier',
      title: 'Milestone Birthdays',
      tagline: 'Personal & Jubilee Gatherings',
      description:
        'Focused celebration schedules with custom entertainment milestones, catering coordination, and age themes.',
      specs: [
        { icon: Users, label: '75 Guests' },
        { icon: Coins, label: '6 Ledgers' },
        { icon: Cake, label: 'Theme Roster' },
      ],
      icon: Cake,
      btnLabel: 'Start Birthday',
    },
    {
      type: 'community',
      numeral: 'III',
      folio: 'CIVIC FOLIO',
      badgeLabel: 'Public Scale',
      title: 'Community Festivals',
      tagline: 'Cultural Festivals & Melas',
      description:
        'Diwali melas and society galas with municipal permit tracking, volunteer squads, and multi-tier ledgers.',
      specs: [
        { icon: Users, label: '500+ Scale' },
        { icon: Coins, label: 'Multi-Tier' },
        { icon: ShieldCheck, label: 'Permits' },
      ],
      icon: Users,
      btnLabel: 'Start Community',
    },
  ];

  return (
    <section className="pt-6 pb-14 md:pt-10 md:pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
        {/* Top Ticker Rule */}
        <div className="border-y border-neutral-border-strong py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-muted gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-neutral-text uppercase tracking-widest">
              Event Pilot · Editorial Nocturne
            </span>
            <span className="text-neutral-border-strong">/</span>
            <span className="text-secondary font-medium">Vol. MMXXVI · Panchang Edition</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-text">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-success" aria-hidden="true" />
              <span>Deterministic Math Core</span>
            </span>
            <span className="text-neutral-border-strong">·</span>
            <span className="font-semibold text-secondary">Local-First Storage</span>
          </div>
        </div>

        {/* Centered Editorial Hero Narrative */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-neutral-text tracking-tight leading-[1.08] text-balance">
            Every Milestone Celebration,<br />
            Art-Directed &amp; Audited in Secret.
          </h1>

          <p className="text-base sm:text-lg text-neutral-text/90 font-sans leading-relaxed max-w-2xl mx-auto text-pretty">
            Bridging the architectural discipline of a classical Panchang almanac with the atmospheric radiance
            of an evening celebration. Every rupee audited to the exact paisa, every ritual synchronized, and
            your entire guest registry preserved strictly within your private browser storage.
          </p>

          {/* Centered Action Cluster */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onCreateEvent}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-neutral-text font-bold px-8 py-3.5 rounded-sm transition-all shadow-sm border border-primary-hover active:translate-y-0.5 focus-visible:outline-2"
            >
              <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
              <span>Create New Celebration</span>
            </button>

            <button
              type="button"
              onClick={onOpenSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border-strong font-semibold px-7 py-3.5 rounded-sm transition-all shadow-xs active:translate-y-0.5"
            >
              <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
              <span>Explore Sample Event</span>
            </button>
          </div>

          {/* Colophon Trust Row */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 text-xs text-neutral-muted font-mono pt-1">
            <span className="flex items-center gap-1.5 text-neutral-text">
              <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" />
              <span>Zero Cloud Telemetry</span>
            </span>
            <span>·</span>
            <span>Verified Client-Side Storage</span>
            <span>·</span>
            <span className="text-secondary font-medium">100% Private</span>
          </div>
        </div>

        {/* Panoramic Live Almanac Stage — Light Ivory & Gold Dossier */}
        <div className="relative">
          {/* Subtle Ambient Warm Gold Glow Behind the Dossier */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-amber-200/30 via-orange-100/40 to-amber-200/30 rounded-2xl blur-2xl -z-10 pointer-events-none"
            aria-hidden="true"
          />

          <div className="bg-[#FAF7F0] text-neutral-text rounded-xl border-2 border-amber-400/60 p-6 sm:p-8 shadow-xl shadow-amber-950/5 relative overflow-hidden group hover:border-amber-500/80 transition-all duration-300">
            {/* Top Folio Bar */}
            <div className="border-b border-amber-200/80 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(217,119,6,0.6)] flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                      Featured Master Almanac
                    </span>
                    <span className="text-neutral-border-strong">·</span>
                    <span className="text-xs font-mono text-neutral-muted whitespace-nowrap">
                      Panchang Vivaha Ledger
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-neutral-text tracking-tight mt-0.5">
                    Aarav &amp; Meera&apos;s Vivaha Almanac
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-white rounded px-3 py-1.5 border border-amber-200 text-xs font-mono shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                  <span className="text-neutral-text whitespace-nowrap font-medium">
                    Muhurtam: 19 Jan 2027 · 09:15 AM
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-primary bg-primary-subtle px-3 py-1.5 rounded border border-amber-300 whitespace-nowrap">
                  89 Days to Muhurtam
                </span>
              </div>
            </div>

            {/* Expansive 3-Column Panoramic Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {/* Column 1: Chronological Ceremonial Milestones */}
              <div className="space-y-3 bg-white rounded-lg p-4 border border-amber-300/80 shadow-xs hover:border-primary transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-amber-100 pb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-secondary font-bold">
                      Ceremonial Milestones
                    </span>
                    <span className="text-xs font-mono text-neutral-muted">9 Scheduled</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Milestone 1 */}
                    <div className="flex items-center justify-between text-xs py-1 border-b border-amber-50">
                      <span className="text-neutral-text font-medium">Sangeet &amp; Mehendi</span>
                      <span className="text-neutral-muted font-mono">Day -1 · Twilight</span>
                    </div>

                    {/* Milestone 2 (Auspicious Core) */}
                    <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-primary-subtle border border-amber-300/80">
                      <span className="text-amber-950 font-semibold flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-primary" />
                        <span>Vedic Muhurtam</span>
                      </span>
                      <span className="text-primary font-mono font-bold">Dawn · Locked</span>
                    </div>

                    {/* Milestone 3 */}
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-neutral-text font-medium">Royal Banquet</span>
                      <span className="text-neutral-muted font-mono">Evening · 350 Seats</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs font-mono text-neutral-muted flex items-center gap-1.5 border-t border-amber-50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
                  <span>Sequential Muhurtam schedule locked</span>
                </div>
              </div>

              {/* Column 2: Deterministic Ledgers (Stacked Full-Width Layout, Zero Overflow) */}
              <div className="space-y-3 bg-white rounded-lg p-4 border border-amber-300/80 shadow-xs hover:border-primary transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-amber-100 pb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-secondary font-bold">
                      Deterministic Ledgers
                    </span>
                    <span className="text-xs font-mono text-status-success font-bold bg-status-success-subtle px-1.5 py-0.5 rounded border border-emerald-200">
                      Audited
                    </span>
                  </div>

                  {/* Stacked Full-Width Ledger Rows */}
                  <div className="space-y-2.5 font-mono">
                    {/* Row 1: Budget Allocation */}
                    <div className="bg-[#FAF7F0] p-2.5 rounded border border-amber-200/70">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-muted font-semibold">
                          Budget Cap
                        </span>
                        <span className="font-bold text-neutral-text text-base tabular-nums">
                          ₹25,00,000
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-muted mt-1 flex items-center justify-between pt-1 border-t border-amber-200/40">
                        <span>12 Balanced Ledgers</span>
                        <span className="text-secondary font-medium">₹13.55L Recorded</span>
                      </div>
                    </div>

                    {/* Row 2: Guest Attendance & Seating */}
                    <div className="bg-[#FAF7F0] p-2.5 rounded border border-amber-200/70">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-muted font-semibold">
                          Guest Capacity
                        </span>
                        <span className="font-bold text-primary text-base tabular-nums">
                          350 Seats
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-muted mt-1 flex items-center justify-between pt-1 border-t border-amber-200/40">
                        <span>44 Tables Configured</span>
                        <span className="text-neutral-text font-medium">8-Seat Matrices</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs font-mono text-neutral-muted flex items-center justify-between border-t border-amber-50">
                  <span>Paisa Precision:</span>
                  <span className="text-status-success font-bold">Zero Math Drift</span>
                </div>
              </div>

              {/* Column 3: Local Sovereignty & Master Inspection Action */}
              <div className="space-y-4 bg-white rounded-lg p-4 border border-amber-300/80 shadow-xs hover:border-primary transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-amber-100 pb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-secondary font-bold">
                      Storage Sovereignty
                    </span>
                    <span className="text-xs font-mono text-status-success font-bold flex items-center gap-1 bg-status-success-subtle px-1.5 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                      <span>100% In-Browser</span>
                    </span>
                  </div>

                  <p className="text-xs text-neutral-text/80 leading-relaxed">
                    Zero accounts, third-party cookies, or cloud telemetry. All guest lists, ledger
                    disbursements, and seating charts live encrypted in your local device storage.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-amber-50">
                  <button
                    type="button"
                    onClick={onOpenSample}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-xs py-3 px-4 rounded-sm transition-all shadow-xs border border-primary-hover active:scale-[0.99]"
                  >
                    <span>Launch Live Master Inspection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-muted font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
                    <span>Instant sandbox · Resettable anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section II: Three Grounded Planning Templates */}
        <div className="pt-6 border-t border-neutral-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-secondary mb-1">
                <span className="font-bold uppercase tracking-widest">Section II</span>
                <span className="text-neutral-border-strong">/</span>
                <span className="font-medium text-neutral-muted">Planning Templates</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-text tracking-tight">
                Three Grounded Planning Templates
              </h2>
            </div>
            <p className="text-xs text-neutral-muted max-w-sm sm:text-right leading-relaxed">
              Pre-configured with domain-specific categories, timelines, and ceremonial structures.
            </p>
          </div>

          {/* Streamlined Compact 3-Card Grid with Categorized Metric Chips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {archetypes.map((item) => {
              const Icon = item.icon;
              const isWedding = item.type === 'wedding';
              const isBirthday = item.type === 'birthday';

              const cardBorder = isWedding
                ? 'border-amber-300/80 hover:border-primary shadow-xs hover:shadow-md'
                : isBirthday
                ? 'border-orange-300/80 hover:border-secondary shadow-xs hover:shadow-md'
                : 'border-emerald-300/80 hover:border-status-success shadow-xs hover:shadow-md';

              const iconWrap = isWedding
                ? 'bg-primary-subtle text-primary border border-amber-300/60'
                : isBirthday
                ? 'bg-secondary-subtle text-secondary border border-orange-300/60'
                : 'bg-status-success-subtle text-status-success border border-emerald-300/60';

              const btnClass = isWedding
                ? 'bg-primary text-neutral-text hover:bg-primary-hover hover:text-white border-primary-hover'
                : isBirthday
                ? 'bg-secondary text-white hover:bg-neutral-text border-secondary'
                : 'bg-status-success text-white hover:bg-neutral-text border-status-success';

              return (
                <div
                  key={item.type}
                  className={`bg-neutral-surface border ${cardBorder} rounded-lg p-5 transition-all duration-200 flex flex-col justify-between group`}
                >
                  {/* Top Folio & Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-border/70 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-secondary">
                          {item.numeral}.
                        </span>
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-muted">
                          {item.folio}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-subtle text-neutral-text border border-neutral-border">
                        {item.badgeLabel}
                      </span>
                    </div>

                    {/* Title & Icon Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-display text-lg font-bold text-neutral-text group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-neutral-muted font-medium">{item.tagline}</p>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-md ${iconWrap} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-text/90 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Footer: Categorized Metric Chips + Action Button */}
                  <div className="pt-3 border-t border-neutral-border/70 space-y-3">
                    {/* 3 Categorized Attribute Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                      {item.specs.map((spec) => {
                        const SpecIcon = spec.icon;
                        return (
                          <span
                            key={spec.label}
                            className="inline-flex items-center gap-1.5 bg-neutral-subtle border border-neutral-border/90 rounded-md px-2 py-1 text-xs font-mono font-medium text-neutral-text shadow-2xs"
                          >
                            <SpecIcon className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                            <span>{spec.label}</span>
                          </span>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectType(item.type)}
                      className={`w-full inline-flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-sm border transition-all active:scale-[0.99] shadow-xs ${btnClass}`}
                    >
                      <span>{item.btnLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
