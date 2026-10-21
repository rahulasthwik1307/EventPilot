import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import HomePage from "../page";

describe("HomePage - Milestone 1 Core Event Experience", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the studio baseline title and design system references", () => {
    render(<HomePage />);
    expect(screen.getByText("Event Pilot")).toBeInTheDocument();
    expect(screen.getByText(/Almanac Studio/i)).toBeInTheDocument();
    expect(screen.getByText("Panchang & Utsav Almanac")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /Every Milestone Celebration/i })).toBeInTheDocument();
  });

  it("displays the three planning archetypes with quick actions", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 3, name: "Vivaha & Weddings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Milestone Birthdays" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Community Festivals" })).toBeInTheDocument();
  });

  it("opens the sample celebration sandbox workspace when clicking 'Explore Sample Event'", async () => {
    render(<HomePage />);
    const exploreBtn = screen.getByRole("button", { name: /Explore Sample Event/i });
    fireEvent.click(exploreBtn);

    await waitFor(() => {
      expect(screen.getByText(/SAMPLE SANDBOX/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
      expect(screen.getByText(/Sample Celebration Sandbox/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset Sample/i })).toBeInTheDocument();
    });
  });

  it("allows navigating back to the celebration studio from workspace", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    const backBtn = screen.getByRole("button", { name: /Celebration Studio/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /Every Milestone Celebration/i })).toBeInTheDocument();
    });
  });

  it("allows creating a personal celebration and transitions to its workspace", async () => {
    render(<HomePage />);

    // Click "Create New Celebration" in hero
    const createBtn = screen.getByRole("button", { name: /Create New Celebration/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole("heading", { name: "Create Celebration Plan" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Celebration Title/i), {
      target: { value: "Rohan's Milestone 40th Birthday" },
    });
    fireEvent.change(screen.getByLabelText(/Celebration Date/i), {
      target: { value: "2026-11-28" },
    });
    fireEvent.change(screen.getByLabelText(/Expected Guests/i), {
      target: { value: "75" },
    });
    fireEvent.change(screen.getByLabelText(/Total Budget Cap/i), {
      target: { value: "250000" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Celebration Plan/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Rohan's Milestone 40th Birthday" })).toBeInTheDocument();
      expect(screen.getByText(/PERSONAL EVENT · LOCAL/i)).toBeInTheDocument();
      expect(screen.getAllByText("₹2,50,000").length).toBeGreaterThan(0);
    });
  });

  it("navigates to Budget Ledger tab and renders category ledger in sample event", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    // Click Budget Ledger tab in workspace nav
    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const budgetTabBtn = within(nav).getByRole("button", { name: /^Budget Ledger$/i });
    fireEvent.click(budgetTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Budget & Expense Ledger")).toBeInTheDocument();
      expect(screen.getAllByText(/Venue & Traditional Catering/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/The Tamarind Tree Main Mandap Hall Booking/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Record Expense/i })).toBeInTheDocument();
    });
  });

  it("navigates to Timeline & Tasks tab and renders matrix in sample event", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    // Click Timeline & Tasks tab in workspace nav
    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const timelineTabBtn = within(nav).getByRole("button", { name: /^Timeline & Tasks$/i });
    fireEvent.click(timelineTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Timeline & Tasks Matrix")).toBeInTheDocument();
      expect(screen.getByText(/Consult Panchang for auspicious Muhurtham window/i)).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Add Task/i }).length).toBeGreaterThanOrEqual(1);
    });
  });
});
