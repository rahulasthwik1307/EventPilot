import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetLedgerTab } from '../BudgetLedgerTab';
import { Event } from '../../../features/events/types';

describe('BudgetLedgerTab Component', () => {
  const mockEvent: Event = {
    id: 'test-event-budget',
    type: 'wedding',
    title: 'Aditi & Siddharth Wedding',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 1000000,
    currency: 'INR',
    categories: [
      { id: 'cat-venue', name: 'Venue & Dining', allocatedAmount: 600000 },
      { id: 'cat-decor', name: 'Mandap Floral Decor', allocatedAmount: 400000 },
    ],
    expenses: [
      {
        id: 'exp-1',
        categoryId: 'cat-venue',
        title: 'Hall Advance Booking',
        estimatedAmount: 300000,
        actualAmount: 300000,
        paymentStatus: 'settled',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-2',
        categoryId: 'cat-decor',
        title: 'Floral Jasmine Strings',
        estimatedAmount: 150000,
        // no actual amount
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    milestones: [],
    tasks: [],
    vendors: [],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders summary metrics, categories, and expenses accurately', () => {
    const onUpdate = vi.fn();
    render(<BudgetLedgerTab event={mockEvent} onUpdateEvent={onUpdate} />);

    // Budget Cap & Allocated
    expect(screen.getByText('Budget & Expense Ledger')).toBeInTheDocument();
    expect(screen.getAllByText('Venue & Dining').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mandap Floral Decor').length).toBeGreaterThanOrEqual(1);

    // Expenses
    expect(screen.getByText('Hall Advance Booking')).toBeInTheDocument();
    expect(screen.getByText('Floral Jasmine Strings')).toBeInTheDocument();

    // Status Badges
    expect(screen.getByText('Settled')).toBeInTheDocument();
    expect(screen.getByText('Projected')).toBeInTheDocument();
  });

  it('filters expenses by payment status', () => {
    const onUpdate = vi.fn();
    render(<BudgetLedgerTab event={mockEvent} onUpdateEvent={onUpdate} />);

    const statusFilter = screen.getByLabelText('Filter by payment status');
    fireEvent.change(statusFilter, { target: { value: 'settled' } });

    // Settled item visible, projected hidden
    expect(screen.getByText('Hall Advance Booking')).toBeInTheDocument();
    expect(screen.queryByText('Floral Jasmine Strings')).not.toBeInTheDocument();
  });

  it('displays over-allocation warning when categories exceed budget cap', () => {
    const overAllocatedEvent: Event = {
      ...mockEvent,
      budgetCap: 500000, // Cap is 500k, but categories sum to 1M
    };

    render(<BudgetLedgerTab event={overAllocatedEvent} onUpdateEvent={vi.fn()} />);

    expect(screen.getByText('Over-Allocation Warning')).toBeInTheDocument();
  });

  it('displays over-budget warning when actual spent exceeds budget cap', () => {
    const overBudgetEvent: Event = {
      ...mockEvent,
      budgetCap: 200000, // Cap is 200k, but exp-1 actual is 300k
    };

    render(<BudgetLedgerTab event={overBudgetEvent} onUpdateEvent={vi.fn()} />);

    expect(screen.getByText('Budget Exceeded Alert')).toBeInTheDocument();
  });

  it('opens category creation modal when clicking Add Category', () => {
    render(<BudgetLedgerTab event={mockEvent} onUpdateEvent={vi.fn()} />);

    const addCatBtn = screen.getByRole('button', { name: /add category/i });
    fireEvent.click(addCatBtn);

    expect(screen.getByRole('heading', { name: 'Add Budget Category' })).toBeInTheDocument();
  });

  it('opens expense modal when clicking Record Expense', () => {
    render(<BudgetLedgerTab event={mockEvent} onUpdateEvent={vi.fn()} />);

    const recordExpenseBtn = screen.getByRole('button', { name: /record expense/i });
    fireEvent.click(recordExpenseBtn);

    expect(screen.getByRole('heading', { name: 'Add Expense Item' })).toBeInTheDocument();
  });
});
