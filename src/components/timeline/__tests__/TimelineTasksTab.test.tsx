import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineTasksTab } from '../TimelineTasksTab';
import { Event } from '../../../features/events/types';

describe('TimelineTasksTab Component', () => {
  const mockEvent: Event = {
    id: 'test-event-timeline',
    type: 'wedding',
    title: 'Ananya & Vikram Vivaha',
    date: '2026-11-20',
    guestTarget: 300,
    budgetCap: 1500000,
    currency: 'INR',
    categories: [],
    expenses: [],
    milestones: [
      {
        id: 'm-1',
        title: '3 Months Prior — Wardrobe & Decor',
        offsetDays: -90,
      },
      {
        id: 'm-2',
        title: 'Day of Celebration',
        offsetDays: 0,
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Consult Panchang for Muhurtham',
        milestoneId: 'm-1',
        priority: 'urgent',
        status: 'completed',
        dueDate: '2026-08-22',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'task-2',
        title: 'Floral Garlands Arrival at Mandap',
        milestoneId: 'm-2',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-11-20',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    vendors: [],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders timeline header, milestones, and task items', () => {
    const onUpdate = vi.fn();
    render(<TimelineTasksTab event={mockEvent} onUpdateEvent={onUpdate} />);

    expect(screen.getByText('Timeline & Tasks')).toBeInTheDocument();
    expect(screen.getByText('3 Months Prior — Wardrobe & Decor')).toBeInTheDocument();
    expect(screen.getByText('Day of Celebration')).toBeInTheDocument();
    expect(screen.getByText('Consult Panchang for Muhurtham')).toBeInTheDocument();
    expect(screen.getByText('Floral Garlands Arrival at Mandap')).toBeInTheDocument();
  });

  it('toggles task status when clicking completion button', () => {
    const onUpdate = vi.fn();
    render(<TimelineTasksTab event={mockEvent} onUpdateEvent={onUpdate} />);

    // Click the toggle button for pending task-2
    const toggleBtn = screen.getByLabelText('Mark Floral Garlands Arrival at Mandap as completed');
    fireEvent.click(toggleBtn);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedEvent: Event = onUpdate.mock.calls[0][0];
    const updatedTask = updatedEvent.tasks.find((t) => t.id === 'task-2')!;
    expect(updatedTask.status).toBe('completed');
    expect(updatedTask.completedAt).toBeDefined();
  });

  it('filters tasks by completion status', () => {
    const onUpdate = vi.fn();
    render(<TimelineTasksTab event={mockEvent} onUpdateEvent={onUpdate} />);

    // Filter to only pending tasks
    const pendingFilterBtn = screen.getByRole('button', { name: 'pending' });
    fireEvent.click(pendingFilterBtn);

    expect(screen.queryByText('Consult Panchang for Muhurtham')).not.toBeInTheDocument();
    expect(screen.getByText('Floral Garlands Arrival at Mandap')).toBeInTheDocument();
  });

  it('opens milestone modal when clicking Add Milestone', () => {
    render(<TimelineTasksTab event={mockEvent} onUpdateEvent={vi.fn()} />);

    const addMilestoneBtn = screen.getByRole('button', { name: /add milestone/i });
    fireEvent.click(addMilestoneBtn);

    expect(screen.getByRole('heading', { name: 'Add Timeline Milestone' })).toBeInTheDocument();
  });

  it('opens task modal when clicking Add Task', () => {
    render(<TimelineTasksTab event={mockEvent} onUpdateEvent={vi.fn()} />);

    // The header has an Add Task button
    const addTaskBtns = screen.getAllByRole('button', { name: /add task/i });
    fireEvent.click(addTaskBtns[0]);

    expect(screen.getByRole('heading', { name: 'Add Checklist Task' })).toBeInTheDocument();
  });
});
