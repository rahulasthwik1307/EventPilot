import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InteractiveBanquetSeatingMatrix } from '../InteractiveBanquetSeatingMatrix';

describe('InteractiveBanquetSeatingMatrix Component', () => {
  it('renders the section headline, table switcher, and initial Mandap Royal state', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    expect(screen.getByRole('heading', { level: 2, name: /Interactive Banquet Seating Matrix/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mandap Royal Front/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sangeet Courtyard Lounge/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Elders Heritage Pavilion/i })).toBeInTheDocument();

    // Verify initial occupancy for Mandap Royal (5 of 8 seated)
    expect(screen.getByText(/5 of 8 seats/i)).toBeInTheDocument();
    expect(screen.getByText(/63%/i)).toBeInTheDocument();
  });

  it('displays all 8 attendees in the companion table roster', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    expect(screen.getAllByText('Aarav Sharma').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Meera Patel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Kavita Devi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ramesh Patel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Vikram Sharma').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sunita Sharma').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Dev Patel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ananya Sen').length).toBeGreaterThanOrEqual(1);
  });

  it('allows clicking an open chair or roster card to toggle seat reservation', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    // Initially 5 of 8 seated (m1 to m5 seated; m6 Sunita Sharma is open)
    expect(screen.getByText(/5 of 8 seats/i)).toBeInTheDocument();

    // Find Sunita Sharma's card in roster by testid and click to seat
    const sunitaCard = screen.getByTestId('roster-guest-m6');
    fireEvent.click(sunitaCard);

    // Now 6 of 8 seated
    expect(screen.getByText(/6 of 8 seats/i)).toBeInTheDocument();
    expect(screen.getByTestId('occupancy-percentage')).toHaveTextContent('75%');

    // Click again to unseat
    fireEvent.click(sunitaCard);
    expect(screen.getByText(/5 of 8 seats/i)).toBeInTheDocument();
    expect(screen.getByTestId('occupancy-percentage')).toHaveTextContent('63%');
  });

  it('seats the next available guest when clicking Seat Next', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    expect(screen.getByText(/5 of 8 seats/i)).toBeInTheDocument();
    const seatNextBtn = screen.getByRole('button', { name: /Seat Next \(5\/8\)/i });
    fireEvent.click(seatNextBtn);

    // Incremented to 6 of 8
    expect(screen.getByText(/6 of 8 seats/i)).toBeInTheDocument();
  });

  it('seats all 8 guests when clicking Auto-Seat', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    const autoSeatBtn = screen.getByRole('button', { name: /Auto-Seat/i });
    fireEvent.click(autoSeatBtn);

    expect(screen.getByText(/8 of 8 seats/i)).toBeInTheDocument();
    expect(screen.getByTestId('occupancy-percentage')).toHaveTextContent('100%');
    expect(screen.getAllByText(/Table Full/i).length).toBeGreaterThanOrEqual(1);

    // Auto-Seat button should now be disabled
    expect(autoSeatBtn).toBeDisabled();
  });

  it('resets all seats when clicking Reset', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(/0 of 8 seats/i)).toBeInTheDocument();
    expect(screen.getByTestId('occupancy-percentage')).toHaveTextContent('0%');
    expect(screen.getByText('₹0')).toBeInTheDocument();
    expect(resetBtn).toBeDisabled();
  });

  it('switches table environments and dynamically recalculates catering costs', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    // Initial Mandap Royal (thali rate ₹2,400) with 5 seats: 5 * 2400 = ₹12,000
    expect(screen.getByText('₹12,000')).toBeInTheDocument();
    expect(screen.getByText(/₹2,400\/thali/i)).toBeInTheDocument();

    // Switch to Sangeet Courtyard Lounge (thali rate ₹1,850, 4 seats initial: 4 * 1850 = ₹7,400)
    const sangeetBtn = screen.getByRole('button', { name: /Sangeet Courtyard Lounge/i });
    fireEvent.click(sangeetBtn);

    expect(screen.getAllByText('Sangeet Courtyard Lounge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹7,400')).toBeInTheDocument();
    expect(screen.getByText(/₹1,850\/thali/i)).toBeInTheDocument();
    expect(screen.getByText(/4 of 8 seats/i)).toBeInTheDocument();

    // Switch to Elders Heritage Pavilion (thali rate ₹1,650, 6 seats initial: 6 * 1650 = ₹9,900)
    const eldersBtn = screen.getByRole('button', { name: /Elders Heritage Pavilion/i });
    fireEvent.click(eldersBtn);

    expect(screen.getAllByText('Elders Heritage Pavilion').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹9,900')).toBeInTheDocument();
    expect(screen.getByText(/₹1,650\/thali/i)).toBeInTheDocument();
    expect(screen.getByText(/6 of 8 seats/i)).toBeInTheDocument();
  });

  it('dynamically tracks dietary requirements with 100% deterministic accuracy', () => {
    render(<InteractiveBanquetSeatingMatrix />);

    // In Mandap Royal with initial 5 seated: m1 (pure-veg), m2 (pure-veg), m3 (jain), m4 (jain), m5 (pure-veg)
    // 2 Jain, 3 Pure Veg, 0 Standard
    expect(screen.getByText(/2 Jain/i)).toBeInTheDocument();
    expect(screen.getByText(/3 Pure Veg/i)).toBeInTheDocument();
    expect(screen.getByText(/0 Standard/i)).toBeInTheDocument();

    // Seat m7 (Dev Patel - Standard Thali) via roster testid
    const devCard = screen.getByTestId('roster-guest-m7');
    fireEvent.click(devCard);

    expect(screen.getByText(/1 Standard/i)).toBeInTheDocument();
  });
});
