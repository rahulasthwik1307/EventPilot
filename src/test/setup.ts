import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => window.location.pathname,
  useParams: () => {
    // If window.location.pathname is like /events/some-id, extract it
    const match = window.location.pathname.match(/\/events\/([^/?]+)/);
    return { id: match ? match[1] : "sample" };
  },
}));
