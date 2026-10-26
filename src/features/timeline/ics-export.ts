/**
 * Event Pilot iCalendar (.ics) Export Engine
 * Generates RFC 5545 compliant .ics calendar files for celebration milestones.
 * Fully client-side, offline, zero third-party dependencies.
 */

import { Event, TimelineMilestone } from '../events/types';
import { calculateMilestoneDate } from '../events/timeline-engine';

/**
 * Escapes characters according to RFC 5545 Section 3.3.11.
 * Special characters that MUST be escaped with a backslash: backslash, semicolon, comma, newline.
 */
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Folds lines to max 75 octets per RFC 5545 Section 3.1.
 * Subsequent lines begin with a single space character.
 */
export function foldIcsLine(line: string): string {
  const MAX_LENGTH = 75;
  if (line.length <= MAX_LENGTH) {
    return line;
  }

  let result = '';
  let remaining = line;

  // First line can be up to 75 chars
  result += remaining.slice(0, MAX_LENGTH);
  remaining = remaining.slice(MAX_LENGTH);

  // Subsequent folded lines start with a space, so max length is 74 remaining chars
  while (remaining.length > 0) {
    result += '\r\n ' + remaining.slice(0, MAX_LENGTH - 1);
    remaining = remaining.slice(MAX_LENGTH - 1);
  }

  return result;
}

/**
 * Converts a YYYY-MM-DD date string to YYYYMMDD format for RFC 5545 DATE value.
 * Returns null if the date format is invalid.
 */
export function formatIcsDate(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleaned = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleaned);
  if (!match) return null;
  return `${match[1]}${match[2]}${match[3]}`;
}

/**
 * Generates RFC 5545 compliant VCALENDAR content containing all event milestones.
 */
export function generateMilestonesIcs(event: Event, nowIso = new Date().toISOString()): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Pilot//Panchang and Utsav Almanac//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // Calendar Name
  const safeEventTitle = event.title ? event.title.trim() : 'Celebration';
  lines.push(`X-WR-CALNAME:${escapeIcsText(`Event Pilot - ${safeEventTitle}`)}`);

  // Fixed timestamp for DTSTAMP
  const stampDate = formatIcsDate(nowIso.slice(0, 10)) || '20260101';
  const stampTime = nowIso.slice(11, 19).replace(/:/g, '') || '000000';
  const dtStamp = `${stampDate}T${stampTime}Z`;

  const milestones: TimelineMilestone[] = event.milestones || [];
  const eventId = event.id || 'event';

  for (const m of milestones) {
    if (!m.title) continue;

    // Calculate effective date
    let effectiveDateStr: string;
    try {
      effectiveDateStr = calculateMilestoneDate(event.date, m.offsetDays || 0);
    } catch {
      continue;
    }

    const icsDate = formatIcsDate(effectiveDateStr);
    if (!icsDate) continue;

    const safeUid = `milestone-${m.id || Math.random().toString(36).substring(2, 9)}-${eventId}@eventpilot.local`;
    const summary = escapeIcsText(m.title.trim());
    const desc = m.description ? escapeIcsText(m.description.trim()) : undefined;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${safeUid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${icsDate}`);
    lines.push(`SUMMARY:${summary}`);
    if (desc) {
      lines.push(`DESCRIPTION:${desc}`);
    }
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // Apply line folding and RFC 5545 CRLF line endings
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/**
 * Triggers an offline browser download of the generated .ics file.
 */
export function downloadMilestonesIcs(event: Event): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const icsContent = generateMilestonesIcs(event);
    const sanitizedTitle = (event.title || 'celebration')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    const filename = `${sanitizedTitle}-milestones.ics`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL after small timeout
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    return true;
  } catch (err) {
    console.error('Failed to trigger .ics download', err);
    return false;
  }
}
