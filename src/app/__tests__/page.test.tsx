import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import HomePage from "../page";

describe("HomePage - Milestone 1, 2, and 3 End-to-End Workflows", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the studio baseline title and design system references", () => {
    render(<HomePage />);
    expect(screen.getByText("Event Pilot")).toBeInTheDocument();
    expect(screen.getByText(/Almanac Studio/i)).toBeInTheDocument();
    expect(screen.getAllByText("Panchang & Utsav Almanac").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { level: 1, name: /Every Milestone Celebration/i })).toBeInTheDocument();
  });

  it("displays the three planning archetypes with quick actions", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 3, name: "Vivaha & Weddings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Milestone Birthdays" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Community Festivals" })).toBeInTheDocument();
  });

  it("renders the clean product footer and omits internal development text", () => {
    render(<HomePage />);
    expect(screen.getByText("Event Pilot · Your celebration, thoughtfully planned.")).toBeInTheDocument();
    expect(screen.getByText("Thoughtful planning · Clear budgets · Your data stays in your browser.")).toBeInTheDocument();
    expect(screen.getAllByText("Panchang & Utsav Almanac").length).toBeGreaterThanOrEqual(1);

    // Verify obsolete development-stage strings are removed
    expect(screen.queryByText(/Challenge 5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Milestone 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deterministic Math Engine · Browser-Local Persistence/i)).not.toBeInTheDocument();
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

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const timelineTabBtn = within(nav).getByRole("button", { name: /^Timeline & Tasks$/i });
    fireEvent.click(timelineTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Timeline & Tasks Matrix")).toBeInTheDocument();
      expect(screen.getByText(/Consult Panchang for auspicious Muhurtham window/i)).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Add Task/i }).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("navigates to Vendors tab and renders vendor book in sample event", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const vendorsTabBtn = within(nav).getByRole("button", { name: /^Vendors$/i });
    fireEvent.click(vendorsTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Vendor Management Book")).toBeInTheDocument();
      expect(screen.getByText("The Tamarind Tree Estate")).toBeInTheDocument();
      expect(screen.getByText("Annapurna Heritage Caterers")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Record Vendor/i })).toBeInTheDocument();
    });
  });

  it("navigates to Guests & RSVP tab and renders guest register in sample event", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const guestsTabBtn = within(nav).getByRole("button", { name: /^Guests & RSVP$/i });
    fireEvent.click(guestsTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Guest & RSVP Management")).toBeInTheDocument();
      expect(screen.getAllByText("The Sharma Family").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Guest/i })).toBeInTheDocument();
    });
  });

  it("navigates to Seating Planner tab and renders table planner in sample event", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const seatingTabBtn = within(nav).getByRole("button", { name: /^Seating Planner$/i });
    fireEvent.click(seatingTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Practical Seating Planner")).toBeInTheDocument();
      expect(screen.getByText("Table 1 - Mandap Royal Front")).toBeInTheDocument();
      expect(screen.getByText("Unassigned Queue")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Table/i })).toBeInTheDocument();
    });
  });

  it("navigates to AI Assistant tab from navigation bar and renders live console", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation", { name: /Workspace navigation/i });
    const aiTabBtn = within(nav).getByRole("button", { name: /^AI Assistant$/i });
    fireEvent.click(aiTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Gemini Planning Assistant")).toBeInTheDocument();
      expect(screen.getByText("gemini-3.8-flash")).toBeInTheDocument();
      expect(screen.getByText(/Privacy Guard Active/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Ask Gemini/i })).toBeInTheDocument();
    });
  });

  it("navigates to AI Assistant from OverviewTab spotlight banner", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Sample Event/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav & Meera's Vivaha Celebration" })).toBeInTheDocument();
    });

    // In Overview tab, click the spotlight banner "Consult Gemini Assistant" button
    const spotlightBtn = screen.getByRole("button", { name: /Consult Gemini Assistant/i });
    fireEvent.click(spotlightBtn);

    await waitFor(() => {
      expect(screen.getByText("Gemini Planning Assistant")).toBeInTheDocument();
      expect(screen.getByText(/Zero PII Transmitted/i)).toBeInTheDocument();
    });
  });
});
