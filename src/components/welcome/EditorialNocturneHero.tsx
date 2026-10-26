'use client';

import React, { useState, useEffect } from 'react';
import { EventType } from '../../features/events/types';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  Cake,
  Users,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { InteractiveBanquetSeatingMatrix } from './InteractiveBanquetSeatingMatrix';

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
  const [activeTab, setActiveTab] = useState<EventType>('wedding');
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  const subtitleTags = [
    'Deterministic Paisa Arithmetic',
    'Auspicious Panchang Muhurtam',
    'Private Client-Side Storage',
    'Zero Cloud Telemetry',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitleTags.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [subtitleTags.length]);

  const archetypes = [
    {
      type: 'wedding' as EventType,
      folio: 'Master Folio',
      badgeLabel: 'Vivaha Ceremony',
      title: 'Vivaha & Weddings',
      tagline: 'Multi-Day Sacred Ceremonies',
      description:
        'Architectural coordination of sacred rites from Sangeet to Reception with 8-seat family dining matrices and authentic Vedic Muhurtam windows.',
      image: '/assets/images/wedding_vivaha.jpg',
      muhurtam: '19 Jan 2027 · 09:15 AM (Dawn Locked)',
      seats: '350 Seats',
      ledgers: '12 Balanced Ledgers',
      rites: '9 Sacred Rites',
      budgetCap: '₹25,00,000',
      recorded: '₹13,55,000',
      btnLabel: 'Start Wedding',
      icon: Heart,
    },
    {
      type: 'birthday' as EventType,
      folio: 'Jubilee Folio',
      badgeLabel: 'Milestone Jubilee',
      title: 'Milestone Birthdays',
      tagline: 'Personal & Family Milestones',
      description:
        'Focused celebration schedules with custom entertainment milestones, catering coordination, theme rosters, and heartfelt multi-generational guest lists.',
      image: '/assets/images/birthday_jubilee.jpg',
      muhurtam: '28 Nov 2026 · Twilight Gala',
      seats: '75 Guests',
      ledgers: '6 Balanced Ledgers',
      rites: 'Theme Roster',
      budgetCap: '₹2,50,000',
      recorded: '₹1,12,000',
      btnLabel: 'Start Birthday',
      icon: Cake,
    },
    {
      type: 'community' as EventType,
      folio: 'Civic Folio',
      badgeLabel: 'Public Scale',
      title: 'Community Festivals',
      tagline: 'Cultural Melas & Celebrations',
      description:
        'Diwali melas and society galas with municipal permit tracking, volunteer squads, public stage timing, and multi-tier funding ledgers.',
      image: '/assets/images/community_mela.jpg',
      muhurtam: '04 Nov 2026 · Auspicious Evening',
      seats: '500+ Scale',
      ledgers: 'Multi-Tier Ledgers',
      rites: 'Civic Permits',
      budgetCap: '₹8,00,000',
      recorded: '₹4,40,000',
      btnLabel: 'Start Community',
      icon: Users,
    },
  ];

  const currentFolio = archetypes.find((a) => a.type === activeTab) || archetypes[0];

  return (
    <div className="space-y-24 py-8 md:py-16">
      {/* 1. Hero Showcase Section */}
      <section className="space-y-12">
        {/* Editorial Headline & Narrative Cluster */}
        <div className="text-center max-w-6xl mx-auto space-y-6">
          <h1 className="font-display text-[26px] sm:text-4xl lg:text-[4.25rem] font-bold text-neutral-text leading-[1.2] sm:leading-[1.2] lg:leading-[1.18] tracking-tight pb-1 motion-enter">
            Every Milestone Celebration,<br className="hidden lg:inline" /> Art-Directed &amp; Audited
          </h1>

          <p className="text-base sm:text-lg text-neutral-text font-normal leading-relaxed max-w-3xl mx-auto motion-enter">
            Bridging the architectural discipline of a classical Panchang almanac with the radiant warmth of
            an evening celebration. Every rupee audited to the exact paisa, every ritual synchronized, and
            your entire guest registry preserved strictly within your private browser storage.
          </p>

          {/* Subtitle Animated Feature Pill */}
          <div className="flex items-center justify-center gap-2 text-sm text-secondary font-medium motion-enter">
            <span className="w-2 h-2 rounded-full bg-status-success" aria-hidden="true" />
            <span key={subtitleIndex} className="animate-fade-in-rise">
              Active Core: {subtitleTags[subtitleIndex]}
            </span>
          </div>

          {/* Hero Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={onCreateEvent}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-neutral-text font-bold px-8 py-3.5 rounded-md transition-all active:translate-y-0.5 motion-enter"
            >
              <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
              <span>Create New Celebration</span>
            </button>

            <button
              type="button"
              onClick={onOpenSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text font-semibold px-7 py-3.5 rounded-md transition-all active:translate-y-0.5 motion-enter"
            >
              <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
              <span>Explore Sample Event</span>
            </button>
          </div>

          {/* Colophon Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-text pt-2 motion-enter">
            <span className="flex items-center gap-1.5 text-neutral-text font-medium">
              <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" />
              <span>Zero Cloud Telemetry</span>
            </span>
            <span>·</span>
            <span>Verified Client-Side Storage</span>
            <span>·</span>
            <span className="text-secondary font-semibold">100% Private &amp; Offline Ready</span>
          </div>
        </div>

        {/* Grand Dominant Hero Illustration */}
        <div className="relative rounded-2xl overflow-hidden bg-neutral-surface mt-8 motion-enter">
          <div className="relative overflow-hidden rounded-xl">
            <img
              src="/assets/images/hero_celebration.jpg"
              alt="Grand Indian celebration feast under glowing lanterns with festive guests"
              className="w-full h-[500px] sm:h-[600px] lg:h-[680px] object-cover hover:scale-[1.01] transition-transform duration-700 ease-out"
            />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-neutral-surface/95 backdrop-blur-xs p-4 sm:p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-secondary">
                  The Living Almanac
                </p>
                <div className="font-display text-xl sm:text-2xl font-bold text-neutral-text">
                  Aarav &amp; Meera&apos;s Vivaha Almanac
                </div>
                <p className="text-base text-neutral-text mt-0.5">
                  Vedic Muhurtam locked · 350 Guests · 12 Ledgers balanced to exact paisa
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenSample}
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm px-5 py-2.5 rounded-md transition-colors whitespace-nowrap"
              >
                <span>Launch Master Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Celebration Folio Switcher & Live Sandbox */}
      <section className="space-y-8 bg-neutral-subtle p-6 sm:p-10 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-text">
              Interactive Celebration Folios
            </h2>
            <p className="text-base text-neutral-text mt-1 max-w-xl">
              Switch between event archetypes to inspect pre-built ceremonial structures, deterministic
              budgets, and milestone calendars.
            </p>
          </div>

          {/* Archetype Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-neutral-surface p-1.5 rounded-lg">
            {archetypes.map((item) => {
              const isSelected = activeTab === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setActiveTab(item.type)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all motion-enter ${
                    isSelected
                      ? 'bg-primary text-neutral-text shadow-xs'
                      : 'text-neutral-text hover:bg-neutral-subtle'
                  }`}
                >
                  {item.folio}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Folio Content Panel */}
        <div className="bg-neutral-surface rounded-xl p-6 sm:p-8 animate-tab-enter key={currentFolio.type}">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Folio Image Column */}
            <div className="lg:col-span-6 overflow-hidden rounded-xl bg-neutral-bg">
              <img
                src={currentFolio.image}
                alt={currentFolio.title}
                className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>

            {/* Folio Details Column */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-neutral-text">
                  {currentFolio.title}
                </div>
                <p className="text-base text-secondary font-medium mt-1">
                  {currentFolio.tagline}
                </p>
                <p className="text-base text-neutral-text mt-3 leading-relaxed">
                  {currentFolio.description}
                </p>
              </div>

              {/* Folio Metrics Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-subtle p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-text">Guest Scale</p>
                  <p className="text-lg font-bold text-neutral-text mt-0.5">
                    {currentFolio.seats}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-text">Budget Cap</p>
                  <p className="text-lg font-bold text-secondary mt-0.5">
                    {currentFolio.budgetCap}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-text">Timeline</p>
                  <p className="text-lg font-bold text-secondary mt-0.5">
                    {currentFolio.rites}
                  </p>
                </div>
              </div>

              {/* Folio Action Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectType(currentFolio.type)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm px-6 py-3 rounded-md transition-all active:translate-y-0.5"
                >
                  <span>Launch {currentFolio.badgeLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenSample}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-subtle hover:bg-neutral-bg text-neutral-text font-semibold text-sm px-5 py-3 rounded-md transition-colors"
                >
                  <Compass className="w-4 h-4 text-secondary" />
                  <span>Inspect in Sandbox</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. One Live Thing: Interactive Banquet Seating Matrix Centerpiece */}
      <InteractiveBanquetSeatingMatrix />

      {/* 4. Three Grounded Planning Templates (Archetype Gallery) */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-text">
              Three Grounded Planning Templates
            </h2>
            <p className="text-base text-neutral-text mt-1 max-w-xl">
              Carefully researched domain templates pre-configured with distinct category ledgers,
              timelines, and ceremonial frameworks.
            </p>
          </div>
          <span className="text-sm font-semibold text-secondary">
            Select an archetype to launch directly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {archetypes.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                className="bg-neutral-surface rounded-2xl overflow-hidden flex flex-col justify-between group hover:translate-y-[-4px] transition-transform duration-300 motion-enter"
              >
                <div>
                  <div className="relative h-56 overflow-hidden bg-neutral-bg">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-4 left-4 bg-neutral-surface/95 backdrop-blur-xs px-3 py-1 rounded-full text-sm font-bold text-secondary">
                      {item.folio}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl font-bold text-neutral-text">
                        {item.title}
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="text-sm font-medium text-secondary">{item.tagline}</p>

                    <p className="text-base text-neutral-text leading-relaxed">
                      {item.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 bg-neutral-subtle p-3 rounded-lg text-center">
                      <div>
                        <p className="text-sm font-medium text-neutral-text">Scale</p>
                        <p className="text-sm font-bold text-neutral-text mt-0.5">{item.seats}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-text">Ledgers</p>
                        <p className="text-sm font-bold text-neutral-text mt-0.5">{item.ledgers}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-text">Timeline</p>
                        <p className="text-sm font-bold text-neutral-text mt-0.5">{item.rites}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => onSelectType(item.type)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm py-3 px-4 rounded-md transition-colors"
                  >
                    <span>{item.btnLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. The Planner's Atelier: Local Storage Sovereignty */}
      <section className="bg-neutral-surface rounded-2xl overflow-hidden p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-text">
              Private Atelier Storage Sovereignty
            </h2>

            <p className="text-base text-neutral-text leading-relaxed">
              Every celebration plan you craft in Event Pilot stays 100% on your device. There are no
              mandatory user accounts, no vendor telemetries, and no databases storing your personal family
              records.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                <p className="text-base text-neutral-text">
                  <strong>Paisa-Exact Ledgers:</strong> Pure deterministic math calculates budgets, costs per
                  guest, and vendor payments without AI hallucination.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                <p className="text-base text-neutral-text">
                  <strong>Panchang Astronomical Offsets:</strong> Timelines adapt dynamically around your
                  wedding or festival date with leap year and calendar safety.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                <p className="text-base text-neutral-text">
                  <strong>Full Offline Resilience:</strong> Open and manage your saved events even without an
                  active internet connection.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onCreateEvent}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm px-6 py-3 rounded-md transition-colors"
              >
                <span>Draft Celebration in Your Atelier</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 overflow-hidden rounded-xl">
            <img
              src="/assets/images/planner_atelier.jpg"
              alt="Cozy event planner atelier with open almanac notebook, blueprints, and warm desk lamp"
              className="w-full h-auto object-cover rounded-xl hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>
        </div>
      </section>

      {/* 7. The Final Invitation Call to Action */}
      <section className="bg-neutral-text text-neutral-bg rounded-2xl p-8 sm:p-12 text-center space-y-6">
        <h2 className="font-display text-2xl sm:text-4xl font-bold text-neutral-bg">
          Begin Your Celebration Almanac
        </h2>
        <p className="text-base sm:text-lg text-neutral-border max-w-2xl mx-auto leading-relaxed">
          From the first auspicious Muhurtam to the final banquet seat. Experience calm, disciplined, and
          inspired event planning completely within your browser.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={onCreateEvent}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-neutral-text font-bold px-8 py-3.5 rounded-md transition-all active:translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-neutral-text" />
            <span>Start Your Celebration Folio</span>
          </button>
          <button
            type="button"
            onClick={onOpenSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-surface text-neutral-text hover:bg-neutral-subtle font-semibold px-7 py-3.5 rounded-md transition-all"
          >
            <Compass className="w-4 h-4 text-secondary" />
            <span>Explore Sample Sandbox</span>
          </button>
        </div>
      </section>
    </div>
  );
}
