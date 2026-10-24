import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventCreateDialog } from '../EventCreateDialog';

describe('EventCreateDialog Component', () => {
  const handleClose = vi.fn();
  const handleSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders all required form fields and labels when open', () => {
    render(
      <EventCreateDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: 'Create Celebration Plan' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Celebration Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Celebration Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expected Guests/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Budget Cap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Currency/i)).toBeInTheDocument();
  });

  it('validates required fields and displays plain-language error messages', () => {
    render(
      <EventCreateDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Click submit with empty title and empty date
    fireEvent.click(screen.getByRole('button', { name: /Create Celebration Plan/i }));

    expect(screen.getByText(/Event title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Event date is required/i)).toBeInTheDocument();
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('rejects invalid numbers and short titles with plain-language feedback', () => {
    render(
      <EventCreateDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText(/Celebration Title/i), {
      target: { value: 'Hi' }, // too short (< 3 chars)
    });
    fireEvent.change(screen.getByLabelText(/Expected Guests/i), {
      target: { value: '-5' },
    });
    fireEvent.change(screen.getByLabelText(/Total Budget Cap/i), {
      target: { value: '0' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Celebration Plan/i }));

    expect(screen.getByText(/Event title must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/positive whole number/i)).toBeInTheDocument();
    expect(screen.getByText(/positive amount/i)).toBeInTheDocument();
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('creates and persists a valid event when valid data is submitted', () => {
    render(
      <EventCreateDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialType="birthday"
      />
    );

    fireEvent.change(screen.getByLabelText(/Celebration Title/i), {
      target: { value: "Vihaan's 5th Birthday Carnival" },
    });
    fireEvent.change(screen.getByLabelText(/Celebration Date/i), {
      target: { value: '2026-11-15' },
    });
    fireEvent.change(screen.getByLabelText(/Expected Guests/i), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByLabelText(/Total Budget Cap/i), {
      target: { value: '150000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Celebration Plan/i }));

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    const created = handleSuccess.mock.calls[0][0];
    expect(created.title).toBe("Vihaan's 5th Birthday Carnival");
    expect(created.type).toBe('birthday');
    expect(created.guestTarget).toBe(60);
    expect(created.budgetCap).toBe(150000);
    expect(created.currency).toBe('INR');
    expect(created.isSample).toBe(false);
  });

  it('allows advancing to step 2 personalization, tailoring questions, and saving explicit preferences', () => {
    render(
      <EventCreateDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialType="wedding"
      />
    );

    // Fill valid Step 1 details
    fireEvent.change(screen.getByLabelText(/Celebration Title/i), {
      target: { value: "Kavya & Arjun's Vivaha" },
    });
    fireEvent.change(screen.getByLabelText(/Celebration Date/i), {
      target: { value: '2026-12-20' },
    });
    fireEvent.change(screen.getByLabelText(/Expected Guests/i), {
      target: { value: '250' },
    });
    fireEvent.change(screen.getByLabelText(/Total Budget Cap/i), {
      target: { value: '2000000' },
    });

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next: Personalize/i }));

    // Verify Step 2 UI is displayed
    expect(screen.getByText(/Celebration Priorities & Focus/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Financial Flexibility/i })).toBeInTheDocument();
    expect(screen.getByText(/Guest Comfort & Accessibility/i)).toBeInTheDocument();

    // Select Wheelchair Ramp Access
    fireEvent.click(screen.getByRole('button', { name: /Wheelchair Ramp Access/i }));

    // Click Save & Create Celebration Plan
    fireEvent.click(screen.getByRole('button', { name: /Save & Create Celebration Plan/i }));

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    const created = handleSuccess.mock.calls[0][0];
    expect(created.title).toBe("Kavya & Arjun's Vivaha");
    expect(created.preferences).toBeDefined();
    expect(created.preferences?.logistics?.provenance).toBe('explicit');
    expect(created.preferences?.logistics?.value.accessibilityRequirements).toContain('wheelchair_access');
  });
});
