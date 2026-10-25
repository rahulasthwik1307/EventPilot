/**
 * Event Pilot Timeline & Tasks Engine
 * Pure deterministic calculations for timeline milestones, anchor dates, and tasks.
 * Guardrail: Never delegate arithmetic or date manipulation to language models.
 */

import { ChecklistTask, EventType, TaskPriority, TimelineMilestone } from './types';

export interface MilestoneTemplate {
  idSuffix: string;
  title: string;
  offsetDays: number;
  description?: string;
}

export interface TaskTemplate {
  idSuffix: string;
  title: string;
  description?: string;
  milestoneIdSuffix: string;
  priority: TaskPriority;
  category?: string;
}

export const STARTER_MILESTONES: Record<EventType, MilestoneTemplate[]> = {
  wedding: [
    {
      idSuffix: '6m',
      title: '6 Months Prior — Vision & Auspicious Dates',
      offsetDays: -180,
      description: 'Lagna Patrika, venue finalization, and major vendor anchors.',
    },
    {
      idSuffix: '3m',
      title: '3 Months Prior — Invitations & Wardrobe',
      offsetDays: -90,
      description: 'Traditional invite printing, mandap styling, and trousseau shopping.',
    },
    {
      idSuffix: '1m',
      title: '1 Month Prior — Culinary & Final RSVPs',
      offsetDays: -30,
      description: 'Tasting sessions, guest logistics, and ritual samagri procurement.',
    },
    {
      idSuffix: '2w',
      title: '2 Weeks Prior — Final Rehearsals',
      offsetDays: -14,
      description: 'Priest consultation, nadaswaram cues, and room allocations.',
    },
    {
      idSuffix: '1w',
      title: 'Week of Celebration — Final Assemblies',
      offsetDays: -7,
      description: 'Mehendi setup, welcome kits, and contingency checks.',
    },
    {
      idSuffix: 'day',
      title: 'Day of Celebration — Vivaha Mahotsavam',
      offsetDays: 0,
      description: 'Muhurtham timings, mangala snanam, and reception banquet.',
    },
  ],
  birthday: [
    {
      idSuffix: '6w',
      title: '6 Weeks Prior — Theme & Guest Count',
      offsetDays: -42,
      description: 'Select celebration theme, compile guest list, and reserve party space.',
    },
    {
      idSuffix: '3w',
      title: '3 Weeks Prior — Decor, Cake & Entertainment',
      offsetDays: -21,
      description: 'Order bespoke celebration cake, arrange host/entertainers, and book decorator.',
    },
    {
      idSuffix: '1w',
      title: '1 Week Prior — Favors & Final RSVPs',
      offsetDays: -7,
      description: 'Assemble return gift hampers, confirm guest headcount, and playlist.',
    },
    {
      idSuffix: 'day',
      title: 'Day of Celebration — Party Time',
      offsetDays: 0,
      description: 'Cake arrival, balloon installation, games coordination, and feast.',
    },
  ],
  community: [
    {
      idSuffix: '8w',
      title: '8 Weeks Prior — Approvals & Venue Allotment',
      offsetDays: -56,
      description: 'Secure civic permissions, ground booking, and sponsor outreach.',
    },
    {
      idSuffix: '4w',
      title: '4 Weeks Prior — Sound, Stage & Logistics',
      offsetDays: -28,
      description: 'Contract sound & lighting vendors, design entrance arch, volunteer briefing.',
    },
    {
      idSuffix: '2w',
      title: '2 Weeks Prior — Promotion & Sanitation',
      offsetDays: -14,
      description: 'Deploy banners, setup waste management, and arrange security staff.',
    },
    {
      idSuffix: 'day',
      title: 'Day of Celebration — Community Utsav',
      offsetDays: 0,
      description: 'Stage inauguration, prasadam / food distribution, and cultural performances.',
    },
  ],
};

export const STARTER_TASKS: Record<EventType, TaskTemplate[]> = {
  wedding: [
    {
      idSuffix: 't1',
      title: 'Consult Panchang for auspicious Muhurtham window',
      description: 'Review tithi, nakshatra, and rahu kalam with the family priest.',
      milestoneIdSuffix: '6m',
      priority: 'urgent',
      category: 'Ceremony',
    },
    {
      idSuffix: 't2',
      title: 'Book traditional Kalyana Mandapam / Banquet hall',
      description: 'Confirm air conditioning, dining hall capacity, and guest lodging rooms.',
      milestoneIdSuffix: '6m',
      priority: 'high',
      category: 'Venue',
    },
    {
      idSuffix: 't3',
      title: 'Finalize photography & cinema team',
      description: 'Verify candid coverage, traditional album specs, and drone permissions.',
      milestoneIdSuffix: '6m',
      priority: 'medium',
      category: 'Media',
    },
    {
      idSuffix: 't4',
      title: 'Design & print Lagna Patrika invites',
      description: 'Coordinate with calligrapher and ensure traditional turmeric-tipped cards.',
      milestoneIdSuffix: '3m',
      priority: 'high',
      category: 'Invitations',
    },
    {
      idSuffix: 't5',
      title: 'Curate wedding silk sarees & dhotis',
      description: 'Procure authentic Kanchipuram silk for Muhurtham rituals.',
      milestoneIdSuffix: '3m',
      priority: 'medium',
      category: 'Attire',
    },
    {
      idSuffix: 't6',
      title: 'Catering menu tasting & tiffins',
      description: 'Confirm traditional banana leaf service items, filter coffee, and dessert counters.',
      milestoneIdSuffix: '1m',
      priority: 'high',
      category: 'Catering',
    },
    {
      idSuffix: 't7',
      title: 'Reconfirm Nadaswaram & live artists',
      description: 'Finalize entrance raagam and sound system power backup check.',
      milestoneIdSuffix: '2w',
      priority: 'medium',
      category: 'Entertainment',
    },
    {
      idSuffix: 't8',
      title: 'Deliver dry fruit boxes & wedding favor bags to venue',
      description: 'Organize welcome hospitality desk for outstation guests.',
      milestoneIdSuffix: '1w',
      priority: 'medium',
      category: 'Hospitality',
    },
    {
      idSuffix: 't9',
      title: 'Verify floral mandap garland arrival at 5:00 AM',
      description: 'Check fresh jasmine, rose garlands, and havan firewood arrangement.',
      milestoneIdSuffix: 'day',
      priority: 'urgent',
      category: 'Ceremony',
    },
  ],
  birthday: [
    {
      idSuffix: 't1',
      title: 'Reserve birthday party venue or community clubhouse',
      description: 'Verify party duration, cleanup rules, and audiovisual facilities.',
      milestoneIdSuffix: '6w',
      priority: 'high',
      category: 'Venue',
    },
    {
      idSuffix: 't2',
      title: 'Finalize birthday theme & color palette',
      description: 'Decide on custom backdrop theme, invitation graphic, and dress code.',
      milestoneIdSuffix: '6w',
      priority: 'medium',
      category: 'Theme',
    },
    {
      idSuffix: 't3',
      title: 'Order bespoke centerpiece celebration cake',
      description: 'Confirm flavor, tiers, eggless specification, and delivery slot.',
      milestoneIdSuffix: '3w',
      priority: 'urgent',
      category: 'Catering',
    },
    {
      idSuffix: 't4',
      title: 'Book game coordinator / magician / entertainer',
      description: 'Plan 45-minute interactive group games and music equipment.',
      milestoneIdSuffix: '3w',
      priority: 'high',
      category: 'Entertainment',
    },
    {
      idSuffix: 't5',
      title: 'Assemble customized return gift packages',
      description: 'Pack themed favor boxes with personalized thank-you tags.',
      milestoneIdSuffix: '1w',
      priority: 'medium',
      category: 'Gifts',
    },
    {
      idSuffix: 't6',
      title: 'Supervise balloon arch and backdrop setup',
      description: 'Ensure stage lighting and photo backdrop are ready 1 hour before guests arrive.',
      milestoneIdSuffix: 'day',
      priority: 'high',
      category: 'Decor',
    },
  ],
  community: [
    {
      idSuffix: 't1',
      title: 'Submit municipal & police permits for public gathering',
      description: 'Clear sound decibel permissions, fire department safety NOC, and electric load.',
      milestoneIdSuffix: '8w',
      priority: 'urgent',
      category: 'Permits',
    },
    {
      idSuffix: 't2',
      title: 'Release sponsorship and community donor tier prospectus',
      description: 'Engage local neighborhood patrons and association committees.',
      milestoneIdSuffix: '8w',
      priority: 'high',
      category: 'Sponsorship',
    },
    {
      idSuffix: 't3',
      title: 'Contract professional PA sound system & stage canopy',
      description: 'Setup weatherproof truss stage, line arrays, and diesel generator backup.',
      milestoneIdSuffix: '4w',
      priority: 'high',
      category: 'Production',
    },
    {
      idSuffix: 't4',
      title: 'Arrange community prasadam / feast vendor contracts',
      description: 'Plan for eco-friendly areca nut plates, drinking water tanks, and segregation bins.',
      milestoneIdSuffix: '4w',
      priority: 'medium',
      category: 'Catering',
    },
    {
      idSuffix: 't5',
      title: 'Put up street banners & distribute society notices',
      description: 'Coordinate volunteer teams for entry gates, parking ushering, and emergency desk.',
      milestoneIdSuffix: '2w',
      priority: 'medium',
      category: 'Outreach',
    },
    {
      idSuffix: 't6',
      title: 'Morning sound check & auspicious lamp lighting ceremony',
      description: 'Commence traditional invocation, guest felicitation, and crowd management.',
      milestoneIdSuffix: 'day',
      priority: 'urgent',
      category: 'Operations',
    },
  ],
};

/**
 * Deterministically computes an ISO date (YYYY-MM-DD) given an event anchor date and an offset in days.
 * Pure integer math over UTC to avoid daylight saving or timezone day-shift glitches.
 */
export function calculateMilestoneDate(eventDateStr: string, offsetDays: number): string {
  if (!eventDateStr || typeof eventDateStr !== 'string') {
    return new Date().toISOString().slice(0, 10);
  }

  const parts = eventDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return eventDateStr;
  }

  const [year, month, day] = parts;
  const utcMs = Date.UTC(year, month - 1, day);
  const offsetMs = offsetDays * 86400000;
  const targetDate = new Date(utcMs + offsetMs);

  const y = targetDate.getUTCFullYear();
  const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getUTCDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/**
 * Generates initial starter milestones for a newly created event based on archetype.
 */
export function generateStarterMilestones(type: EventType): TimelineMilestone[] {
  const templates = STARTER_MILESTONES[type] || STARTER_MILESTONES.wedding;

  return templates.map((tmpl) => ({
    id: `m-${type}-${tmpl.idSuffix}`,
    title: tmpl.title,
    offsetDays: tmpl.offsetDays,
    description: tmpl.description,
  }));
}

/**
 * Generates initial starter checklist tasks for a newly created event.
 * Computes due dates anchored to corresponding milestone offsetDays.
 */
export function generateStarterTasks(
  milestones: TimelineMilestone[],
  eventDateStr: string,
  type: EventType
): ChecklistTask[] {
  const templates = STARTER_TASKS[type] || STARTER_TASKS.wedding;
  const now = new Date().toISOString();

  // Create lookup for milestone offset by idSuffix
  const milestoneMap = new Map<string, TimelineMilestone>();
  for (const m of milestones) {
    milestoneMap.set(m.id, m);
  }

  return templates.map((tmpl) => {
    const milestoneId = `m-${type}-${tmpl.milestoneIdSuffix}`;
    const milestone = milestoneMap.get(milestoneId);
    const offsetDays = milestone ? milestone.offsetDays : 0;
    const dueDate = calculateMilestoneDate(eventDateStr, offsetDays);

    return {
      id: `task-${type}-${tmpl.idSuffix}`,
      title: tmpl.title,
      description: tmpl.description,
      milestoneId: milestone ? milestone.id : undefined,
      category: tmpl.category,
      priority: tmpl.priority,
      status: 'pending',
      dueDate,
      isDueDateOverridden: false,
      createdAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Core Rescheduling Safety Engine:
 * When an event date is rescheduled, recalculate dates while STRICTLY preserving:
 * 1. Tasks with manual due date overrides (isDueDateOverridden === true)
 * 2. Task IDs, titles, descriptions, categories
 * 3. Task completion status and completion timestamps
 * 4. Task priorities
 */
export function reanchorTimelineOnDateChange(
  milestones: TimelineMilestone[],
  tasks: ChecklistTask[],
  newEventDateStr: string
): { milestones: TimelineMilestone[]; tasks: ChecklistTask[] } {
  const milestoneMap = new Map<string, TimelineMilestone>();
  for (const m of milestones) {
    milestoneMap.set(m.id, m);
  }

  const updatedTasks = tasks.map((task) => {
    // If the task has a manual override, strictly leave the due date untouched
    if (task.isDueDateOverridden) {
      return task;
    }

    // If task is attached to a milestone, recalculate anchored to new date
    if (task.milestoneId && milestoneMap.has(task.milestoneId)) {
      const milestone = milestoneMap.get(task.milestoneId)!;
      const newDueDate = calculateMilestoneDate(newEventDateStr, milestone.offsetDays);
      return {
        ...task,
        dueDate: newDueDate,
        updatedAt: new Date().toISOString(),
      };
    }

    // If not attached to a milestone and not overridden, leave untouched
    return task;
  });

  return {
    milestones,
    tasks: updatedTasks,
  };
}

/**
 * Checks if a task is overdue.
 * Completed tasks are never overdue.
 */
export function isTaskOverdue(task: ChecklistTask, referenceDateStr?: string): boolean {
  if (task.status === 'completed') {
    return false;
  }

  const todayStr = referenceDateStr || new Date().toISOString().slice(0, 10);
  return task.dueDate < todayStr;
}

export type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue';

/**
 * Deterministic filtering of tasks.
 */
export function filterTasks(
  tasks: ChecklistTask[],
  filter: TaskFilter,
  referenceDateStr?: string
): ChecklistTask[] {
  const todayStr = referenceDateStr || new Date().toISOString().slice(0, 10);

  switch (filter) {
    case 'pending':
      return tasks.filter((t) => t.status === 'pending');
    case 'completed':
      return tasks.filter((t) => t.status === 'completed');
    case 'overdue':
      return tasks.filter((t) => isTaskOverdue(t, todayStr));
    case 'all':
    default:
      return tasks;
  }
}

export interface MilestoneTaskGroup {
  milestone: TimelineMilestone;
  effectiveDate: string;
  tasks: ChecklistTask[];
  completedCount: number;
  totalCount: number;
}

/**
 * Groups tasks under their respective milestones, ordered chronologically by offsetDays.
 * Also captures unassigned tasks under a pseudo "Independent Tasks" group if any exist.
 */
export function groupTasksByMilestone(
  milestones: TimelineMilestone[],
  tasks: ChecklistTask[],
  eventDateStr: string
): MilestoneTaskGroup[] {
  // Sort milestones chronologically from most negative offset to celebration day
  const sortedMilestones = [...milestones].sort((a, b) => a.offsetDays - b.offsetDays);

  const groups: MilestoneTaskGroup[] = sortedMilestones.map((m) => {
    const mTasks = tasks.filter((t) => t.milestoneId === m.id);
    const completedCount = mTasks.filter((t) => t.status === 'completed').length;
    return {
      milestone: m,
      effectiveDate: calculateMilestoneDate(eventDateStr, m.offsetDays),
      tasks: mTasks,
      completedCount,
      totalCount: mTasks.length,
    };
  });

  // Check for orphan / independent tasks
  const orphanTasks = tasks.filter(
    (t) => !t.milestoneId || !milestones.some((m) => m.id === t.milestoneId)
  );

  if (orphanTasks.length > 0) {
    groups.push({
      milestone: {
        id: 'independent',
        title: 'Independent / Custom Tasks',
        offsetDays: 0,
        description: 'Tasks not anchored to a specific celebration milestone.',
      },
      effectiveDate: eventDateStr,
      tasks: orphanTasks,
      completedCount: orphanTasks.filter((t) => t.status === 'completed').length,
      totalCount: orphanTasks.length,
    });
  }

  return groups;
}
