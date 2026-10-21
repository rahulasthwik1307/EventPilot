'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, ShieldAlert } from 'lucide-react';
import {
  ChecklistTask,
  TaskPriority,
  TaskStatus,
  TimelineMilestone,
} from '../../features/events/types';
import { calculateMilestoneDate } from '../../features/events/timeline-engine';
import { isValidCalendarDate } from '../../features/events/validation';
import { CouponBadge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';

export interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task?: ChecklistTask | null; // null if creating
  milestones: TimelineMilestone[];
  eventDate: string;
  defaultMilestoneId?: string;
  onSave: (task: {
    id: string;
    title: string;
    description?: string;
    milestoneId?: string;
    category?: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    isDueDateOverridden: boolean;
  }) => void;
}

export function TaskDialog({
  isOpen,
  onClose,
  task,
  milestones,
  eventDate,
  defaultMilestoneId,
  onSave,
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [isDueDateOverridden, setIsDueDateOverridden] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper map for milestone offsets
  const milestoneMap = React.useMemo(() => {
    const map = new Map<string, TimelineMilestone>();
    for (const m of milestones) {
      map.set(m.id, m);
    }
    return map;
  }, [milestones]);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setMilestoneId(task.milestoneId || '');
        setCategory(task.category || '');
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.dueDate);
        setIsDueDateOverridden(Boolean(task.isDueDateOverridden));
      } else {
        const initialMilestoneId =
          defaultMilestoneId || (milestones.length > 0 ? milestones[0].id : '');
        const targetMilestone = milestoneMap.get(initialMilestoneId);
        const derivedDue = targetMilestone
          ? calculateMilestoneDate(eventDate, targetMilestone.offsetDays)
          : eventDate;

        setTitle('');
        setDescription('');
        setMilestoneId(initialMilestoneId);
        setCategory('');
        setPriority('medium');
        setStatus('pending');
        setDueDate(derivedDue);
        setIsDueDateOverridden(false);
      }
      setErrors({});
    }
  }, [isOpen, task, milestones, defaultMilestoneId, eventDate, milestoneMap]);

  // When changing milestone, update dueDate if not overridden
  const handleMilestoneChange = (newMilestoneId: string) => {
    setMilestoneId(newMilestoneId);
    if (!isDueDateOverridden && newMilestoneId && milestoneMap.has(newMilestoneId)) {
      const m = milestoneMap.get(newMilestoneId)!;
      setDueDate(calculateMilestoneDate(eventDate, m.offsetDays));
    }
  };

  // When user edits dueDate directly, mark as overridden
  const handleDueDateChange = (newDate: string) => {
    setDueDate(newDate);
    setIsDueDateOverridden(true);
  };

  // Re-anchor to milestone offset date
  const handleResetToMilestoneDate = () => {
    if (milestoneId && milestoneMap.has(milestoneId)) {
      const m = milestoneMap.get(milestoneId)!;
      setDueDate(calculateMilestoneDate(eventDate, m.offsetDays));
      setIsDueDateOverridden(false);
    } else {
      setDueDate(eventDate);
      setIsDueDateOverridden(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Task title is required.';
    } else if (trimmedTitle.length < 3) {
      newErrors.title = 'Task title must be at least 3 characters.';
    } else if (trimmedTitle.length > 150) {
      newErrors.title = 'Task title cannot exceed 150 characters.';
    }

    if (!dueDate || !isValidCalendarDate(dueDate)) {
      newErrors.dueDate = 'Please select a valid due date (YYYY-MM-DD).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: task ? task.id : `task-${Date.now()}`,
      title: trimmedTitle,
      description: description.trim() || undefined,
      milestoneId: milestoneId || undefined,
      category: category.trim() || undefined,
      priority,
      status,
      dueDate,
      isDueDateOverridden,
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Checklist Task' : 'Add Checklist Task'}
      description="Plan an actionable task with milestone anchoring and priority weighting."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="task-title-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Task Title <span className="text-secondary">*</span>
          </label>
          <input
            id="task-title-input"
            type="text"
            placeholder="e.g. Confirm wedding silk saree delivery and blouse stitching"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.title && (
            <p className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        {/* Milestone & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="task-milestone-select"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
            >
              Celebration Milestone Anchor
            </label>
            <select
              id="task-milestone-select"
              value={milestoneId}
              onChange={(e) => handleMilestoneChange(e.target.value)}
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Independent / Not Anchored</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.offsetDays === 0 ? 'Day 0' : `${m.offsetDays}d`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="task-category-input"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
            >
              Department / Category
            </label>
            <input
              id="task-category-input"
              type="text"
              placeholder="e.g. Attire, Ceremony, Catering"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Due Date & Rescheduling Safety */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="task-due-date-input"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text"
            >
              Due Date <span className="text-secondary">*</span>
            </label>
            {isDueDateOverridden && (
              <button
                type="button"
                onClick={handleResetToMilestoneDate}
                className="text-xs text-secondary hover:text-secondary-hover font-medium underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Re-anchor to Milestone</span>
              </button>
            )}
          </div>
          <input
            id="task-due-date-input"
            type="date"
            value={dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.dueDate && (
            <p className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.dueDate}</span>
            </p>
          )}

          {isDueDateOverridden ? (
            <div className="mt-2 p-2.5 bg-status-warning-subtle/80 border border-status-warning/40 rounded-md text-xs text-neutral-text flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-text">
                  Manual Due Date Override:
                </span>{' '}
                This task has a custom fixed date. If you reschedule the celebration date, this task date will be strictly preserved and will not shift.
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-muted mt-1 font-mono">
              Anchored to milestone timeline. Will automatically adjust if celebration date changes.
            </p>
          )}
        </div>

        {/* Priority and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5">
              Priority Weight
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center capitalize transition-all ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-status-danger-subtle border-status-danger text-status-danger font-semibold'
                        : p === 'high'
                        ? 'bg-primary-subtle border-primary text-neutral-text font-semibold'
                        : 'bg-neutral-subtle border-neutral-text text-neutral-text font-semibold'
                      : 'bg-neutral-surface border-neutral-border text-neutral-muted hover:bg-neutral-subtle'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5">
              Completion Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-1.5 px-3 text-xs font-medium rounded-md border text-center transition-all ${
                  status === 'pending'
                    ? 'bg-neutral-subtle border-neutral-text text-neutral-text font-semibold'
                    : 'bg-neutral-surface border-neutral-border text-neutral-muted hover:bg-neutral-subtle'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-1.5 px-3 text-xs font-medium rounded-md border text-center transition-all ${
                  status === 'completed'
                    ? 'bg-status-success-subtle border-status-success text-status-success font-semibold'
                    : 'bg-neutral-surface border-neutral-border text-neutral-muted hover:bg-neutral-subtle'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Description / Instructions */}
        <div>
          <label
            htmlFor="task-desc-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1"
          >
            Notes &amp; Execution Guidance
          </label>
          <textarea
            id="task-desc-input"
            rows={2}
            placeholder="e.g. Priest contact: Pt. Raghavan +91 98450 XXXXX. Carry 25 betel leaves."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="border-t border-neutral-border pt-4 flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm"
          >
            {task ? 'Save Task' : 'Add Task'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
