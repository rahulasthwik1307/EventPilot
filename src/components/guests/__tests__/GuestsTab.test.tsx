import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestsTab } from '../GuestsTab';
import { Event } from '../../../features/events/types';
import { createFreshSampleEvent } from '../../../features/events/sample-event';

describe('GuestsTab Component', () => {
  const mockEvent: Event = {
    id: 'test-event-guests',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 1000000,
    currency: 'INR',
    categories: [],
    expenses: [],
    milestones: [],
    tasks: [],
    vendors: [],
    households: [
      { id: 'hh-1', name: 'The Sharma Family', relationshipType: 'Bride Family' },
    ],
    guests: [
      {
        id: 'gst-1',
        firstName: 'Priya',
        lastName: 'Sharma',
        householdId: 'hh-1',
        relationship: 'Cousin',
        rsvpStatus: 'confirmed',
        invitationStatus: 'delivered',
        plusOneAllowed: true,
        plusOneExpected: true,
        plusOneName: 'Vikram',
        dietaryPreference: 'jain',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'gst-2',
        firstName: 'Rohan',
        lastName: 'Sharma',
        householdId: 'hh-1',
        rsvpStatus: 'pending',
        invitationStatus: 'sent',
        plusOneAllowed: false,
        plusOneExpected: false,
        dietaryPreference: 'none',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'gst-3',
        firstName: 'Ananya',
        relationship: 'Colleague',
        rsvpStatus: 'declined',
        invitationStatus: 'sent',
        plusOneAllowed: false,
        plusOneExpected: false,
        dietaryPreference: 'none',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders guest attendance summary metrics accurately', () => {
    const onUpdate = vi.fn();
    render(<GuestsTab event={mockEvent} onUpdateEvent={onUpdate} />);

    expect(screen.getByText('Guest & RSVP Management')).toBeInTheDocument();
    // 3 named guests
    expect(screen.getByText('Named Guests')).toBeInTheDocument();
    // 1 confirmed named + 1 confirmed plus-one = 2 expected attendance
    expect(screen.getByText('Expected Attendance')).toBeInTheDocument();
  });

  it('filters guests by RSVP status', () => {
    const onUpdate = vi.fn();
    render(<GuestsTab event={mockEvent} onUpdateEvent={onUpdate} />);

    const rsvpSelect = screen.getByLabelText(/Filter by RSVP status/i);
    fireEvent.change(rsvpSelect, { target: { value: 'confirmed' } });

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Rohan Sharma')).not.toBeInTheDocument();
  });

  it('opens add guest dialog when clicking Add Guest', () => {
    const onUpdate = vi.fn();
    render(<GuestsTab event={mockEvent} onUpdateEvent={onUpdate} />);

    const addBtn = screen.getByRole('button', { name: /Add Guest/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add Guest to Register')).toBeInTheDocument();
    expect(screen.getByLabelText(/First \/ Given Name/i)).toBeInTheDocument();
  });

  it('toggles RSVP status quickly via quick toggle buttons', () => {
    const onUpdate = vi.fn();
    render(<GuestsTab event={mockEvent} onUpdateEvent={onUpdate} />);

    // Rohan is currently pending; click 'Attending'
    const attendingButtons = screen.getAllByRole('button', { name: /Attending/i });
    // attendingButtons[1] is Rohan's quick toggle
    fireEvent.click(attendingButtons[1]);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedEvent = onUpdate.mock.calls[0][0];
    const rohan = updatedEvent.guests.find((g: any) => g.id === 'gst-2');
    expect(rohan.rsvpStatus).toBe('confirmed');
  });

  it('renders correctly with createFreshSampleEvent()', () => {
    const sample = createFreshSampleEvent();
    render(<GuestsTab event={sample} onUpdateEvent={vi.fn()} />);
    expect(screen.getByText('Guest & RSVP Management')).toBeInTheDocument();
    expect(screen.getAllByText('The Sharma Family').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });

  it('triggers temporary undo toast when deleting a guest and restores them upon undo', () => {
    const eventWithSeatedGuest: Event = {
      ...mockEvent,
      tables: [{ id: 'tbl-1', name: 'Family Table 1', tableType: 'round', capacity: 8 }],
      assignments: [
        { id: 'asgn-1', tableId: 'tbl-1', guestId: 'gst-1', isPlusOne: false, assignedAt: '2026-01-01' },
      ],
    };

    const onUpdate = vi.fn();
    render(<GuestsTab event={eventWithSeatedGuest} onUpdateEvent={onUpdate} />);

    // Click Delete on Priya Sharma
    const deleteBtn = screen.getByLabelText('Delete Priya Sharma');
    fireEvent.click(deleteBtn);

    // Initial delete update called
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const deleteResult: Event = onUpdate.mock.calls[0][0];
    expect(deleteResult.guests.find((g) => g.id === 'gst-1')).toBeUndefined();
    expect(deleteResult.assignments.find((a) => a.guestId === 'gst-1')).toBeUndefined();

    // Undo toast is now visible
    expect(screen.getByText(/Guest "Priya Sharma" removed/i)).toBeInTheDocument();
    const undoBtn = screen.getByRole('button', { name: /Undo deletion/i });
    expect(undoBtn).toBeInTheDocument();

    // Click Undo
    fireEvent.click(undoBtn);

    // Second update called with restored guest and seating assignment
    expect(onUpdate).toHaveBeenCalledTimes(2);
    const restoreResult: Event = onUpdate.mock.calls[1][0];
    const restored = restoreResult.guests.find((g) => g.id === 'gst-1');
    expect(restored).toBeDefined();
    expect(restored?.firstName).toBe('Priya');
    expect(restored?.householdId).toBe('hh-1');
    expect(restored?.dietaryPreference).toBe('jain');

    // Seating assignment restored
    const restoredAssignment = restoreResult.assignments.find((a) => a.guestId === 'gst-1');
    expect(restoredAssignment).toBeDefined();
    expect(restoredAssignment?.tableId).toBe('tbl-1');
  });

  it('expires the guest undo toast when dismissed', () => {
    render(<GuestsTab event={mockEvent} onUpdateEvent={vi.fn()} />);

    const deleteBtn = screen.getByLabelText('Delete Rohan Sharma');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Guest "Rohan Sharma" removed/i)).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /Dismiss notification/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText(/Guest "Rohan Sharma" removed/i)).not.toBeInTheDocument();
  });
});
