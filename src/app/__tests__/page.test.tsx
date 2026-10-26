import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import HomePage from "../page";
import { mockPush } from "../../test/setup";
import { eventStorage } from "../../features/events/storage";
import { Event } from "../../features/events/types";

describe("HomePage - Landing Page and Navigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockPush.mockClear();
  });

  it("renders the studio baseline title and design system references", () => {
    const { unmount } = render(<HomePage />);
    expect(screen.getByText("Event Pilot")).toBeInTheDocument();
    expect(screen.getByText(/Almanac Studio/i)).toBeInTheDocument();
    expect(screen.getAllByText("Panchang & Utsav Almanac").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { level: 1, name: /Every Milestone Celebration/i })).toBeInTheDocument();
    unmount();
  });

  it("displays the three planning archetypes with quick actions", () => {
    const { unmount } = render(<HomePage />);
    expect(screen.getByRole("heading", { level: 3, name: "Vivaha & Weddings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Milestone Birthdays" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Community Festivals" })).toBeInTheDocument();
    unmount();
  });

  it("renders the clean product footer and omits internal development text", () => {
    const { unmount } = render(<HomePage />);
    expect(screen.getByText("Event Pilot · Your celebration, thoughtfully planned.")).toBeInTheDocument();
    expect(screen.getByText("Thoughtful planning · Clear budgets · Your data stays in your browser.")).toBeInTheDocument();
    expect(screen.getAllByText("Panchang & Utsav Almanac").length).toBeGreaterThanOrEqual(1);

    // Verify obsolete development-stage strings are removed
    expect(screen.queryByText(/Challenge 5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Milestone 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deterministic Math Engine · Browser-Local Persistence/i)).not.toBeInTheDocument();
    unmount();
  });

  it("opens shared creation dialog with corresponding archetype when clicking archetype cards", async () => {
    const { unmount } = render(<HomePage />);

    // Test Birthday Archetype Card
    const startBirthdayBtn = screen.getByRole("button", { name: /Start Birthday/i });
    fireEvent.click(startBirthdayBtn);

    expect(screen.getByRole("heading", { name: "Create Celebration Plan" })).toBeInTheDocument();
    const birthdayOption = screen.getByRole("button", { name: /Milestone Birthday/i });
    expect(birthdayOption).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByPlaceholderText("e.g. Grandma's 80th Milestone Celebration")).toBeInTheDocument();

    // Close dialog
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Create Celebration Plan" })).not.toBeInTheDocument();
    });

    // Test Community Festival Archetype Card
    const startCommunityBtn = screen.getByRole("button", { name: /Start Community/i });
    fireEvent.click(startCommunityBtn);

    expect(screen.getByRole("heading", { name: "Create Celebration Plan" })).toBeInTheDocument();
    const communityOption = screen.getByRole("button", { name: /Community Festival/i });
    expect(communityOption).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByPlaceholderText("e.g. Diwali Community Festival 2026")).toBeInTheDocument();

    // Close dialog
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Create Celebration Plan" })).not.toBeInTheDocument();
    });

    // Test Wedding Archetype Card
    const startWeddingBtn = screen.getByRole("button", { name: /Start Wedding/i });
    fireEvent.click(startWeddingBtn);

    expect(screen.getByRole("heading", { name: "Create Celebration Plan" })).toBeInTheDocument();
    const weddingOption = screen.getByRole("button", { name: /Wedding \/ Vivaha/i });
    expect(weddingOption).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByPlaceholderText("e.g. Priya & Rohan's Vivaha Celebration")).toBeInTheDocument();

    unmount();
  });

  it("navigates to /events/sample when clicking 'Explore Sample Event'", async () => {
    const { unmount } = render(<HomePage />);
    const exploreBtn = screen.getByRole("button", { name: /Explore Sample Event/i });
    fireEvent.click(exploreBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/sample");
    });
    unmount();
  });

  it("allows creating a personal celebration and navigates to its dedicated route", async () => {
    const { unmount } = render(<HomePage />);

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
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/events\//));
    });
    unmount();
  });

  it("renders saved events list and navigates to event workspace on selection", async () => {
    const mockEvent: Event = {
      id: "personal-evt-123",
      title: "Ananya's First Birthday",
      type: "birthday",
      date: "2026-12-10",
      guestTarget: 50,
      budgetCap: 100000,
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
    eventStorage.savePersonalEvent(mockEvent);

    const { unmount } = render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Ananya's First Birthday")).toBeInTheDocument();
    });

    const openBtn = screen.getByRole("button", { name: /Open Workspace/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events/personal-evt-123");
    });
    unmount();
  });

  it("allows deleting a personal celebration from the saved list", async () => {
    const mockEvent: Event = {
      id: "personal-evt-delete-me",
      title: "Temporary Celebration",
      type: "community",
      date: "2026-12-10",
      guestTarget: 50,
      budgetCap: 50000,
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
    eventStorage.savePersonalEvent(mockEvent);

    const { unmount } = render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Temporary Celebration")).toBeInTheDocument();
    });

    // Mock confirm dialog
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    const deleteBtn = screen.getByRole("button", { name: /Delete Temporary Celebration/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText("Temporary Celebration")).not.toBeInTheDocument();
    });
    unmount();
  });
});
