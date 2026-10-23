'use client';

import React, { useState } from 'react';
import { VariantHeroProps } from './types';
import { EventType } from '../../../features/events/types';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet,
  Users,
  Clock,
  Heart,
  Cake,
  Sliders,
  Sparkle
} from 'lucide-react';
import { formatCurrency } from '../../../features/events/validation';

export function InteractiveChronicleHero({
  onOpenSample,
  onCreateEvent,
  onSelectType,
}: VariantHeroProps) {
  // Interactive Celebration Simulator state
  const [guestCount, setGuestCount] = useState<number>(250);
  const [selectedStage, setSelectedStage] = useState<number>(0);

  // Deterministic simulation calculations based on guest count slider
  const simulatedBudget = Math.round((guestCount * 7500) / 10000) * 10000;
  const simulatedTables = Math.ceil(guestCount / 8);
  const simulatedVendors = Math.min(18, Math.max(6, Math.round(guestCount / 25) + 4));

  const journeyStages = [
    {
      id: 0,
      title: '1. Muhurtam & Dates',
      subtitle: 'Chronological Rituals',
      detail:
        'Lock auspicious ceremony windows. Organize multi-day timeline countdowns down to the minute.',
      metric: '9 Scheduled Milestones',
    },
    {
      id: 1,
      title: '2. Budget & Ledgers',
      subtitle: 'Deterministic Rupee Control',
      detail:
        'Zero-leakage expense tracking across 12 standard cultural categories with live variance alerts.',
      metric: '₹25,00,000 Verified Cap',
    },
    {
      id: 2,
      title: '3. Seating & RSVPs',
      subtitle: 'Family & Dietary Matrices',
      detail:
        'Track multi-ceremony attendance, dietary restrictions, and interactive 8-seat table allocations.',
      metric: '350 Confirmed Seats',
    },
    {
      id: 3,
      title: '4. Live Execution',
      subtitle: 'Master Day-Of Control',
      detail:
        'Real-time coordination matrix for pandits, caterers, decorators, and family ceremony heads.',
      metric: '100% Client-Side Privacy',
    },
  ];

  return (
    <section className="py-8 md:py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Storytelling Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-hover text-xs font-semibold">
            <Sparkle className="w-3.5 h-3.5 text-primary" />
            <span>Interactive Chronicle · Experience EventPilot</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-neutral-text tracking-tight leading-[1.12]">
            The Living Chronicle of Your Celebration.
          </h1>

          <p className="text-base sm:text-lg text-neutral-text/85 font-sans leading-relaxed max-w-2xl mx-auto text-pretty">
            Move seamlessly from auspicious date selection to deterministic budget allocations, vendor contracts,
            and family seating. Test the interactive planning engine below.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onCreateEvent}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-semibold px-6 py-3 rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
              <span>Create Your Celebration</span>
            </button>

            <button
              type="button"
              onClick={onOpenSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border font-medium px-6 py-3 rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
              <span>Explore Pre-Loaded Almanac</span>
            </button>
          </div>
        </div>

        {/* 4-Stage Celebration Journey Stepper */}
        <div className="bg-neutral-surface border border-neutral-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-border/60">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-secondary font-semibold">
                The 4-Stage Planning Journey
              </span>
              <h2 className="font-display text-xl font-semibold text-neutral-text">
                Chronological Milestone Architecture
              </h2>
            </div>
            <span className="text-xs text-neutral-muted hidden sm:inline">
              Click any stage to inspect details
            </span>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {journeyStages.map((stage) => {
              const isSelected = stage.id === selectedStage;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStage(stage.id)}
                  className={`text-left p-3.5 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'bg-secondary-subtle/50 border-secondary shadow-xs'
                      : 'bg-neutral-subtle/40 border-neutral-border hover:bg-neutral-subtle hover:border-neutral-border-strong'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-xs font-mono font-bold block mb-1 text-neutral-text">
                    {stage.title}
                  </span>
                  <span className="text-xs text-neutral-muted block truncate">
                    {stage.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Callout Card */}
          <div className="bg-neutral-bg border border-neutral-border p-4 sm:p-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-secondary font-semibold">
                {journeyStages[selectedStage].subtitle}
              </span>
              <p className="text-sm text-neutral-text font-medium max-w-xl">
                {journeyStages[selectedStage].detail}
              </p>
            </div>
            <div className="bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md font-mono text-xs whitespace-nowrap self-stretch sm:self-auto text-center sm:text-right">
              <span className="text-neutral-muted block text-xs">System Benchmark</span>
              <span className="font-bold text-neutral-text">{journeyStages[selectedStage].metric}</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Celebration Simulator Card */}
        <div className="bg-gradient-to-br from-neutral-surface via-neutral-surface to-secondary-subtle/30 border border-neutral-border-strong rounded-xl p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary-hover">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-neutral-text">
                  Live Celebration Scale Simulator
                </h3>
                <p className="text-xs text-neutral-muted">
                  Drag the guest count to test real-time deterministic budget and logistics math.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-neutral-text bg-white px-3 py-1.5 rounded-md border border-neutral-border">
                {guestCount} Confirmed Guests
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="py-6 space-y-3">
            <div className="flex justify-between text-xs font-mono text-neutral-muted">
              <span>Intimate (50 Guests)</span>
              <span className="font-bold text-primary-hover">Current: {guestCount} Guests</span>
              <span>Grand Gala (500 Guests)</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full h-2 bg-neutral-border rounded-lg appearance-none cursor-pointer accent-primary"
              aria-label="Simulated guest count"
            />
          </div>

          {/* Dynamically Recalculated Output Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs pt-2">
            <div className="bg-white p-3.5 rounded-lg border border-neutral-border">
              <span className="text-neutral-muted block text-xs mb-1">Recommended Budget</span>
              <span className="text-base font-bold text-neutral-text">
                {formatCurrency(simulatedBudget, 'INR')}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-neutral-border">
              <span className="text-neutral-muted block text-xs mb-1">Dining Tables (8/table)</span>
              <span className="text-base font-bold text-neutral-text">{simulatedTables} Tables</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-neutral-border">
              <span className="text-neutral-muted block text-xs mb-1">Estimated Vendor Teams</span>
              <span className="text-base font-bold text-neutral-text">{simulatedVendors} Vendors</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-neutral-border">
              <span className="text-neutral-muted block text-xs mb-1">Storage Footprint</span>
              <span className="text-base font-bold text-status-success">100% In-Browser</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-neutral-border/60 text-xs text-neutral-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-status-success" />
              <span>Calculations are fully client-side and deterministic.</span>
            </div>
            <button
              type="button"
              onClick={onCreateEvent}
              className="font-semibold text-secondary hover:text-secondary-hover inline-flex items-center gap-1"
            >
              <span>Build Plan With {guestCount} Guests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Archetype Quick-Launch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card hover:border-neutral-border-strong transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                  <Heart className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono text-secondary font-semibold">Vivaha</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-neutral-text mb-1">
                Vivaha &amp; Weddings
              </h3>
              <p className="text-xs text-neutral-muted mb-4">
                Multi-ceremony ritual timelines, family seating matrices, and multi-category expense ledgers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectType('wedding')}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-md bg-neutral-subtle hover:bg-primary hover:text-neutral-text transition-colors"
            >
              <span>Configure Wedding</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card hover:border-neutral-border-strong transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-primary-hover">
                  <Cake className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono text-primary-hover font-semibold">Janmadina</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-neutral-text mb-1">
                Milestone Birthdays
              </h3>
              <p className="text-xs text-neutral-muted mb-4">
                Theme checklists, catering coordination, and entertainment milestones for personal celebrations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectType('birthday')}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-md bg-neutral-subtle hover:bg-primary hover:text-neutral-text transition-colors"
            >
              <span>Configure Birthday</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card hover:border-neutral-border-strong transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-neutral-subtle flex items-center justify-center text-neutral-text">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono text-neutral-text font-semibold">Utsav</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-neutral-text mb-1">
                Community Festivals
              </h3>
              <p className="text-xs text-neutral-muted mb-4">
                Volunteer delegation, civic permits, and multi-tier sponsorship ledgers for cultural melas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectType('community')}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-md bg-neutral-subtle hover:bg-primary hover:text-neutral-text transition-colors"
            >
              <span>Configure Festival</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
