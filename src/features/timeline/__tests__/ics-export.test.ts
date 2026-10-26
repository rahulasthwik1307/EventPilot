import { describe, expect, it, vi } from 'vitest';
import {
  escapeIcsText,
  foldIcsLine,
  formatIcsDate,
  generateMilestonesIcs,
  downloadMilestonesIcs,
} from '../ics-export';
import { Event } from '../../events/types';

describe('iCalendar (.ics) Export Engine', () => {
  const baseEvent: Event = {
    id: 'evt-ics-test',
    type: 'wedding',
    title: "Priya & Rohan's Vivaha Celebration",
    date: '2026-12-15',
    guestTarget: 250,
    budgetCap: 1500000,
    currency: 'INR',
    categories: [],
    expenses: [],
    milestones: [
      {
        id: 'm1',
        title: '6 Months Prior — Muhurat, Venue & Caterer Booking',
        offsetDays: -180,
        description: 'Reserve Kalyana Mandapam, confirm Purohit, taste Sadya feast menu.',
      },
      {
        id: 'm2',
        title: '1 Month Prior — Invitations, Attire & Floral Decor',
        offsetDays: -30,
        description: 'Distribute Lagna Patrika; finalize silk sarees; confirm floral vendor.',
      },
      {
        id: 'm3',
        title: 'Celebration Day — Vivaha Muhurtham',
        offsetDays: 0,
        description: 'Morning auspicious Muhurtham ceremony followed by wedding feast.',
      },
    ],
    tasks: [],
    vendors: [],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  describe('escapeIcsText', () => {
    it('escapes commas, semicolons, backslashes, and newlines per RFC 5545', () => {
      const input = 'Catering, Decor; Cost: \\100\nNext line';
      const escaped = escapeIcsText(input);
      expect(escaped).toBe('Catering\\, Decor\\; Cost: \\\\100\\nNext line');
    });

    it('handles empty or undefined string safely', () => {
      expect(escapeIcsText('')).toBe('');
      expect(escapeIcsText(null as unknown as string)).toBe('');
    });
  });

  describe('foldIcsLine', () => {
    it('leaves lines 75 characters or shorter intact', () => {
      const short = 'SUMMARY:6 Months Prior — Muhurat';
      expect(foldIcsLine(short)).toBe(short);
    });

    it('folds lines longer than 75 characters with CRLF and leading space', () => {
      const long =
        'DESCRIPTION:This is an exceptionally detailed ceremonial checklist item for the grand wedding celebration with mandap flowers and music';
      const folded = foldIcsLine(long);
      expect(folded).toContain('\r\n ');
      const parts = folded.split('\r\n ');
      expect(parts[0].length).toBeLessThanOrEqual(75);
      expect(parts[1].length).toBeLessThanOrEqual(75);
    });
  });

  describe('formatIcsDate', () => {
    it('converts YYYY-MM-DD to YYYYMMDD', () => {
      expect(formatIcsDate('2026-12-15')).toBe('20261215');
      expect(formatIcsDate('2026-06-18')).toBe('20260618');
    });

    it('returns null for invalid date formats', () => {
      expect(formatIcsDate('invalid')).toBeNull();
      expect(formatIcsDate('15/12/2026')).toBeNull();
      expect(formatIcsDate('')).toBeNull();
    });
  });

  describe('generateMilestonesIcs', () => {
    it('generates valid RFC 5545 VCALENDAR with CRLF line endings', () => {
      const ics = generateMilestonesIcs(baseEvent, '2026-10-26T10:00:00Z');

      // Uses strict CRLF
      expect(ics).toContain('\r\n');
      expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
      expect(ics).toContain('PRODID:-//Event Pilot//Panchang and Utsav Almanac//EN\r\n');
      expect(ics).toContain('VERSION:2.0\r\n');
      expect(ics).toContain('CALSCALE:GREGORIAN\r\n');
      expect(ics).toContain('END:VCALENDAR\r\n');
    });

    it('exports all milestones with date-only DTSTART and stable UIDs', () => {
      const ics = generateMilestonesIcs(baseEvent, '2026-10-26T10:00:00Z');

      // Milestone 1: 2026-12-15 - 180 days = 2026-06-18
      expect(ics).toContain('UID:milestone-m1-evt-ics-test@eventpilot.local');
      expect(ics).toContain('DTSTART;VALUE=DATE:20260618');
      expect(ics).toContain('SUMMARY:6 Months Prior — Muhurat\\, Venue & Caterer Booking');

      // Milestone 2: 2026-12-15 - 30 days = 2026-11-15
      expect(ics).toContain('UID:milestone-m2-evt-ics-test@eventpilot.local');
      expect(ics).toContain('DTSTART;VALUE=DATE:20261115');

      // Milestone 3: 2026-12-15
      expect(ics).toContain('UID:milestone-m3-evt-ics-test@eventpilot.local');
      expect(ics).toContain('DTSTART;VALUE=DATE:20261215');

      // Count VEVENT components (should be 3)
      const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(eventCount).toBe(3);
    });

    it('handles empty milestones gracefully', () => {
      const emptyEvent: Event = {
        ...baseEvent,
        milestones: [],
      };

      const ics = generateMilestonesIcs(emptyEvent);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).not.toContain('BEGIN:VEVENT');
    });

    it('skips milestones with invalid or missing dates safely', () => {
      const corruptedEvent: Event = {
        ...baseEvent,
        date: 'not-a-valid-date',
      };

      const ics = generateMilestonesIcs(corruptedEvent);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      // Should not throw or generate corrupt VEVENTs
      expect(ics).not.toContain('BEGIN:VEVENT');
    });
  });

  describe('downloadMilestonesIcs', () => {
    it('creates blob, appends anchor, clicks, and cleans up without errors', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/dummy');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === 'a') {
          el.click = clickMock;
        }
        return el;
      });

      const success = downloadMilestonesIcs(baseEvent);
      expect(success).toBe(true);
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(clickMock).toHaveBeenCalledTimes(1);

      vi.restoreAllMocks();
    });
  });
});
