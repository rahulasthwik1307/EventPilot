import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Automatically unmount rendered components to trigger useEffect cleanup handlers
// (e.g. interval timers) and prevent lingering timer handles.
afterEach(() => {
  cleanup();
});

export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockBack = vi.fn();
export const mockPrefetch = vi.fn();

// Stable router instance to prevent re-render infinite loops when components have [router] in useEffect dependencies
export const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: mockPrefetch,
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => window.location.pathname,
  useParams: () => {
    // If window.location.pathname is like /events/some-id, extract it
    const match = window.location.pathname.match(/\/events\/([^/?]+)/);
    return { id: match ? match[1] : "sample" };
  },
}));
