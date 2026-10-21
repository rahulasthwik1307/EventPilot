import { describe, expect, it } from 'vitest';
import {
  calculateMilestoneDate,
  filterTasks,
  generateStarterMilestones,
  generateStarterTasks,
  groupTasksByMilestone,
  isTaskOverdue,
  reanchorTimelineOnDateChange,
} from '../timeline-engine';
import { ChecklistTask, TimelineMilestone } from '../types';

describe('Timeline Engine - Deterministic Calculations & Rescheduling Safety', () => {
  describe('calculateMilestoneDate', () => {
    it('accurately computes negative offset without timezone skew', () => {
      // 2026-11-20 minus 30 days -> 2026-10-21
      const result = calculateMilestoneDate('2026-11-20', -30);
      expect(result).toBe('2026-10-21');
    });

    it('accurately handles year boundary wrap-around', () => {
      // 2027-01-15 minus 30 days -> 2026-12-16
      const result = calculateMilestoneDate('2027-01-15', -30);
      expect(result).toBe('2026-12-16');
    });

    it('accurately handles leap years', () => {
      // 2028-03-01 minus 2 days -> 2028-02-28 (2028 is leap year, Feb has 29 days, so 2028-02-28 is 2 days before March 1)
      const result = calculateMilestoneDate('2028-03-01', -2);
      expect(result).toBe('2028-02-28');
    });

    it('handles 0 offset (celebration day itself)', () => {
      const result = calculateMilestoneDate('2026-11-20', 0);
      expect(result).toBe('2026-11-20');
    });
  });

  describe('generateStarterMilestones and generateStarterTasks', () => {
    it('generates milestone anchors and tasks for wedding archetype', () => {
      const eventDate = '2026-11-20';
      const milestones = generateStarterMilestones('wedding');
      expect(milestones.length).toBeGreaterThanOrEqual(6);

      const tasks = generateStarterTasks(milestones, eventDate, 'wedding');
      expect(tasks.length).toBeGreaterThanOrEqual(8);

      // Verify task anchoring
      const dayTask = tasks.find((t) => t.milestoneId?.endsWith('day'));
      expect(dayTask).toBeDefined();
      expect(dayTask?.dueDate).toBe(eventDate);
      expect(dayTask?.isDueDateOverridden).toBe(false);
      expect(dayTask?.status).toBe('pending');
    });

    it('generates milestone anchors for birthday and community', () => {
      const birthdayMilestones = generateStarterMilestones('birthday');
      expect(birthdayMilestones.length).toBeGreaterThanOrEqual(4);

      const communityMilestones = generateStarterMilestones('community');
      expect(communityMilestones.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('reanchorTimelineOnDateChange - Guardrail Verification', () => {
    const originalEventDate = '2026-11-20';
    const newEventDate = '2026-12-25'; // Rescheduled +35 days later

    const milestones: TimelineMilestone[] = [
      { id: 'm-30', title: '1 Month Prior', offsetDays: -30 },
      { id: 'm-0', title: 'Day of Event', offsetDays: 0 },
    ];

    const tasks: ChecklistTask[] = [
      {
        id: 'task-derived',
        title: 'Derived Task',
        milestoneId: 'm-30',
        priority: 'high',
        status: 'pending',
        dueDate: calculateMilestoneDate(originalEventDate, -30), // 2026-10-21
        isDueDateOverridden: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'task-manual-override',
        title: 'Vendor Booking Contract Deadline',
        description: 'Fixed hard deadline agreed with venue vendor',
        milestoneId: 'm-30',
        priority: 'urgent',
        status: 'pending',
        dueDate: '2026-09-15', // User set custom override date
        isDueDateOverridden: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'task-completed',
        title: 'Already Completed Consultation',
        milestoneId: 'm-30',
        priority: 'medium',
        status: 'completed',
        completedAt: '2026-02-10T10:00:00.000Z',
        dueDate: calculateMilestoneDate(originalEventDate, -30),
        isDueDateOverridden: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    it('STRICT RESCHEDULING INTEGRITY: shifts derived dates while strictly preserving manual overrides', () => {
      const { tasks: updatedTasks } = reanchorTimelineOnDateChange(
        milestones,
        tasks,
        newEventDate
      );

      const derived = updatedTasks.find((t) => t.id === 'task-derived')!;
      const manual = updatedTasks.find((t) => t.id === 'task-manual-override')!;
      const completed = updatedTasks.find((t) => t.id === 'task-completed')!;

      // Derived task shifts with the new event date: 2026-12-25 - 30 days = 2026-11-25
      expect(derived.dueDate).toBe('2026-11-25');

      // CRITICAL: Manual override task MUST retain its exact custom due date!
      expect(manual.dueDate).toBe('2026-09-15');
      expect(manual.isDueDateOverridden).toBe(true);

      // Completed status and completedAt timestamp MUST remain intact!
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBe('2026-02-10T10:00:00.000Z');
      expect(completed.priority).toBe('medium');

      // IDs and descriptions remain untouched
      expect(manual.description).toBe('Fixed hard deadline agreed with venue vendor');
    });
  });

  describe('isTaskOverdue', () => {
    it('flags pending tasks past due date as overdue', () => {
      const task: ChecklistTask = {
        id: 't1',
        title: 'Pending Past Due',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-10-15',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      expect(isTaskOverdue(task, '2026-10-21')).toBe(true);
      expect(isTaskOverdue(task, '2026-10-10')).toBe(false);
    });

    it('never flags completed tasks as overdue even if dueDate is past', () => {
      const task: ChecklistTask = {
        id: 't2',
        title: 'Completed Past Due',
        priority: 'high',
        status: 'completed',
        dueDate: '2026-10-01',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      expect(isTaskOverdue(task, '2026-10-21')).toBe(false);
    });
  });

  describe('filterTasks', () => {
    const tasks: ChecklistTask[] = [
      {
        id: 't-pending',
        title: 'Pending',
        priority: 'medium',
        status: 'pending',
        dueDate: '2026-11-01',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 't-overdue',
        title: 'Overdue',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-10-10',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 't-completed',
        title: 'Completed',
        priority: 'low',
        status: 'completed',
        dueDate: '2026-10-05',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    it('filters accurately by status', () => {
      const today = '2026-10-21';
      expect(filterTasks(tasks, 'all', today)).toHaveLength(3);
      expect(filterTasks(tasks, 'pending', today)).toHaveLength(2);
      expect(filterTasks(tasks, 'completed', today)).toHaveLength(1);
      expect(filterTasks(tasks, 'overdue', today)).toEqual([tasks[1]]);
    });
  });

  describe('groupTasksByMilestone', () => {
    it('groups tasks chronologically and includes orphan group if present', () => {
      const milestones: TimelineMilestone[] = [
        { id: 'm-day', title: 'Day of Celebration', offsetDays: 0 },
        { id: 'm-30', title: '1 Month Prior', offsetDays: -30 },
      ];

      const tasks: ChecklistTask[] = [
        {
          id: 't1',
          title: '30 day task',
          milestoneId: 'm-30',
          priority: 'high',
          status: 'pending',
          dueDate: '2026-10-21',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 't2',
          title: 'Orphan task',
          priority: 'low',
          status: 'pending',
          dueDate: '2026-10-25',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const groups = groupTasksByMilestone(milestones, tasks, '2026-11-20');

      // Milestones sorted: m-30, m-day, plus independent
      expect(groups).toHaveLength(3);
      expect(groups[0].milestone.id).toBe('m-30');
      expect(groups[0].tasks).toHaveLength(1);
      expect(groups[1].milestone.id).toBe('m-day');
      expect(groups[1].tasks).toHaveLength(0);
      expect(groups[2].milestone.id).toBe('independent');
      expect(groups[2].tasks).toHaveLength(1);
    });
  });
});
