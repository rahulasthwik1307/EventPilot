import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import EventWorkspacePage from "../page";
import { mockPush } from "../../../../test/setup";
import { eventStorage } from "../../../../features/events/storage";
import { Event } from "../../../../features/events/types";

describe("EventWorkspacePage - Dedicated Workspace Routes and Tabs", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockPush.mockClear();
    window.history.pushState({}, "", "/events/sample");
  });

  it("renders the sample celebration sandbox workspace when visiting /events/sample", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(screen.getByText(/SAMPLE SANDBOX/i)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
      expect(screen.getByText(/Sample Celebration Sandbox/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset Sample/i })).toBeInTheDocument();
    });
  });

  it("navigates back to the celebration studio (/) when clicking back button", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const backBtn = screen.getByRole("button", { name: /Celebration Studio/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("resets sample event when clicking Reset Sample button", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Reset Sample/i })).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", { name: /Reset Sample/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });
  });

  it("navigates to Budget Ledger tab and updates URL with ?tab=budget", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const budgetTabBtn = within(nav).getByRole("button", { name: /^Budget Ledger$/i });
    fireEvent.click(budgetTabBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample?tab=budget");
      expect(screen.getByText("Budget & Expense Ledger")).toBeInTheDocument();
      expect(screen.getAllByText(/Venue & Traditional Catering/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/The Tamarind Tree Main Mandap Hall Booking/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Record Expense/i })).toBeInTheDocument();
    });
  });

  it("navigates to Timeline & Tasks tab and updates URL with ?tab=timeline", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const timelineTabBtn = within(nav).getByRole("button", { name: /^Timeline & Tasks$/i });
    fireEvent.click(timelineTabBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample?tab=timeline");
      expect(screen.getByRole("heading", { level: 2, name: /^Timeline & Tasks$/i })).toBeInTheDocument();
      expect(screen.getByText(/Consult Panchang for auspicious Muhurtham window/i)).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Add Task/i }).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("navigates to Vendors tab and updates URL with ?tab=vendors", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const vendorsTabBtn = within(nav).getByRole("button", { name: /^Vendors$/i });
    fireEvent.click(vendorsTabBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample?tab=vendors");
      expect(screen.getByText("Vendor Directory & Contracts")).toBeInTheDocument();
      expect(screen.getByText("The Tamarind Tree Estate")).toBeInTheDocument();
      expect(screen.getByText("Annapurna Heritage Caterers")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Record Vendor/i })).toBeInTheDocument();
    });
  });

  it("navigates to Guests & RSVP tab and updates URL with ?tab=guests", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const guestsTabBtn = within(nav).getByRole("button", { name: /^Guests & RSVP$/i });
    fireEvent.click(guestsTabBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample?tab=guests");
      expect(screen.getByText("Guest & RSVP Management")).toBeInTheDocument();
      expect(screen.getAllByText("The Sharma Family").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Guest/i })).toBeInTheDocument();
    });
  });

  it("navigates to Seating Planner tab and updates URL with ?tab=seating", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const seatingTabBtn = within(nav).getByRole("button", { name: /^Seating Planner$/i });
    fireEvent.click(seatingTabBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample?tab=seating");
      expect(screen.getByText("Banquet Seating Planner")).toBeInTheDocument();
      expect(screen.getByText("Table 1 - Mandap Royal Front")).toBeInTheDocument();
      expect(screen.getByText("Unassigned Queue")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Table/i })).toBeInTheDocument();
    });
  });

  it("navigates to AI Assistant tab from navigation bar and renders live console", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const aiTabBtn = within(nav).getByRole("button", { name: /^AI Assistant$/i });
    fireEvent.click(aiTabBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample?tab=ai");
      expect(screen.getByText("AI Planning Assistant")).toBeInTheDocument();
      expect(screen.getByText("Cloudflare AI + Fallback")).toBeInTheDocument();
      expect(screen.getByText(/Privacy Guard Active/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Ask Assistant/i })).toBeInTheDocument();
    });
  });

  it("navigates to AI Assistant from OverviewTab spotlight banner", async () => {
    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })
      ).toBeInTheDocument();
    });

    const spotlightBtn = screen.getByRole("button", { name: /Consult AI Assistant/i });
    fireEvent.click(spotlightBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample?tab=ai");
      expect(screen.getByText("AI Planning Assistant")).toBeInTheDocument();
    });
  });

  it("renders personal event workspace when given personal event id", async () => {
    const personalEvent: Event = {
      id: "personal-evt-456",
      title: "Kavita's Sangeet Evening",
      type: "wedding",
      date: "2026-11-20",
      guestTarget: 120,
      budgetCap: 500000,
      currency: "INR",
      isSample: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: [],
      expenses: [],
      milestones: [],
      tasks: [],
      vendors: [],
      households: [],
      guests: [],
      tables: [],
      assignments: [],
      quotations: [],
    };
    eventStorage.savePersonalEvent(personalEvent);

    window.history.pushState({}, "", "/events/personal-evt-456");

    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Kavita's Sangeet Evening" })
      ).toBeInTheDocument();
      expect(screen.getByText(/PERSONAL EVENT · LOCAL/i)).toBeInTheDocument();
    });
  });

  it("renders Celebration Not Found view when celebration does not exist in storage", async () => {
    window.history.pushState({}, "", "/events/non-existent-id");

    render(<EventWorkspacePage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Celebration Not Found" })).toBeInTheDocument();
      expect(
        screen.getByText(/This celebration could not be located in your browser storage/i)
      ).toBeInTheDocument();
    });

    const returnBtn = screen.getByRole("button", { name: /Return to Celebration Studio/i });
    fireEvent.click(returnBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
