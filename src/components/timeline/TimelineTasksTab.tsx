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

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const milestones = useMemo(() => event.milestones || [], [event.milestones]);
  const tasks = useMemo(() => event.tasks || [], [event.tasks]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filtered task pool
  const filteredTasks = useMemo(() => {
    let result = filterTasks(tasks, statusFilter, todayStr);
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, statusFilter, priorityFilter, todayStr]);

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

  return (
    <div className="space-y-8">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedMilestone(null);
              setIsMilestoneModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setDefaultTaskMilestoneId(undefined);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white rounded-md transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics & Progress Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Overall Progress
          </p>
          <p className="font-mono text-xl font-bold text-neutral-text">
            {metrics.completed} / {metrics.total}
          </p>
          <div className="w-full h-1.5 bg-neutral-border/40 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${metrics.pct}%` }}
            />
          </div>
          <p className="text-xs text-neutral-muted mt-1 font-mono">{metrics.pct}% complete</p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Pending Tasks
          </p>
          <p className="font-mono text-xl font-bold text-neutral-text">
            {metrics.pending}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            Awaiting action
          </p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Overdue Tasks
          </p>
          <p
            className={`font-mono text-xl font-bold ${
              metrics.overdue > 0 ? 'text-status-danger' : 'text-neutral-text'
            }`}
          >
            {metrics.overdue}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            {metrics.overdue > 0 ? 'Requires attention' : 'On schedule'}
          </p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Celebration Date
          </p>
          <p className="font-mono text-xl font-bold text-neutral-text truncate">
            {event.date}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            {calculateDaysRemaining(event.date) >= 0
              ? `${calculateDaysRemaining(event.date)} days away`
              : `${Math.abs(calculateDaysRemaining(event.date))} days ago`}
          </p>
        </div>
      </div>

      {/* 3. Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-surface border border-neutral-border rounded-lg p-3 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-neutral-text uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-neutral-muted" />
            <span>Filter:</span>
          </span>

          <div className="flex items-center gap-1 bg-neutral-subtle p-0.5 rounded-md border border-neutral-border">
            {(['all', 'pending', 'completed', 'overdue'] as TaskFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-all ${
                  statusFilter === f
                    ? 'bg-neutral-surface font-semibold text-neutral-text shadow-xs'
                    : 'text-neutral-muted hover:text-neutral-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="priority-filter" className="text-neutral-muted">
            Priority:
          </label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-neutral-subtle border border-neutral-border rounded px-2.5 py-1 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* 4. Chronological Milestone Task Groups */}
      {groups.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-neutral-border rounded-lg bg-neutral-surface">
          <Calendar className="w-8 h-8 text-neutral-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-neutral-text">No milestones or tasks found</p>
          <p className="text-xs text-neutral-muted mt-1 mb-4">
            Create celebration milestones and add checklist tasks to begin planning your timeline.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedMilestone(null);
              setIsMilestoneModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white rounded-md transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Milestone</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ milestone, effectiveDate, tasks: groupTasks, completedCount, totalCount }) => {
            const isCelebrationDay = milestone.offsetDays === 0 && milestone.id !== 'independent';

            return (
              <div
                key={milestone.id}
                className={`border rounded-lg shadow-card overflow-hidden transition-all ${
                  isCelebrationDay
                    ? 'bg-primary-subtle/30 border-primary/50'
                    : 'bg-neutral-surface border-neutral-border'
                }`}
              >
                {/* Milestone Banner */}
                <div className="p-4 sm:p-5 border-b border-neutral-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-display text-lg font-semibold text-neutral-text">
                        {milestone.title}
                      </h3>
                      {milestone.id !== 'independent' && (
                        <CouponBadge variant={isCelebrationDay ? 'marigold' : 'stone'}>
                          {milestone.offsetDays === 0
                            ? 'CELEBRATION DAY'
                            : milestone.offsetDays < 0
                            ? `${Math.abs(milestone.offsetDays)}d PRIOR`
                            : `+${milestone.offsetDays}d POST`}
                        </CouponBadge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-muted font-sans">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-secondary" />
                        <span className="font-semibold text-neutral-text">
                          {formatDateDisplay(effectiveDate)}
                        </span>
                        <span className="font-mono text-neutral-muted">
                          ({effectiveDate})
                        </span>
                      </div>
                      <span>·</span>
                      <span className="font-mono">
                        {completedCount} of {totalCount} completed
                      </span>
                    </div>

                    {milestone.description && (
                      <p className="text-xs text-neutral-muted mt-1.5 font-sans">
                        {milestone.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(null);
                        setDefaultTaskMilestoneId(
                          milestone.id !== 'independent' ? milestone.id : undefined
                        );
                        setIsTaskModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
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
                          className="p-1.5 text-neutral-muted hover:text-neutral-text rounded hover:bg-neutral-subtle transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          aria-label={`Delete ${milestone.title}`}
                          className="p-1.5 text-neutral-muted hover:text-status-danger rounded hover:bg-neutral-subtle transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestone Tasks */}
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
                              ? 'bg-neutral-subtle/30'
                              : overdue
                              ? 'bg-status-danger-subtle/20'
                              : 'hover:bg-neutral-subtle/40'
                          }`}
                        >
                          {/* Checkbox and Title */}
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

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    isCompleted
                                      ? 'line-through text-neutral-muted'
                                      : 'text-neutral-text'
                                  }`}
                                >
                                  {t.title}
                                </span>

                                {/* Priority Badge */}
                                {t.priority === 'urgent' && (
                                  <CouponBadge variant="terracotta">Urgent</CouponBadge>
                                )}
                                {t.priority === 'high' && (
                                  <CouponBadge variant="marigold">High</CouponBadge>
                                )}
                                {t.priority === 'low' && (
                                  <span className="text-xs font-mono text-neutral-muted uppercase">
                                    Low
                                  </span>
                                )}

                                {t.category && (
                                  <span className="text-xs bg-neutral-subtle border border-neutral-border px-2 py-0.5 rounded text-neutral-muted font-sans">
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
                                <p className="text-xs text-neutral-muted mt-1 line-clamp-2">
                                  {t.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-muted font-mono mt-1.5">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-secondary" />
                                  <span>Due: {t.dueDate}</span>
                                </div>

                                {overdue && (
                                  <span className="text-status-danger font-semibold">
                                    Overdue by {Math.abs(calculateDaysRemaining(t.dueDate))} days
                                  </span>
                                )}

                                {isCompleted && t.completedAt && (
                                  <span className="text-status-success">
                                    Completed on {t.completedAt.slice(0, 10)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(t);
                                setIsTaskModalOpen(true);
                              }}
                              aria-label={`Edit ${t.title}`}
                              className="p-1 text-neutral-muted hover:text-neutral-text rounded hover:bg-neutral-subtle transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(t.id)}
                              aria-label={`Delete ${t.title}`}
                              className="p-1 text-neutral-muted hover:text-status-danger rounded hover:bg-neutral-subtle transition-colors"
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
    </div>
  );
}
