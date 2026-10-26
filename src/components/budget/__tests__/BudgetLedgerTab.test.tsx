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

  it('renders per-guest variable expense with rate badge and headcount breakdown', () => {
    const eventWithVariableExpense: Event = {
      ...mockEvent,
      expenses: [
        {
          id: 'exp-catering',
          categoryId: 'cat-venue',
          title: 'Traditional Sadya Feast',
          estimatedAmount: 160000, // 200 guests * 800
          costModel: 'per_guest',
          unitCost: 800,
          paymentStatus: 'projected',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    render(<BudgetLedgerTab event={eventWithVariableExpense} onUpdateEvent={vi.fn()} />);

    expect(screen.getByText('Traditional Sadya Feast')).toBeInTheDocument();
    // Unit rate badge
    expect(screen.getByText(/₹800 \/ guest/i)).toBeInTheDocument();
    // Breakdown in estimated amount
    expect(screen.getByText(/200 × ₹800/i)).toBeInTheDocument();
  });

  it('records a new per-guest expense via the expense dialog with costModel and unitCost', () => {
    const onUpdate = vi.fn();
    render(<BudgetLedgerTab event={mockEvent} onUpdateEvent={onUpdate} />);

    // Open Record Expense modal
    fireEvent.click(screen.getByRole('button', { name: /record expense/i }));
    expect(screen.getByRole('heading', { name: 'Add Expense Item' })).toBeInTheDocument();

    // Fill title
    fireEvent.change(screen.getByLabelText(/Expense Title/i), {
      target: { value: 'Welcome Drink Stalls' },
    });

    // Select Per-Guest Rate cost model
    fireEvent.click(screen.getByRole('button', { name: /Per-Guest Rate/i }));

    // Enter unit cost: 150
    fireEvent.change(screen.getByLabelText(/Rate per Guest/i), {
      target: { value: '150' },
    });

    // Save
    fireEvent.click(screen.getByRole('button', { name: /Add to Ledger/i }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedEvent = onUpdate.mock.calls[0][0];
    const newExpense = updatedEvent.expenses.find(
      (e: { title: string }) => e.title === 'Welcome Drink Stalls'
    );
    expect(newExpense).toBeDefined();
    expect(newExpense.costModel).toBe('per_guest');
    expect(newExpense.unitCost).toBe(150);
    expect(newExpense.estimatedAmount).toBe(30000); // 150 * 200 guests
  });

  it('triggers temporary undo toast when deleting an expense and restores it upon undo', () => {
    const onUpdate = vi.fn();
    render(<BudgetLedgerTab event={mockEvent} onUpdateEvent={onUpdate} />);

    // Click delete on exp-1 (Hall Advance Booking)
    const deleteBtn = screen.getByLabelText('Delete Hall Advance Booking');
    fireEvent.click(deleteBtn);

    // Initial delete update called
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const deleteResult: Event = onUpdate.mock.calls[0][0];
    expect(deleteResult.expenses.find((e) => e.id === 'exp-1')).toBeUndefined();

    // Undo toast is now visible
    expect(screen.getByText(/Expense "Hall Advance Booking" deleted/i)).toBeInTheDocument();
    const undoBtn = screen.getByRole('button', { name: /Undo deletion/i });
    expect(undoBtn).toBeInTheDocument();

    // Click Undo
    fireEvent.click(undoBtn);

    // Second update called with restored expense
    expect(onUpdate).toHaveBeenCalledTimes(2);
    const restoreResult: Event = onUpdate.mock.calls[1][0];
    const restored = restoreResult.expenses.find((e) => e.id === 'exp-1');
    expect(restored).toBeDefined();
    expect(restored?.title).toBe('Hall Advance Booking');
    expect(restored?.estimatedAmount).toBe(300000);
    expect(restored?.paymentStatus).toBe('settled');
  });

  it('expires the undo toast when dismissed', () => {
    render(<BudgetLedgerTab event={mockEvent} onUpdateEvent={vi.fn()} />);

    // Click delete on exp-2
    const deleteBtn = screen.getByLabelText('Delete Floral Jasmine Strings');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Expense "Floral Jasmine Strings" deleted/i)).toBeInTheDocument();

    // Click dismiss (X)
    const dismissBtn = screen.getByRole('button', { name: /Dismiss notification/i });
    fireEvent.click(dismissBtn);

    // Toast should disappear
    expect(screen.queryByText(/Expense "Floral Jasmine Strings" deleted/i)).not.toBeInTheDocument();
  });
});
