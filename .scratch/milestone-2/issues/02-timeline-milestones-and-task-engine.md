# 02: Timeline Milestones, Task Engine & Rescheduling Integrity

**Status:** closed  
**Blocked by:** 01-budget-domain-and-calculations.md

## What to build
Implement the Timeline & Tasks domain models, relative offset calculations, starter milestones/tasks templates, dynamic overdue evaluation, and event-date rescheduling integrity.

## Acceptance Criteria
- [x] Explicit TypeScript types for `TimelineMilestone`, `ChecklistTask`, `TaskPriority`, and `TaskStatus`.
- [x] Pure date calculation functions: `calculateMilestoneDate(eventDate, offsetDays)` without timezone drift.
- [x] Starter milestone and task templates for `wedding`, `birthday`, and `community`.
- [x] `reanchorTimelineOnDateChange`: updates derived dates upon event-date change while **strictly preserving** task IDs, completion status, priority, description, and manually overridden due dates.
- [x] Dynamic overdue evaluation excluding completed tasks.
- [x] 100% test coverage for date boundaries, leap years, manual overrides, and rescheduling.
