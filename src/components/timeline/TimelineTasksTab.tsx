'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  Filter,
  CheckSquare,
  ShieldCheck,
  CalendarClock,
  Sparkles,
  Sliders,
  Check,
  Flag,
  ArrowRight,
} from 'lucide-react';
import {
  ChecklistTask,
  Event,
  TaskPriority,
  TaskStatus,
  TimelineMilestone,
} from '../../features/events/types';
import {
  calculateDaysRemaining,
  formatDateDisplay,
} from '../../features/events/validation';
import {
  calculateMilestoneDate,
  filterTasks,
  groupTasksByMilestone,
  isTaskOverdue,
  TaskFilter,
} from '../../features/events/timeline-engine';
import { CouponBadge } from '../ui/Badge';
import { MilestoneDialog } from './MilestoneDialog';
import { TaskDialog } from './TaskDialog';
import { DynamicReplanningModal } from '../replanning/DynamicReplanningModal';

export interface TimelineTasksTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

export function TimelineTasksTab({ event, onUpdateEvent }: TimelineTasksTabProps) {
  // Modal states
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<TimelineMilestone | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ChecklistTask | null>(null);
  const [defaultTaskMilestoneId, setDefaultTaskMilestoneId] = useState<string | undefined>(
    undefined
  );
  const [isReplanningOpen, setIsReplanningOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const milestones = useMemo(() => event.milestones || [], [event.milestones]);
  const tasks = useMemo(() => event.tasks || [], [event.tasks]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filtered task pool
  const filteredTasks = useMemo(() => {
    let result = filterTasks(tasks, statusFilter, todayStr);
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tasks, statusFilter, priorityFilter, searchQuery, todayStr]);

  // Overall metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => isTaskOverdue(t, todayStr)).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, pct };
  }, [tasks, todayStr]);

  // Chronologically grouped milestones with their tasks
  const groups = useMemo(() => {
    return groupTasksByMilestone(milestones, filteredTasks, event.date);
  }, [milestones, filteredTasks, event.date]);

  // Handlers for Tasks
  const handleToggleTask = (task: ChecklistTask) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveTask = (taskData: {
    id: string;
    title: string;
    description?: string;
    milestoneId?: string;
    category?: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    isDueDateOverridden: boolean;
  }) => {
    const existingIndex = tasks.findIndex((t) => t.id === taskData.id);
    const now = new Date().toISOString();
    let updatedTasks: ChecklistTask[];

    if (existingIndex >= 0) {
      updatedTasks = [...tasks];
      updatedTasks[existingIndex] = {
        ...updatedTasks[existingIndex],
        ...taskData,
        updatedAt: now,
      };
    } else {
      updatedTasks = [
        ...tasks,
        {
          ...taskData,
          createdAt: now,
          updatedAt: now,
        },
      ];
    }

    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
      updatedAt: now,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handlers for Milestones
  const handleSaveMilestone = (milestoneData: {
    id: string;
    title: string;
    offsetDays: number;
    description?: string;
  }) => {
    const existingIndex = milestones.findIndex((m) => m.id === milestoneData.id);
    let updatedMilestones: TimelineMilestone[];

    if (existingIndex >= 0) {
      updatedMilestones = [...milestones];
      updatedMilestones[existingIndex] = {
        ...updatedMilestones[existingIndex],
        ...milestoneData,
      };
    } else {
      updatedMilestones = [...milestones, milestoneData];
    }

    // If milestone offset changed, adjust tasks that are anchored to this milestone and not overridden
    const newMilestoneDate = calculateMilestoneDate(event.date, milestoneData.offsetDays);
    const updatedTasks = tasks.map((t) => {
      if (t.milestoneId === milestoneData.id && !t.isDueDateOverridden) {
        return {
          ...t,
          dueDate: newMilestoneDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    onUpdateEvent({
      ...event,
      milestones: updatedMilestones,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    const updatedMilestones = milestones.filter((m) => m.id !== milestoneId);
    // Unanchor any tasks attached to this deleted milestone
    const updatedTasks = tasks.map((t) => {
      if (t.milestoneId === milestoneId) {
        return {
          ...t,
          milestoneId: undefined,
          isDueDateOverridden: true, // Keep its existing date as manual
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    onUpdateEvent({
      ...event,
      milestones: updatedMilestones,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  const daysLeft = calculateDaysRemaining(event.date);

  return (
    <div className="space-y-7">
      {/* =========================================================================
          1. HEADER & ACTION CONTROLS
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              Timeline &amp; Tasks
            </h2>
            <CouponBadge variant="marigold" title="Dates adjust with celebration date">
              Auto-Synchronized
            </CouponBadge>
          </div>
          <p className="text-xs text-neutral-muted">
            Milestones and tasks stay synchronized with your celebration date. Manual overrides are strictly protected.
          </p>
        </div>

        {/* Master Action Button Cluster - unclipped, perfectly responsive */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setIsReplanningOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-surface text-neutral-text hover:bg-neutral-subtle border border-neutral-border rounded-lg transition-all active:scale-[0.98] shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-secondary" />
            <span>Replan Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedMilestone(null);
              setIsMilestoneModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-lg transition-all active:scale-[0.98] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Add Milestone</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setDefaultTaskMilestoneId(undefined);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover rounded-lg transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. CHRONOLOGY HORIZON MASTER DECK (Ceremonial Execution Metrics)
      ========================================================================= */}
      <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-6 shadow-card relative overflow-hidden space-y-4">
        {/* Panchang Ceremonial Accent Header Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-border/60 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold block">
              Almanac Ritual Chronology
            </span>
            <h3 className="font-display text-lg sm:text-xl font-bold text-neutral-text">
              Ritual Horizon &amp; Checklist Velocity
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-muted">
            <span className="bg-neutral-subtle px-2.5 py-1 rounded-md border border-neutral-border">
              Milestones: <strong className="text-neutral-text font-bold">{milestones.length}</strong>
            </span>
            <span className="bg-neutral-subtle px-2.5 py-1 rounded-md border border-neutral-border">
              Total Tasks: <strong className="text-neutral-text font-bold">{metrics.total}</strong>
            </span>
          </div>
        </div>

        {/* 4 Execution Metric Stations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Overall Progress */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Overall Progress
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-primary-subtle border border-primary/30 text-primary">
                  {metrics.pct}%
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                {metrics.completed} / {metrics.total}
              </p>
            </div>
            <div className="mt-2 space-y-1">
              <div className="w-full h-1.5 bg-neutral-border/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${metrics.pct}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-muted font-mono">{metrics.pct}% complete</p>
            </div>
          </div>

          {/* Card 2: Pending Tasks */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Pending Tasks
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-surface border border-neutral-border text-neutral-muted">
                  Active
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                {metrics.pending}
              </p>
            </div>
            <p className="text-[11px] text-neutral-muted mt-2 font-mono">
              Awaiting action
            </p>
          </div>

          {/* Card 3: Overdue Tasks */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Overdue Tasks
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                    metrics.overdue > 0
                      ? 'bg-status-danger-subtle border-status-danger/30 text-status-danger'
                      : 'bg-status-success-subtle border-status-success/30 text-status-success'
                  }`}
                >
                  {metrics.overdue > 0 ? 'Urgent' : 'Clear'}
                </span>
              </div>
              <p
                className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
                  metrics.overdue > 0 ? 'text-status-danger' : 'text-neutral-text'
                }`}
              >
                {metrics.overdue}
              </p>
            </div>
            <p className="text-[11px] text-neutral-muted mt-2 font-mono">
              {metrics.overdue > 0 ? 'Requires attention' : 'On schedule'}
            </p>
          </div>

          {/* Card 4: Celebration Date */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Celebration Date
                </span>
                <span className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-neutral-surface border border-neutral-border text-neutral-muted whitespace-nowrap shrink-0 shadow-xs">
                  Anchor Day 0
                </span>
              </div>
              <p className="font-mono text-lg sm:text-xl font-bold text-neutral-text tracking-tight truncate">
                {event.date}
              </p>
            </div>
            <p className="text-[11px] text-neutral-muted mt-2 font-mono">
              {daysLeft >= 0 ? `${daysLeft} days away` : `${Math.abs(daysLeft)} days ago`}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. REFINED TASK FILTER & SEARCH TOOLBAR
      ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-neutral-surface border border-neutral-border rounded-xl p-3 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-semibold text-neutral-text uppercase tracking-wider flex items-center gap-1 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-secondary" />
            <span>Filter:</span>
          </span>

          <div className="flex items-center gap-1 bg-neutral-subtle p-0.5 rounded-lg border border-neutral-border">
            {(['all', 'pending', 'completed', 'overdue'] as TaskFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-label={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  statusFilter === f
                    ? 'bg-neutral-surface text-neutral-text shadow-xs border border-neutral-border'
                    : 'text-neutral-muted hover:text-neutral-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="priority-filter" className="text-neutral-muted font-medium text-xs">
              Priority:
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-neutral-subtle border border-neutral-border rounded-md px-2.5 py-1 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div className="w-full lg:w-64">
          <input
            type="text"
            placeholder="Search tasks or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-subtle border border-neutral-border rounded-md px-3 py-1 text-xs text-neutral-text placeholder:text-neutral-muted/70 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* =========================================================================
          4. CHRONOLOGICAL MILESTONE TASK GROUPS (Timeline Spine Layout)
      ========================================================================= */}
      {groups.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-neutral-border rounded-xl bg-neutral-surface">
          <Calendar className="w-9 h-9 text-neutral-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-neutral-text">No milestones or tasks found</p>
          <p className="text-xs text-neutral-muted mt-1 mb-4">
            Create celebration milestones and add checklist tasks to begin planning your timeline.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedMilestone(null);
              setIsMilestoneModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover rounded-md transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Milestone</span>
          </button>
        </div>
      ) : (
        <div className="relative sm:pl-10 space-y-7">
          {/* Continuous Vertical Ceremonial Timeline Spine */}
          <div
            className="hidden sm:block absolute left-4.5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-neutral-border to-secondary rounded-full"
            aria-hidden="true"
          />

          {groups.map(({ milestone, effectiveDate, tasks: groupTasks, completedCount, totalCount }) => {
            const isCelebrationDay = milestone.offsetDays === 0 && milestone.id !== 'independent';
            const allTasksCompleted = totalCount > 0 && completedCount === totalCount;
            const hasOverdueTasks = groupTasks.some((t) => isTaskOverdue(t, todayStr));
            const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div key={milestone.id} className="relative">
                {/* Timeline Node Bead on Left Spine */}
                <div
                  className={`hidden sm:flex absolute -left-10 top-5.5 w-9 h-9 rounded-full border-2 items-center justify-center shadow-xs transition-transform z-10 ${
                    isCelebrationDay
                      ? 'border-primary bg-primary text-neutral-surface ring-4 ring-primary/20 shadow-md scale-105'
                      : allTasksCompleted
                      ? 'border-status-success bg-status-success-subtle text-status-success'
                      : hasOverdueTasks
                      ? 'border-status-danger bg-status-danger-subtle text-status-danger ring-2 ring-status-danger/20'
                      : 'border-primary/50 bg-primary-subtle text-primary'
                  }`}
                  aria-hidden="true"
                >
                  {isCelebrationDay ? (
                    <Sparkles className="w-4.5 h-4.5 text-neutral-text" />
                  ) : allTasksCompleted ? (
                    <Check className="w-4 h-4 text-status-success" />
                  ) : hasOverdueTasks ? (
                    <AlertTriangle className="w-4 h-4 text-status-danger" />
                  ) : (
                    <Clock className="w-4 h-4 text-primary" />
                  )}
                </div>

                {/* Milestone Ceremonial Card */}
                <div
                  className={`border rounded-xl shadow-card overflow-hidden transition-all ${
                    isCelebrationDay
                      ? 'bg-gradient-to-br from-primary-subtle/30 via-neutral-surface to-secondary-subtle/20 border-2 border-primary/60 shadow-md ring-1 ring-primary/20'
                      : 'bg-neutral-surface border-neutral-border hover:border-neutral-border/90'
                  }`}
                >
                  {/* Milestone Header Banner */}
                  <div className="p-4 sm:p-5 border-b border-neutral-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-neutral-text leading-tight">
                          {milestone.title}
                        </h3>
                        {milestone.id !== 'independent' && (
                          <CouponBadge variant={isCelebrationDay ? 'marigold' : 'stone'}>
                            {milestone.offsetDays === 0
                              ? 'CELEBRATION DAY'
                              : milestone.offsetDays < 0
                              ? `${Math.abs(milestone.offsetDays)}D PRIOR`
                              : `+${milestone.offsetDays}D POST`}
                          </CouponBadge>
                        )}
                        {allTasksCompleted && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-status-success-subtle border border-status-success/30 text-status-success">
                            All Completed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-muted font-sans">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <span className="font-semibold text-neutral-text">
                            {formatDateDisplay(effectiveDate)}
                          </span>
                          <span className="font-mono text-neutral-muted">
                            ({effectiveDate})
                          </span>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {completedCount} of {totalCount} completed
                          </span>
                          {totalCount > 0 && (
                            <div className="w-16 h-1.5 bg-neutral-border/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  allTasksCompleted ? 'bg-status-success' : 'bg-primary'
                                }`}
                                style={{ width: `${completionPct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {milestone.description && (
                        <p className="text-xs text-neutral-muted mt-1 leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(null);
                          setDefaultTaskMilestoneId(
                            milestone.id !== 'independent' ? milestone.id : undefined
                          );
                          setIsTaskModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-colors shadow-xs active:scale-[0.98]"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        <span>Add Task</span>
                      </button>

                      {milestone.id !== 'independent' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setIsMilestoneModalOpen(true);
                            }}
                            aria-label={`Edit ${milestone.title}`}
                            className="p-1.5 text-neutral-muted hover:text-neutral-text rounded-md hover:bg-neutral-subtle border border-transparent hover:border-neutral-border transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            aria-label={`Delete ${milestone.title}`}
                            className="p-1.5 text-neutral-muted hover:text-status-danger rounded-md hover:bg-neutral-subtle border border-transparent hover:border-neutral-border transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Milestone Task Checklist Rows */}
                  {groupTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-muted italic font-sans">
                      No tasks matching filters under this milestone.
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-border/60">
                      {groupTasks.map((t) => {
                        const isCompleted = t.status === 'completed';
                        const overdue = isTaskOverdue(t, todayStr);

                        return (
                          <div
                            key={t.id}
                            className={`p-3.5 sm:px-5 flex items-start justify-between gap-3 transition-colors ${
                              isCompleted
                                ? 'bg-neutral-subtle/25'
                                : overdue
                                ? 'bg-status-danger-subtle/20 hover:bg-status-danger-subtle/30'
                                : 'hover:bg-primary-subtle/15'
                            }`}
                          >
                            {/* Checkbox and Task Details */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(t)}
                                aria-label={
                                  isCompleted
                                    ? `Mark ${t.title} as pending`
                                    : `Mark ${t.title} as completed`
                                }
                                className="mt-0.5 text-neutral-muted hover:text-neutral-text transition-colors flex-shrink-0"
                              >
                                {isCompleted ? (
                                  <CheckSquare className="w-5 h-5 text-status-success" />
                                ) : (
                                  <Circle className="w-5 h-5 text-neutral-muted hover:text-secondary" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold leading-tight ${
                                      isCompleted
                                        ? 'line-through text-neutral-muted'
                                        : 'text-neutral-text'
                                    }`}
                                  >
                                    {t.title}
                                  </span>

                                  {/* Priority Badge */}
                                  {t.priority === 'urgent' && (
                                    <CouponBadge variant="terracotta">URGENT</CouponBadge>
                                  )}
                                  {t.priority === 'high' && (
                                    <CouponBadge variant="marigold">HIGH</CouponBadge>
                                  )}
                                  {t.priority === 'low' && (
                                    <span className="text-xs font-mono text-neutral-muted uppercase">
                                      Low
                                    </span>
                                  )}

                                  {t.category && (
                                    <span className="text-xs bg-neutral-subtle border border-neutral-border px-2 py-0.5 rounded text-neutral-text font-medium">
                                      {t.category}
                                    </span>
                                  )}

                                  {t.isDueDateOverridden && (
                                    <span
                                      title="Manual due date override: Will not shift if event date changes"
                                      className="text-xs font-mono bg-status-warning-subtle text-neutral-text border border-status-warning/40 px-1.5 py-0.5 rounded flex items-center gap-1"
                                    >
                                      <ShieldCheck className="w-3 h-3 text-secondary" />
                                      <span>Manual</span>
                                    </span>
                                  )}
                                </div>

                                {t.description && (
                                  <p className="text-xs text-neutral-muted leading-relaxed">
                                    {t.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-muted font-mono pt-0.5">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-secondary shrink-0" />
                                    <span>Due: {t.dueDate}</span>
                                  </div>

                                  {overdue && (
                                    <span className="text-status-danger font-semibold bg-status-danger-subtle/60 border border-status-danger/30 px-1.5 py-0.2 rounded text-[11px]">
                                      Overdue by {Math.abs(calculateDaysRemaining(t.dueDate))} days
                                    </span>
                                  )}

                                  {isCompleted && t.completedAt && (
                                    <span className="text-status-success font-medium bg-status-success-subtle/60 border border-status-success/30 px-1.5 py-0.2 rounded text-[11px]">
                                      Completed on {t.completedAt.slice(0, 10)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTask(t);
                                  setIsTaskModalOpen(true);
                                }}
                                aria-label={`Edit ${t.title}`}
                                className="p-1.5 text-neutral-muted hover:text-neutral-text rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                aria-label={`Delete ${t.title}`}
                                className="p-1.5 text-neutral-muted hover:text-status-danger rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MilestoneDialog
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestone={selectedMilestone}
        eventDate={event.date}
        onSave={handleSaveMilestone}
      />

      <TaskDialog
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        milestones={milestones}
        eventDate={event.date}
        defaultMilestoneId={defaultTaskMilestoneId}
        onSave={handleSaveTask}
      />

      <DynamicReplanningModal
        isOpen={isReplanningOpen}
        onClose={() => setIsReplanningOpen(false)}
        event={event}
        onApplyPlan={onUpdateEvent}
        initialView="summary"
      />
    </div>
  );
}
