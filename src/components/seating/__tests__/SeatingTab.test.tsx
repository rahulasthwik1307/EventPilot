import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SeatingTab } from '../SeatingTab';
import { Event } from '../../../features/events/types';

describe('SeatingTab Component', () => {
  const mockEvent: Event = {
    id: 'test-event-seating',
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
      { id: 'hh-1', name: 'The Sharma Family' },
    ],
    guests: [
      {
        id: 'gst-1',
        firstName: 'Priya',
        lastName: 'Sharma',
        householdId: 'hh-1',
        rsvpStatus: 'confirmed',
        invitationStatus: 'delivered',
        plusOneAllowed: true,
        plusOneExpected: true,
        plusOneName: 'Vikram',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'gst-2',
        firstName: 'Aarav',
        lastName: 'Sharma',
        householdId: 'hh-1',
        rsvpStatus: 'confirmed',
        invitationStatus: 'delivered',
        plusOneAllowed: false,
        plusOneExpected: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    tables: [
      {
        id: 'tbl-1',
        name: 'Table 1 - Mandap Royal',
        capacity: 4,
        tableType: 'round',
      },
    ],
    assignments: [
      {
        id: 'asg-1',
        tableId: 'tbl-1',
        guestId: 'gst-1',
        isPlusOne: false,
        assignedAt: '2026-01-01',
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders seating planner metrics and table occupancy', () => {
    const onUpdate = vi.fn();
    render(<SeatingTab event={mockEvent} onUpdateEvent={onUpdate} />);

    expect(screen.getByText('Banquet Seating Planner')).toBeInTheDocument();
    expect(screen.getByText('Table 1 - Mandap Royal')).toBeInTheDocument();
    expect(screen.getByText('Total Tables')).toBeInTheDocument();
  });

  it('displays seated guest and allows unseating', () => {
    const onUpdate = vi.fn();
    render(<SeatingTab event={mockEvent} onUpdateEvent={onUpdate} />);

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();

    const unseatBtn = screen.getByRole('button', { name: /Unseat Priya Sharma/i });
    fireEvent.click(unseatBtn);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedEvent = onUpdate.mock.calls[0][0];
    expect(updatedEvent.assignments).toHaveLength(0);
  });

  it('shows unassigned expected attendees in the queue and allows seating them', () => {
    const onUpdate = vi.fn();
    render(<SeatingTab event={mockEvent} onUpdateEvent={onUpdate} />);

    // Aarav Sharma and Priya's plus-one (Vikram) should be in the unassigned queue
    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getAllByText(/Vikram \(Plus-One of Priya\)/i).length).toBeGreaterThanOrEqual(1);

    // Seat Aarav Sharma via the select
    const seatSelect = screen.getByLabelText(/Seat Aarav Sharma at table/i);
    fireEvent.change(seatSelect, { target: { value: 'tbl-1' } });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedEvent = onUpdate.mock.calls[0][0];
    expect(updatedEvent.assignments).toHaveLength(2);
  });

  it('displays over-capacity warning when table assignments exceed capacity', () => {
    const overCapacityEvent: Event = {
      ...mockEvent,
      tables: [{ id: 'tbl-1', name: 'Tiny Table', capacity: 1 }],
      assignments: [
        { id: 'asg-1', tableId: 'tbl-1', guestId: 'gst-1', isPlusOne: false, assignedAt: '' },
        { id: 'asg-2', tableId: 'tbl-1', guestId: 'gst-2', isPlusOne: false, assignedAt: '' },
      ],
    };

    const onUpdate = vi.fn();
    render(<SeatingTab event={overCapacityEvent} onUpdateEvent={onUpdate} />);

    expect(screen.getByText(/Over-Capacity Warning/i)).toBeInTheDocument();
  });

  it('displays state-aware empty states in unassigned queue', () => {
    const onUpdate = vi.fn();

    // 1. No guests at all
    const noGuestsEvent: Event = { ...mockEvent, guests: [], assignments: [], tables: [] };
    const { rerender } = render(<SeatingTab event={noGuestsEvent} onUpdateEvent={onUpdate} />);
    expect(screen.getByText('No Guests Registered')).toBeInTheDocument();

    // 2. Declined only (no confirmed attendees)
    const declinedGuestsEvent: Event = {
      ...mockEvent,
      guests: [{ ...mockEvent.guests[0], rsvpStatus: 'declined', plusOneExpected: false }],
      assignments: [],
      tables: mockEvent.tables,
    };
    rerender(<SeatingTab event={declinedGuestsEvent} onUpdateEvent={onUpdate} />);
    expect(screen.getByText('Awaiting Confirmed RSVPs')).toBeInTheDocument();

    // 3. Confirmed attendees exist and are all seated
    const allSeatedEvent: Event = {
      ...mockEvent,
      guests: [{ ...mockEvent.guests[0], plusOneExpected: false }],
      tables: mockEvent.tables,
      assignments: [{ id: 'asg-1', tableId: 'tbl-1', guestId: 'gst-1', isPlusOne: false, assignedAt: '' }],
    };
    rerender(<SeatingTab event={allSeatedEvent} onUpdateEvent={onUpdate} />);
    expect(screen.getByText('All Confirmed Attendees Seated!')).toBeInTheDocument();
  });
});
