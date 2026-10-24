import { jsPDF } from 'jspdf';
import { VendorRequirementBrief } from '../types';

/**
 * Generates and downloads a clean, beautifully formatted vector PDF
 * representing the Vendor Requirement Brief matching the visual letterhead design.
 * Does NOT contain raw markdown symbols.
 */
export function downloadVendorBriefPdf(brief: VendorRequirementBrief): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const drawHeaderHairline = () => {
    // Saffron accent hairline at top of page (#D97706)
    doc.setFillColor(217, 119, 6);
    doc.rect(margin, y, contentWidth, 3, 'F');
    y += 14;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 36) {
      doc.addPage();
      y = margin;
      drawHeaderHairline();
    }
  };

  // Top Panchang hairline accent
  drawHeaderHairline();

  // Letterhead super-title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(194, 65, 12); // #C2410C
  doc.text('OFFICIAL VENDOR PROCUREMENT BRIEF', margin, y);
  y += 18;

  // Document Title
  doc.setFont('times', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(28, 25, 23); // #1C1917
  doc.text(`Vendor Requirement Brief: ${brief.categoryLabel}`, margin, y);
  y += 18;

  // Subtitle / Event Context
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(120, 113, 108); // #78716C
  const eventSub = `Celebration: ${brief.eventTitle} (${brief.eventType || 'Celebration'})   |   Date: ${brief.eventDate}`;
  doc.text(eventSub, margin, y);
  y += 16;

  // Thin hairline divider
  doc.setDrawColor(231, 223, 213); // #E7DFD5
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentWidth, y);
  y += 16;

  // Parameter Summary 4-Column Box
  const summaryBoxHeight = 52;
  doc.setFillColor(250, 248, 245); // #FAF8F5
  doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 4, 4, 'F');
  doc.setDrawColor(231, 223, 213);
  doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 4, 4, 'S');

  const colWidth = contentWidth / 4;
  const params = [
    { label: 'TARGET DATE', val: brief.eventDate },
    { label: 'HEADCOUNT', val: `${brief.guestTarget} guests` },
    { label: 'LOCATION', val: brief.location || 'To be finalized' },
    { label: 'CATEGORY BUDGET', val: brief.allocatedCategoryBudgetFormatted || 'Envelope open' },
  ];

  params.forEach((param, idx) => {
    const colX = margin + idx * colWidth + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 113, 108);
    doc.text(param.label, colX, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    const splitVal = doc.splitTextToSize(param.val, colWidth - 14);
    doc.text(splitVal[0] || param.val, colX, y + 34);
    if (splitVal.length > 1) {
      doc.setFontSize(8);
      doc.text(splitVal[1], colX, y + 44);
    }
  });
  y += summaryBoxHeight + 22;

  // Helper function for rendering clean section headers
  const renderSectionHeader = (title: string, r: number, g: number, b: number) => {
    checkPageBreak(36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(r, g, b);
    doc.text(title.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(231, 223, 213);
    doc.line(margin, y, margin + contentWidth, y);
    y += 14;
  };

  // Section 1: Confirmed Requirements & Preferences
  renderSectionHeader('Confirmed Requirements & Preferences', 194, 65, 12);
  brief.confirmedPreferences.forEach((pref) => {
    checkPageBreak(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(28, 25, 23);
    const bulletPrefix = `•   ${pref.label}: `;
    doc.text(bulletPrefix, margin + 4, y);

    const prefixWidth = doc.getTextWidth(bulletPrefix);
    doc.setFont('helvetica', 'normal');
    const valueLines = doc.splitTextToSize(pref.value, contentWidth - prefixWidth - 8);

    if (valueLines.length === 1) {
      doc.text(valueLines[0], margin + 4 + prefixWidth, y);
      y += 14;
    } else {
      doc.text(valueLines[0], margin + 4 + prefixWidth, y);
      y += 13;
      for (let i = 1; i < valueLines.length; i++) {
        checkPageBreak(16);
        doc.text(valueLines[i], margin + 18, y);
        y += 13;
      }
      y += 2;
    }
  });
  y += 10;

  // Section 2: Essential Non-Negotiables
  if (brief.confirmedNonNegotiables.length > 0) {
    renderSectionHeader('Essential Non-Negotiables', 194, 65, 12);
    brief.confirmedNonNegotiables.forEach((item) => {
      checkPageBreak(22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(28, 25, 23);
      const lines = doc.splitTextToSize(`•   ${item}`, contentWidth - 10);
      lines.forEach((l: string, idx: number) => {
        if (idx > 0) checkPageBreak(15);
        doc.text(l, margin + (idx === 0 ? 4 : 16), y);
        y += 13;
      });
    });
    y += 10;
  }

  // Section 3: Milestones & Timing
  if (brief.timingConstraints.length > 0) {
    renderSectionHeader('Key Milestones & Timing', 217, 119, 6);
    brief.timingConstraints.forEach((t) => {
      checkPageBreak(22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(28, 25, 23);
      doc.text(`•   ${t.milestone}`, margin + 4, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 113, 108);
      const dueStr = `Due by ${t.dueDate}`;
      const dueWidth = doc.getTextWidth(dueStr);
      doc.text(dueStr, margin + contentWidth - dueWidth, y);
      y += 14;
    });
    y += 10;
  }

  // Section 4: Information Requested
  renderSectionHeader('Information Requested in Your Proposal', 5, 150, 105);
  const requestedItems = [
    'Scope of work and complete list of deliverables.',
    'Fully itemized pricing, specifying base charges and any applicable taxes/fees.',
    'Advance deposit requirements and payment milestone schedule.',
    'Quotation validity period.',
    'Standard cancellation and postponement provisions.',
  ];
  requestedItems.forEach((req, idx) => {
    checkPageBreak(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    const lines = doc.splitTextToSize(`${idx + 1}.   ${req}`, contentWidth - 10);
    lines.forEach((l: string, lineIdx: number) => {
      if (lineIdx > 0) checkPageBreak(15);
      doc.text(l, margin + (lineIdx === 0 ? 4 : 18), y);
      y += 13;
    });
  });
  y += 16;

  // Privacy Shield Footnote Box
  checkPageBreak(45);
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(231, 223, 213);
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  const footnote = 'Note: Identifiable attendee names, personal contact numbers, and private family arrangements are reserved for contracted booking stages.';
  const fnLines = doc.splitTextToSize(footnote, contentWidth - 20);
  doc.text(fnLines, margin + 10, y + 14);
  y += 46;

  // Page Numbers & Footer Line on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(168, 162, 158); // #A8A29E
    doc.setDrawColor(231, 223, 213);
    doc.line(margin, pageHeight - 28, margin + contentWidth, pageHeight - 28);
    doc.text('EventPilot · Privacy-Safe Vendor Procurement Brief', margin, pageHeight - 16);
    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, margin + contentWidth - doc.getTextWidth(pageStr), pageHeight - 16);
  }

  const safeFilename = `Requirement-Brief-${brief.category}-${brief.eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
}
