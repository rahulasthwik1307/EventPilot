import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import EventWorkspacePage from "../page";
import { mockPush } from "../../../../test/setup";
import { eventStorage, STORAGE_KEYS } from "../../../../features/events/storage";
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

  describe("Optimistic Concurrency & Cross-Tab Collision Protection", () => {
    const createPersonalTestEvent = (id = "concurrency-test-evt"): Event => ({
      id,
      title: "Priya & Rohan's Vivaha",
      type: "wedding",
      date: "2026-12-15",
      guestTarget: 250,
      budgetCap: 1200000,
      currency: "INR",
      isSample: false,
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      categories: [],
      expenses: [],
      milestones: [
        {
          id: "m-1",
          title: "Muhurtham Preparation",
          offsetDays: -30,
        },
      ],
      tasks: [
        {
          id: "task-concurrency-1",
          title: "Book Mandap Hall",
          milestoneId: "m-1",
          priority: "urgent",
          status: "pending",
          dueDate: "2026-11-15",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      vendors: [],
      households: [],
      guests: [],
      tables: [],
      assignments: [],
      quotations: [],
    });

    it("passes expectedVersion and expectedUpdatedAt on normal workspace update and advances version", async () => {
      const initial = createPersonalTestEvent("evt-normal-save");
      eventStorage.savePersonalEvent(initial);
      const storedBeforeRender = eventStorage.getPersonalEvent("evt-normal-save").data!;

      const saveSpy = vi.spyOn(eventStorage, "savePersonalEvent");

      window.history.pushState({}, "", "/events/evt-normal-save?tab=timeline");
      render(<EventWorkspacePage />);

      await waitFor(() => {
        expect(screen.getByText("Book Mandap Hall")).toBeInTheDocument();
      });

      // Toggle task status
      const toggleBtn = screen.getByLabelText("Mark Book Mandap Hall as completed");
      fireEvent.click(toggleBtn);

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({ id: "evt-normal-save" }),
          expect.objectContaining({
            expectedVersion: 1,
            expectedUpdatedAt: storedBeforeRender.updatedAt,
          })
        );
      });

      // Check stored version advanced to 2
      const stored = eventStorage.getPersonalEvent("evt-normal-save").data!;
      expect(stored.version).toBe(2);
      expect(stored.tasks[0].status).toBe("completed");

      // Verify no conflict alert is rendered
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      saveSpy.mockRestore();
    });

    it("surfaces recoverable conflict alert when storage rejects stale save and does not show false success", async () => {
      // 1. Initial event saved at Version 1
      const initial = createPersonalTestEvent("evt-stale-conflict");
      eventStorage.savePersonalEvent(initial);

      window.history.pushState({}, "", "/events/evt-stale-conflict?tab=timeline");
      render(<EventWorkspacePage />);

      await waitFor(() => {
        expect(screen.getByText("Book Mandap Hall")).toBeInTheDocument();
      });

      // 2. Simulate Tab A concurrently saving a payment in the background
      const v1Stored = eventStorage.getPersonalEvent("evt-stale-conflict").data!;
      const paymentExpense = {
        id: "exp-tab-a-1",
        categoryId: "cat-1",
        title: "Tab A Mandap Advance",
        estimatedAmount: 75000,
        actualAmount: 75000,
        paymentStatus: "settled" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const tabAUpdated: Event = {
        ...v1Stored,
        expenses: [paymentExpense],
      };
      // Tab A successfully saves and advances stored version to 2
      const tabASaveRes = eventStorage.savePersonalEvent(tabAUpdated, {
        expectedVersion: v1Stored.version,
        expectedUpdatedAt: v1Stored.updatedAt,
      });
      expect(tabASaveRes.success).toBe(true);
      expect(eventStorage.getPersonalEvent("evt-stale-conflict").data?.version).toBe(2);

      // 3. Tab B (the rendered workspace, still on V1) attempts an edit (toggling task)
      const toggleBtn = screen.getByLabelText("Mark Book Mandap Hall as completed");
      fireEvent.click(toggleBtn);

      // 4. Concurrency conflict banner is surfaced
      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/Save Conflict:/i);
        expect(alert).toHaveTextContent(/updated in another session/i);
        expect(screen.getByRole("button", { name: /Reload Latest Celebration/i })).toBeInTheDocument();
      });

      // 5. Verify Tab A's persisted data in storage was NOT overwritten
      const preserved = eventStorage.getPersonalEvent("evt-stale-conflict").data!;
      expect(preserved.version).toBe(2);
      expect(preserved.expenses).toHaveLength(1);
      expect(preserved.expenses[0].title).toBe("Tab A Mandap Advance");
      // The task in storage was NOT toggled by Tab B's rejected save
      expect(preserved.tasks[0].status).toBe("pending");
    });

    it("reloads latest persisted state when clicking Reload Latest Celebration button", async () => {
      const initial = createPersonalTestEvent("evt-reload-test");
      eventStorage.savePersonalEvent(initial);

      window.history.pushState({}, "", "/events/evt-reload-test?tab=timeline");
      render(<EventWorkspacePage />);

      await waitFor(() => {
        expect(screen.getByText("Book Mandap Hall")).toBeInTheDocument();
      });

      // Concurrent update in storage
      const stored = eventStorage.getPersonalEvent("evt-reload-test").data!;
      eventStorage.savePersonalEvent(
        { ...stored, title: "Priya & Rohan's Vivaha — Updated by Tab A" },
        { expectedVersion: stored.version, expectedUpdatedAt: stored.updatedAt }
      );

      // Trigger conflict by attempting update with stale version
      const toggleBtn = screen.getByLabelText("Mark Book Mandap Hall as completed");
      fireEvent.click(toggleBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Click "Reload Latest Celebration"
      const reloadBtn = screen.getByRole("button", { name: /Reload Latest Celebration/i });
      fireEvent.click(reloadBtn);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(
          screen.getByRole("heading", { level: 1, name: "Priya & Rohan's Vivaha — Updated by Tab A" })
        ).toBeInTheDocument();
      });
    });

    it("detects cross-tab storage changes and warns user that workspace snapshot is stale", async () => {
      const initial = createPersonalTestEvent("evt-cross-tab-stale");
      eventStorage.savePersonalEvent(initial);

      window.history.pushState({}, "", "/events/evt-cross-tab-stale");
      render(<EventWorkspacePage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1, name: "Priya & Rohan's Vivaha" })).toBeInTheDocument();
      });

      // Another tab saves changes into localStorage
      const stored = eventStorage.getPersonalEvent("evt-cross-tab-stale").data!;
      eventStorage.savePersonalEvent(
        { ...stored, title: "Priya & Rohan — Edited in Tab B" },
        { expectedVersion: stored.version, expectedUpdatedAt: stored.updatedAt }
      );

      // Dispatch cross-tab storage event
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: STORAGE_KEYS.PERSONAL_EVENTS,
            newValue: window.localStorage.getItem(STORAGE_KEYS.PERSONAL_EVENTS),
          })
        );
      });

      // Status banner appears warning the user
      await waitFor(() => {
        const statusBanner = screen.getByRole("status");
        expect(statusBanner).toBeInTheDocument();
        expect(statusBanner).toHaveTextContent(/Celebration Updated Elsewhere/i);
        expect(statusBanner).toHaveTextContent(/Another tab made changes/i);
      });

      // Click reload in status banner
      const reloadBtn = within(screen.getByRole("status")).getByRole("button", {
        name: /Reload Latest Celebration/i,
      });
      fireEvent.click(reloadBtn);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(
          screen.getByRole("heading", { level: 1, name: "Priya & Rohan — Edited in Tab B" })
        ).toBeInTheDocument();
      });
    });

    it("handles cross-tab event deletion safely by showing Celebration Not Found", async () => {
      const initial = createPersonalTestEvent("evt-cross-tab-delete");
      eventStorage.savePersonalEvent(initial);

      window.history.pushState({}, "", "/events/evt-cross-tab-delete");
      render(<EventWorkspacePage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1, name: "Priya & Rohan's Vivaha" })).toBeInTheDocument();
      });

      // Another tab deletes the event from storage
      eventStorage.deletePersonalEvent("evt-cross-tab-delete");

      // Dispatch storage event
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: STORAGE_KEYS.PERSONAL_EVENTS,
            newValue: window.localStorage.getItem(STORAGE_KEYS.PERSONAL_EVENTS),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1, name: "Celebration Not Found" })).toBeInTheDocument();
      });
    });
  });
});
