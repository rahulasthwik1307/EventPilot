import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiAssistantTab } from '../AiAssistantTab';
import { Event } from '../../../features/events/types';

describe('AiAssistantTab Component', () => {
  const mockEvent: Event = {
    id: 'test-event-ai',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 250,
    budgetCap: 1500000,
    currency: 'INR',
    categories: [
      { id: 'cat-venue', name: 'Venue & Banquets', allocatedAmount: 500000 },
      { id: 'cat-catering', name: 'Catering & Dining', allocatedAmount: 400000 },
    ],
    expenses: [],
    milestones: [
      { id: 'm-1', title: '60 Days Prior', offsetDays: -60 },
    ],
    tasks: [],
    vendors: [],
    households: [],
    guests: [
      {
        id: 'g-1',
        householdId: 'h-1',
        firstName: 'Private',
        lastName: 'Guest',
        email: 'secret@domain.com',
        phone: '+91 99999 88888',
        rsvpStatus: 'confirmed',
        invitationStatus: 'sent',
        plusOneAllowed: true,
        plusOneExpected: true,
        dietaryPreference: 'jain',
        dietaryNotes: 'Strict Jain',
        notes: 'Secret family relation',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the header, privacy notice, intent options, and starter prompts', () => {
    render(
      <AiAssistantTab
        event={mockEvent}
        onUpdateEvent={vi.fn()}
      />
    );

    expect(screen.getByText('Gemini Planning Assistant')).toBeDefined();
    expect(screen.getByText(/Privacy Guard Active/i)).toBeDefined();
    expect(screen.getByRole('radio', { name: /Budget Ledger/i })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Timeline & Tasks/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Ask Gemini/i })).toBeDefined();
  });

  it('opens privacy transparency modal when clicking Inspect Safe Context and confirms zero PII', () => {
    render(
      <AiAssistantTab
        event={mockEvent}
        onUpdateEvent={vi.fn()}
      />
    );

    const inspectBtn = screen.getByRole('button', { name: /Inspect Safe Context/i });
    fireEvent.click(inspectBtn);

    expect(screen.getByText('Privacy Guard — Minimal Projected Context')).toBeDefined();
    const modalContent = screen.getByText(/Aditi & Siddharth Vivaha/i);
    expect(modalContent).toBeDefined();

    // Verify guest PII is NOT in the modal text
    expect(screen.queryByText('Private')).toBeNull();
    expect(screen.queryByText('secret@domain.com')).toBeNull();
    expect(screen.queryByText('+91 99999 88888')).toBeNull();
  });

  it('submits a prompt and displays conversational guidance and staged proposal cards', async () => {
    const mockResponse = {
      answer: 'South Indian Vivaha guidance: Focus on authentic banana leaf feast and Nadaswaram.',
      proposals: [
        {
          id: 'prop-test-1',
          actionType: 'adjust_budget_allocation',
          title: 'Optimize Venue Allocation',
          explanation: 'Increase banquet allocation for traditional setup.',
          status: 'staged',
          payload: {
            actionType: 'adjust_budget_allocation',
            categoryName: 'Venue & Banquets',
            currentAllocated: 500000,
            proposedAllocated: 550000,
            rationale: 'Include traditional hall mandap pillars',
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AiAssistantTab
        event={mockEvent}
        onUpdateEvent={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ask Gemini for advice/i);
    fireEvent.change(textarea, { target: { value: 'Help with budget allocations' } });

    const submitBtn = screen.getByRole('button', { name: /Ask Gemini/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/South Indian Vivaha guidance/i)).toBeDefined();
    });

    expect(screen.getByText('Optimize Venue Allocation')).toBeDefined();
    expect(screen.getByText('Needs Review')).toBeDefined();
    expect(screen.getByText('Target Category:')).toBeDefined();
  });

  it('applies a staged proposal deterministically when user clicks Accept & Apply', async () => {
    const onUpdateMock = vi.fn();
    const mockResponse = {
      answer: 'Recommendations generated.',
      proposals: [
        {
          id: 'prop-test-apply',
          actionType: 'adjust_budget_allocation',
          title: 'Adjust Venue Budget',
          explanation: 'Reallocate reserve.',
          status: 'staged',
          payload: {
            actionType: 'adjust_budget_allocation',
            categoryName: 'Venue & Banquets',
            currentAllocated: 500000,
            proposedAllocated: 550000,
            rationale: 'Extra decor',
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AiAssistantTab
        event={mockEvent}
        onUpdateEvent={onUpdateMock}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ask Gemini for advice/i);
    fireEvent.change(textarea, { target: { value: 'Review budget' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Gemini/i }));

    await waitFor(() => {
      expect(screen.getByText('Adjust Venue Budget')).toBeDefined();
    });

    const acceptBtn = screen.getByRole('button', { name: /Accept & Apply/i });
    fireEvent.click(acceptBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    const updatedEvent: Event = onUpdateMock.mock.calls[0][0];
    const updatedVenue = updatedEvent.categories.find((c) => c.name === 'Venue & Banquets');
    expect(updatedVenue?.allocatedAmount).toBe(550000);
    // Expenses must remain untouched
    expect(updatedEvent.expenses.length).toBe(0);

    // Staged card status updates to Applied
    expect(screen.getByText('Applied to celebration')).toBeDefined();
  });

  it('dismisses a proposal when user clicks Dismiss without mutating event', async () => {
    const onUpdateMock = vi.fn();
    const mockResponse = {
      answer: 'Recommendations generated.',
      proposals: [
        {
          id: 'prop-test-dismiss',
          actionType: 'adjust_budget_allocation',
          title: 'Unwanted Adjustment',
          explanation: 'Should be dismissed.',
          status: 'staged',
          payload: {
            actionType: 'adjust_budget_allocation',
            categoryName: 'Venue & Banquets',
            currentAllocated: 500000,
            proposedAllocated: 900000,
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AiAssistantTab
        event={mockEvent}
        onUpdateEvent={onUpdateMock}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ask Gemini for advice/i);
    fireEvent.change(textarea, { target: { value: 'Check' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Gemini/i }));

    await waitFor(() => {
      expect(screen.getByText('Unwanted Adjustment')).toBeDefined();
    });

    const dismissBtn = screen.getByRole('button', { name: /^Dismiss$/i });
    fireEvent.click(dismissBtn);

    // Event must NOT be updated
    expect(onUpdateMock).not.toHaveBeenCalled();
    expect(screen.getByText('Dismissed')).toBeDefined();
  });

  it('handles 503 high demand response gracefully with friendly retry banner', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        code: 'MODEL_UNAVAILABLE',
        message: 'This model is currently experiencing high demand. Please try again later.',
      }),
    });

    render(
      <AiAssistantTab
        event={mockEvent}
        onUpdateEvent={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ask Gemini for advice/i);
    fireEvent.change(textarea, { target: { value: 'Help plan ceremony' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Gemini/i }));

    await waitFor(() => {
      expect(screen.getByText(/Gemini 3.8 Flash High Demand/i)).toBeDefined();
    });

    expect(screen.getByRole('button', { name: /Retry Request/i })).toBeDefined();
    expect(screen.getByText(/Your local planning data is completely secure/i)).toBeDefined();
  });
});
