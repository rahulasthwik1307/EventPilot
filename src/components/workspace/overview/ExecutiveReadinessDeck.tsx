'use client';

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Event } from '../../../features/events/types';
import { formatCurrency } from '../../../features/events/validation';
import { ReadinessResult } from '../../../features/events/readiness-engine';
import { CouponBadge } from '../../ui/Badge';

export interface ExecutiveReadinessDeckProps {
  event: Event;
  categoriesCount: number;
  totalAllocated: number;
  taskMetrics: { total: number; completed: number; overdue: number; pct: number };
  seatingSummary: { totalTables: number };
  vendorFinancials: { bookedCount: number };
  attendanceSummary: { expectedAttendance: number };
  readiness: ReadinessResult;
  lastSavedAt?: string;
  onEdit: () => void;
  onReplan?: () => void;
}

export function ExecutiveReadinessDeck({
  event,
  categoriesCount,
  totalAllocated,
  taskMetrics,
  seatingSummary,
  vendorFinancials,
  attendanceSummary,
  readiness,
  lastSavedAt,
  onEdit,
  onReplan,
}: ExecutiveReadinessDeckProps) {
  // SVG Gauge calculations for the Master Readiness Dial
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readiness.score / 100) * circumference;

  return (
    <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-7 shadow-card relative overflow-hidden">
      {/* Panchang Ceremonial Accent Header Hairline */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Health Narrative & Operational Highlights */}
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-secondary font-bold">
              Almanac Executive Deck
            </span>
            <CouponBadge variant="marigold">Live Execution Health</CouponBadge>
          </div>

          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-text tracking-tight">
              Celebration Master Health &amp; Readiness
            </h2>
            <p className="text-xs sm:text-sm text-neutral-muted mt-1 leading-relaxed">
              Deterministic mathematical tracking across budget capital, ritual milestones, guest attendance, and banquet seating.
            </p>
          </div>

          {/* Cultural Tradition / Theme Banner (Full text, never truncated!) */}
          {event.culturalContext?.traditionOrTheme && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary-subtle border border-primary/30 text-neutral-text text-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="font-semibold text-neutral-text">Tradition &amp; Ritual:</span>
              <span className="font-medium text-neutral-text/90">
                {event.culturalContext.traditionOrTheme}
              </span>
            </div>
          )}

          {/* High-Level Pulse Badges (Data not shown in top bar) */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-0.5">
            <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
              <strong className="text-primary">{categoriesCount}</strong> Categories Budgeted
            </span>
            <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
              <strong className="text-secondary">{taskMetrics.completed}/{taskMetrics.total}</strong> Tasks Completed
            </span>
            <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
              <strong className="text-status-success">{seatingSummary.totalTables}</strong> Tables Arranged
            </span>
            <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
              <strong className="text-neutral-text">{vendorFinancials.bookedCount}</strong> Vendors Booked
            </span>
          </div>
        </div>

        {/* Right Column: Master Execution Score Card with Authority Dial */}
        <div className="w-full lg:w-[350px] flex-shrink-0 bg-neutral-bg border border-neutral-border-strong rounded-xl p-5 shadow-xs relative overflow-hidden">
          {/* Subtle top ceremonial accent */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/80 via-secondary/80 to-primary/40" />

          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-neutral-border/60">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-bold flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Execution Score
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold text-neutral-text leading-tight">
                Master Readiness
              </h3>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-subtle border border-neutral-border/50">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    readiness.score >= 70
                      ? 'bg-status-success'
                      : readiness.score >= 40
                      ? 'bg-primary'
                      : 'bg-secondary'
                  }`}
                />
                <span className="font-semibold text-neutral-text">
                  {readiness.score >= 70
                    ? 'High Readiness'
                    : readiness.score >= 40
                    ? 'Steady Pacing'
                    : 'Setup & Allocation'}
                </span>
                <span className="text-neutral-muted">· 3 Pillars</span>
              </div>
            </div>

            {/* Authority Radial Score Dial */}
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
              <svg aria-hidden="true" className="w-18 h-18 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-neutral-border"
                  strokeWidth="6.5"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-primary transition-all duration-700 ease-out"
                  strokeWidth="6.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="flex items-baseline">
                  <span className="font-mono text-2xl font-black text-neutral-text tabular-nums leading-none tracking-tight">
                    {readiness.score}
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-muted leading-none">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Pillar Progress Rows with Concrete Data Context */}
          <div className="space-y-3 pt-3.5">
            {/* Pillar 1: Budget Capital */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-text flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Budget Allocation</span>
                </span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-[11px] text-neutral-muted tabular-nums">
                    {formatCurrency(totalAllocated, event.currency)}
                  </span>
                  <span className="font-bold text-neutral-text text-xs tabular-nums">
                    {readiness.budgetScore}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-border/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${readiness.budgetScore}%` }}
                />
              </div>
            </div>

            {/* Pillar 2: Ritual Tasks */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-text flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                  <span>Milestone Tasks</span>
                </span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-[11px] text-neutral-muted tabular-nums">
                    {taskMetrics.completed}/{taskMetrics.total} tasks
                  </span>
                  <span className="font-bold text-neutral-text text-xs tabular-nums">
                    {readiness.taskScore}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-border/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500"
                  style={{ width: `${readiness.taskScore}%` }}
                />
              </div>
            </div>

            {/* Pillar 3: Guest Attendance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-text flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
                  <span>Guest Attendance</span>
                </span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-[11px] text-neutral-muted tabular-nums">
                    {attendanceSummary.expectedAttendance}/{event.guestTarget} target
                  </span>
                  <span className="font-bold text-neutral-text text-xs tabular-nums">
                    {readiness.rsvpScore}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-border/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-status-success rounded-full transition-all duration-500"
                  style={{ width: `${readiness.rsvpScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="mt-4 pt-3 border-t border-neutral-border/60 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onEdit}
              className="font-semibold text-neutral-muted hover:text-neutral-text transition-colors flex items-center gap-1 active:scale-[0.98]"
            >
              <span>Edit Baseline</span>
              <ArrowRight className="w-3 h-3 text-neutral-muted" />
            </button>

            {onReplan && (
              <button
                type="button"
                onClick={onReplan}
                className="font-bold text-primary hover:text-primary-hover flex items-center gap-1 active:scale-[0.98] transition-all px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20"
              >
                <Sliders className="w-3 h-3" />
                <span>Dynamic Replan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sync Note Footer */}
      <div className="border-t border-neutral-border/60 mt-4 pt-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-muted gap-2 font-mono">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
          <span>
            Local-First Browser Engine (v1)
            {lastSavedAt ? ` · Last synced at ${lastSavedAt}` : ''}
          </span>
        </div>
        <div className="text-neutral-text-muted">
          Deterministic mathematics · Zero delegated arithmetic
        </div>
      </div>
    </section>
  );
}
