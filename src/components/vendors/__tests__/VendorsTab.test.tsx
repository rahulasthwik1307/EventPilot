import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorsTab } from '../VendorsTab';
import { Event } from '../../../features/events/types';

describe('VendorsTab Component', () => {
  const mockEvent: Event = {
    id: 'test-event-vendors',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 1000000,
    currency: 'INR',
    categories: [
      { id: 'cat-venue', name: 'Venue & Banquets', allocatedAmount: 500000 },
      { id: 'cat-catering', name: 'Catering & Dining', allocatedAmount: 300000 },
    ],
    expenses: [],
    milestones: [],
    tasks: [],
    vendors: [
      {
        id: 'vnd-1',
        name: 'The Grand Mandap Palace',
        category: 'venue',
        status: 'booked',
        quotedCost: 550000,
        agreedCost: 500000,
        depositPaid: 200000,
        amountPaid: 200000,
        linkedCategoryId: 'cat-venue',
        contactPerson: 'Karan Sharma',
        phone: '+91 98450 11111',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'vnd-2',
        name: 'Royal Feast Caterers',
        category: 'catering',
        status: 'negotiating',
        quotedCost: 350000,
        agreedCost: 320000,
        depositPaid: 0,
        amountPaid: 0,
        linkedCategoryId: 'cat-catering',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders vendor management overview and metrics', () => {
    const onUpdate = vi.fn();
    render(<VendorsTab event={mockEvent} onUpdateEvent={onUpdate} />);

    expect(screen.getByText('Vendor Management Book')).toBeInTheDocument();
    expect(screen.getByText('The Grand Mandap Palace')).toBeInTheDocument();
    expect(screen.getByText('Royal Feast Caterers')).toBeInTheDocument();
  });

  it('opens vendor creation modal when clicking Record Vendor', () => {
    const onUpdate = vi.fn();
    render(<VendorsTab event={mockEvent} onUpdateEvent={onUpdate} />);

    const addButton = screen.getByRole('button', { name: /Record Vendor/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Record New Vendor')).toBeInTheDocument();
    expect(screen.getByLabelText(/Vendor \/ Business Name/i)).toBeInTheDocument();
  });

  it('filters vendors by text search query', () => {
    const onUpdate = vi.fn();
    render(<VendorsTab event={mockEvent} onUpdateEvent={onUpdate} />);

    const searchInput = screen.getByPlaceholderText(/Search vendors/i);
    fireEvent.change(searchInput, { target: { value: 'Mandap' } });

    expect(screen.getByText('The Grand Mandap Palace')).toBeInTheDocument();
    expect(screen.queryByText('Royal Feast Caterers')).not.toBeInTheDocument();
  });
});
