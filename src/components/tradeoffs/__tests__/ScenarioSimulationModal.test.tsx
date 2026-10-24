import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScenarioSimulationModal } from '../ScenarioSimulationModal';
import { Event } from '../../../features/events/types';
import { eventStorage } from '../../../features/events/storage';

describe('ScenarioSimulationModal Component', () => {
  const mockEvent: Event = {
    id: 'sim-test-event',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 1200000,
    currency: 'INR',
    categories: [
      { id: 'cat-catering', name: 'Catering & Dining', allocatedAmount: 500000 },
      { id: 'cat-decor', name: 'Floral & Decor', allocatedAmount: 200000 },
    ],
    expenses: [
      {
        id: 'exp-catering',
        categoryId: 'cat-catering',
        title: 'Banquet Catering',
        costModel: 'per_guest',
        unitCost: 2000,
        estimatedAmount: 400000,
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-decor',
        categoryId: 'cat-decor',
        title: 'Stage Florals',
        costModel: 'fixed',
        estimatedAmount: 180000,
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
    preferences: {
      budget: {
        value: {
          spendingPriorities: [],
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
  const handleApplyScenario = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders simulation controls and live impact preview', () => {
    render(
      <ScenarioSimulationModal
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onApplyScenario={handleApplyScenario}
      />
    );

    expect(screen.getByRole('heading', { name: 'What-If Scenario Simulation' })).toBeInTheDocument();
    expect(screen.getByTestId('scenario-simulation-modal')).toBeInTheDocument();
    expect(screen.getAllByText(/200 guests/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Deterministic Impact Preview/i)).toBeInTheDocument();
  });

  it('allows adjusting candidate inputs, resets to baseline, and applies scenario to plan', () => {
    const saveSpy = vi.spyOn(eventStorage, 'savePersonalEvent').mockReturnValue({ success: true });

    render(
      <ScenarioSimulationModal
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onApplyScenario={handleApplyScenario}
      />
    );

    // Adjust candidate guest count
    const guestSlider = screen.getByLabelText(/Candidate Guest Count/i);
    fireEvent.change(guestSlider, { target: { value: '250' } });

    expect(screen.getAllByText(/250 guests/i).length).toBeGreaterThan(0);

    // Reset to baseline
    fireEvent.click(screen.getByRole('button', { name: /Reset to Baseline/i }));
    expect(screen.getAllByText(/200 guests/i).length).toBeGreaterThan(0);

    // Change again to 220
    fireEvent.change(guestSlider, { target: { value: '220' } });

    // Apply scenario
    fireEvent.click(screen.getByRole('button', { name: /Apply Scenario to Plan/i }));

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const updated: Event = saveSpy.mock.calls[0][0];
    expect(updated.guestTarget).toBe(220);
    expect(handleApplyScenario).toHaveBeenCalledWith(updated);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('discards simulation when Discard is clicked', () => {
    const saveSpy = vi.spyOn(eventStorage, 'savePersonalEvent');

    render(
      <ScenarioSimulationModal
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onApplyScenario={handleApplyScenario}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Discard Simulation/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(handleApplyScenario).not.toHaveBeenCalled();
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
      <ScenarioSimulationModal
        isOpen={true}
        onClose={handleClose}
        event={mockEvent}
        onApplyScenario={handleApplyScenario}
      />
    );

    // Apply scenario
    fireEvent.click(screen.getByRole('button', { name: /Apply Scenario to Plan/i }));

    expect(saveSpy).toHaveBeenCalledWith(
      expect.anything(),
      { expectedUpdatedAt: mockEvent.updatedAt }
    );
    expect(handleApplyScenario).not.toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/updated in another session or window/i);
  });
});
