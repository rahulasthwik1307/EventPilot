import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "../page";

describe("HomePage Baseline", () => {
  it("renders the studio baseline title and heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Event Pilot" })).toBeInTheDocument();
    expect(screen.getByText(/Celebration & Event Planning Studio/i)).toBeInTheDocument();
  });

  it("displays the design system reference", () => {
    render(<HomePage />);
    expect(screen.getByText("Panchang & Utsav Almanac")).toBeInTheDocument();
  });

  it("renders primary action buttons with accessible text", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: /Explore Workspace/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Documentation/i })).toBeInTheDocument();
  });
});
