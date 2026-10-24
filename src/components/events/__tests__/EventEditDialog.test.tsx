import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEditDialog } from '../EventEditDialog';
import { Event } from '../../../features/events/types';
import { eventStorage } from '../../../features/events/storage';

describe('EventEditDialog Component', () => {
  const mockEvent: Event = {
    id: 'edit-test-event',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 250,
    budgetCap: 1500000,
    currency: 'INR',
    categories: [
      { id: 'cat-catering', name: 'Catering & Dining', allocatedAmount: 700000 },
      { id: 'cat-photo', name: 'Photography', allocatedAmount: 300000 },
      { id: 'cat-decor', name: 'Floral & Decor', allocatedAmount: 200000 },
    ],
    expenses: [
      {
        id: 'exp-catering',
        categoryId: 'cat-catering',
        title: 'Grand Banquet Meal',
        costModel: 'per_guest',
        unitCost: 2400,
        estimatedAmount: 600000, // 250 * 2400
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-photo',
        categoryId: 'cat-photo',
        title: 'Lead Wedding Photographer',
        costModel: 'fixed',
        estimatedAmount: 250000,
        paymentStatus: 'deposit_paid',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-decor',
        categoryId: 'cat-decor',
        title: 'Stage & Mandap Florals',
        costModel: 'fixed',
        estimatedAmount: 150000,
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    milestones: [],
    tasks: [],
    vendors: [
      {
        id: 'ven-photo',
        name: 'Pixel Perfect Studios',
        category: 'photography',
        linkedCategoryId: 'cat-photo',
        status: 'booked',
        quotedCost: 250000,
        agreedCost: 250000,
        depositPaid: 50000,
        amountPaid: 50000,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    preferences: {
      budget: {
        value: {
          spendingPriorities: ['Photography'],
          economizeAreas: ['Floral & Decor'],
          nonNegotiables: ['Catering & Dining'],
          flexibility: 'strict_hard_limit',
        },
        provenance: 'confirmed',
        source: 'user_edit',
        updatedAt: '2026-01-01',
      },
    },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const handleClose = vi.fn();
  const handleSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders core parameters and allows editing celebration preferences with user_edit source', () => {
    vi.spyOn(eventStorage, 'savePersonalEvent').mockReturnValue({ success: true });

    render(
      <EventEditDialog
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: 'Edit Celebration Details' })).toBeInTheDocument();

    // Switch to Celebration Preferences tab
    fireEvent.click(screen.getByRole('button', { name: /Celebration Preferences/i }));

    expect(screen.getByText(/Celebration Priorities & Focus/i)).toBeInTheDocument();

    // Select Grand & Festive atmosphere
    fireEvent.click(screen.getByRole('button', { name: /Grand & Festive/i }));

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    const updated: Event = handleSuccess.mock.calls[0][0];

    expect(updated.preferences?.priorities?.value.atmosphere).toBe('grand_festive');
    expect(updated.preferences?.priorities?.provenance).toBe('explicit');
    // CRITICAL: Edits made in EventEditDialog must be tagged user_edit, NOT user_onboarding
    expect(updated.preferences?.priorities?.source).toBe('user_edit');
  });

  it('renders live scenario impact preview when changing guest target or budget cap', () => {
    render(
      <EventEditDialog
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onSuccess={handleSuccess}
      />
    );

    // Change guest count from 250 to 300
    const guestInput = screen.getByLabelText(/Guest Count/i);
    fireEvent.change(guestInput, { target: { value: '300' } });

    // The live scenario impact preview should now appear
    expect(screen.getByTestId('scenario-impact-preview')).toBeInTheDocument();
    expect(screen.getByText(/Deterministic Impact Preview/i)).toBeInTheDocument();

    // Per-guest catering scales: 300 * 2400 = 720,000 (was 600,000, delta = +120,000)
    // Check that committed vendor contract pill is displayed and untouched (250,000)
    expect(screen.getByText(/Contract & Payment Guard Active:/i)).toBeInTheDocument();
    expect(screen.getByText(/₹2,50,000/i)).toBeInTheDocument();
  });

  it('recommends economize trade-offs and protects non-negotiables under deficit', () => {
    render(
      <EventEditDialog
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onSuccess={handleSuccess}
      />
    );

    // Drop budget cap significantly to 800,000 (below total projected 1,000,000)
    const budgetInput = screen.getByLabelText(/Budget Cap/i);
    fireEvent.change(budgetInput, { target: { value: '800000' } });

    expect(screen.getByTestId('scenario-impact-preview')).toBeInTheDocument();
    expect(screen.getByText(/Intelligent Trade-Off Proposals/i)).toBeInTheDocument();

    // Floral & Decor was confirmed as economize area -> should have recommendation
    expect(screen.getByText(/Optimize Floral & Decor: Stage & Mandap Florals/i)).toBeInTheDocument();

    // Photography had agreed vendor contract and is a spending priority -> MUST NOT be recommended
    expect(screen.queryByText(/Optimize Photography/i)).not.toBeInTheDocument();
  });

  it('applies selected trade-off reductions deterministically upon saving', () => {
    const saveSpy = vi.spyOn(eventStorage, 'savePersonalEvent').mockReturnValue({ success: true });

    render(
      <EventEditDialog
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onSuccess={handleSuccess}
      />
    );

    // Drop budget cap to 800,000
    const budgetInput = screen.getByLabelText(/Budget Cap/i);
    fireEvent.change(budgetInput, { target: { value: '800000' } });

    // Click on the economize trade-off
    const tradeOffItem = screen.getByText(/Optimize Floral & Decor: Stage & Mandap Florals/i);
    fireEvent.click(tradeOffItem);

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const updated: Event = saveSpy.mock.calls[0][0];

    // Decor expense was originally 150,000. 25% economize cut is 37,500 -> 112,500
    const decorExp = updated.expenses?.find((e) => e.id === 'exp-decor');
    expect(decorExp?.estimatedAmount).toBe(112500);

    // Committed vendor contract was never mutated
    const venPhoto = updated.vendors?.find((v) => v.id === 'ven-photo');
    expect(venPhoto?.agreedCost).toBe(250000);
  });

  it('discards scenario changes completely when cancelled', () => {
    const saveSpy = vi.spyOn(eventStorage, 'savePersonalEvent');

    render(
      <EventEditDialog
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onSuccess={handleSuccess}
      />
    );

    // Modify budget cap and guest count
    fireEvent.change(screen.getByLabelText(/Guest Count/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Budget Cap/i), { target: { value: '3000000' } });

    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('passes expectedUpdatedAt and blocks save when CONCURRENCY_CONFLICT occurs (W3-01)', () => {
    const saveSpy = vi.spyOn(eventStorage, 'savePersonalEvent').mockReturnValue({
      success: false,
      error: {
        code: 'CONCURRENCY_CONFLICT',
        message: 'This event was updated in another session.',
      },
    });

    render(
      <EventEditDialog
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onSuccess={handleSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    expect(saveSpy).toHaveBeenCalledWith(
      expect.anything(),
      {
        expectedUpdatedAt: mockEvent.updatedAt,
        expectedVersion: 1,
      }
    );
    expect(handleSuccess).not.toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByText(/updated in another session or window/i)).toBeInTheDocument();
  });
});
