// ================================================================
// PDF Generation – jsPDF branded reports (single-page A4 layout)
// ================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CENTRES, formatDate } from './utils.js';

// ── Brand Palette ───────────────────────────────────────────────
const BRAND = {
  navy:      [15,  23,  42],
  teal:      [20,  184, 166],
  light:     [241, 245, 249],
  muted:     [100, 116, 139],
  white:     [255, 255, 255],
  text:      [30,  41,  59],
  border:    [226, 232, 240],
  lightBlue: [224, 242, 254],
};

// ── Page dimensions (A4 mm) ──────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 10; // left/right margin

// ── Helper: draw thin page border ───────────────────────────────
function addPageBorder(doc) {
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, PAGE_H - MARGIN * 2);
}

// ── Section 0: Compact header (≤ 28 mm tall) ────────────────────
// Returns y position immediately after the teal accent strip.
function addHeader(doc, centre, logoDataUrl) {
  const HEADER_H = 26; // navy bar height
  const STRIP_H  = 3;  // teal accent strip height

  // Navy bar
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

  // Teal accent strip
  doc.setFillColor(...BRAND.teal);
  doc.rect(0, HEADER_H, PAGE_W, STRIP_H, 'F');

  // Logo (fits within the 26 mm bar with 2 mm padding top/bottom)
  const LOGO_SIZE = 22;
  const LOGO_X    = 12;
  const LOGO_Y    = 2;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
    } catch (_) {}
  }

  const textX = logoDataUrl ? LOGO_X + LOGO_SIZE + 4 : 14;

  // Centre name
  doc.setTextColor(...BRAND.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(centre.name, textX, 10);

  // Contact details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 200, 220);
  doc.text(`${centre.email}  |  ${centre.phone}  |  ${centre.website}`, textX, 16);

  // Report title — right-aligned inside the navy bar to save vertical space
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.teal);
  doc.text('Student Assessment Report', PAGE_W - 12, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 200, 220);
  doc.text(`${centre.name}  –  Confidential`, PAGE_W - 12, 16, { align: 'right' });

  return HEADER_H + STRIP_H; // ≈ 29 mm
}

// ── Section 1: Two-column info/summary grid ──────────────────────
// Uses a 4-column autoTable: [Label | Value | Label | Value]
// Returns y after the table.
function addInfoGrid(doc, report, student, tutor, y) {
  const score = report.assessmentScore != null
    ? `${report.assessmentScore}%`
    : '—';

  const statusText = (report.status || '—').toUpperCase();

  const rows = [
    ['Student Name',         student?.studentName       || '—',   'Assessment Date',      formatDate(report.assessmentDate)],
    ['Parent / Guardian',    student?.parentName        || '—',   'Subject',              report.subject            || '—'],
    ['Year Group',           student?.yearGroup         || '—',   'Assessment Type',      report.assessmentType     || '—'],
    ['School',               student?.school            || '—',   'Tutor',                tutor?.name               || '—'],
    ['Working Level',        report.workingLevel        || '—',   'Score',                score],
    ['Homework Completion',  report.homeworkCompletion  || '—',   'Attendance',           report.attendance         || '—'],
    ['Behaviour & Engagement', report.behaviourEngagement || '—', 'Status',               statusText],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [],
    body: rows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: BRAND.text,
      lineColor: BRAND.border,
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: BRAND.light, cellWidth: 42, textColor: BRAND.muted },
      1: { fillColor: BRAND.white, cellWidth: 'auto' },
      2: { fontStyle: 'bold', fillColor: BRAND.light, cellWidth: 42, textColor: BRAND.muted },
      3: { fillColor: BRAND.white, cellWidth: 'auto' },
    },
    alternateRowStyles: {},
    tableLineColor: BRAND.border,
    tableLineWidth: 0.25,
  });

  return doc.lastAutoTable.finalY + 4;
}

// ── Section 2: Consolidated feedback table ───────────────────────
// Returns y after the table.
function addFeedbackTable(doc, report, y) {
  // Build rows — only include non-empty fields
  const feedbackRows = [];

  const push = (label, text, isManagerComment = false) => {
    if (text && text.trim()) {
      feedbackRows.push({ label, text, isManagerComment });
    }
  };

  push('Strengths',              report.strengths);
  push('Areas for Improvement',  report.areasForImprovement);
  push('Topics Covered',         report.topicsCovered);
  push('Recommendations',        report.recommendations);
  // Note: managerComments and additionalComments rendered in dedicated boxes below

  if (feedbackRows.length === 0) return y;

  // Section divider label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.muted);
  doc.text('DETAILED FEEDBACK', MARGIN + 1, y + 3);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Section', 'Content']],
    body: feedbackRows.map(r => [r.label, r.text]),
    headStyles: {
      fillColor: BRAND.navy,
      textColor: BRAND.white,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3.5,
      textColor: BRAND.text,
      lineColor: BRAND.border,
      lineWidth: 0.25,
      valign: 'top',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: BRAND.light, cellWidth: 44, textColor: BRAND.muted },
      1: { fillColor: BRAND.white },
    },
    alternateRowStyles: {},
    tableLineColor: BRAND.border,
    tableLineWidth: 0.25,
    // Apply light-blue tint to manager comments row
    didParseCell(data) {
      if (data.section === 'body') {
        const row = feedbackRows[data.row.index];
        if (row && row.isManagerComment) {
          data.cell.styles.fillColor = BRAND.lightBlue;
        }
      }
    },
  });

  return doc.lastAutoTable.finalY + 4;
}

// ── Section 3: Compact authorisation block ───────────────────────
// A simple row + two signature lines. Returns final y.
function addAuthorisationBlock(doc, report, tutor, approver, y) {
  const approvedDate = report.approvedAt ? formatDate(report.approvedAt) : '—';

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [],
    body: [[
      `Prepared by: ${tutor?.name || '—'}`,
      `Approved by: ${approver?.name || '—'}`,
      `Date: ${approvedDate}`,
    ]],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: BRAND.muted,
      lineColor: BRAND.border,
      lineWidth: 0.25,
      fillColor: BRAND.light,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
    },
    tableLineColor: BRAND.border,
    tableLineWidth: 0.25,
  });

  y = doc.lastAutoTable.finalY + 4;
  return y;
}

// ── Tutor Comments + Centre Manager's Comments boxes ────────────
// Stacked vertically: Tutor = top 2/3, Manager = bottom 1/3.
function addAdditionalCommentsBox(doc, tutorText, managerText, topY, bottomY) {
  const boxX    = MARGIN;
  const boxW    = PAGE_W - MARGIN * 2;
  const totalH  = bottomY - topY - 2;
  const gap     = 5; // gap between the two boxes
  const labelH  = 7; // height reserved for the label above each box

  if (totalH < 20) return;

  // Split: tutor gets 2/3 of total height, manager gets 1/3
  const tutorBlockH   = Math.round(totalH * 2 / 3);
  const managerBlockH = totalH - tutorBlockH - gap;

  // ── Helper: draw one labelled box ──────────────────────────────
  function drawBox(label, text, startY, totalBlockH) {
    const innerY = startY + labelH;
    const innerH = totalBlockH - labelH;
    if (innerH < 4) return;

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.muted);
    doc.text(label, boxX + 1, startY + 4);

    // Border + fill
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.3);
    doc.setFillColor(...BRAND.white);
    doc.rect(boxX, innerY, boxW, innerH, 'FD');

    if (text && text.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...BRAND.text);
      const lines = doc.splitTextToSize(text.trim(), boxW - 8);
      doc.text(lines, boxX + 4, innerY + 5.5);
    } else {
      // Faint ruled lines for handwriting
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.2);
      const lineSpacing = 8;
      for (let ly = innerY + lineSpacing; ly < innerY + innerH - 4; ly += lineSpacing) {
        doc.line(boxX + 3, ly, boxX + boxW - 3, ly);
      }
    }
  }

  drawBox('TUTOR COMMENTS',            tutorText,   topY,                           tutorBlockH);
  drawBox("CENTRE MANAGER'S COMMENTS", managerText, topY + tutorBlockH + gap,       managerBlockH);
}

// ── Page footer (navy bar at very bottom) ───────────────────────
function addFooter(doc, centreName, reportId, pageNum, totalPages) {
  const FOOTER_H = 12;
  const footerY  = PAGE_H - FOOTER_H;

  doc.setFillColor(...BRAND.navy);
  doc.rect(0, footerY, PAGE_W, FOOTER_H, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 200, 220);

  doc.text(centreName, MARGIN, footerY + 7.5);
  doc.text('Confidential – Parent/Guardian use only', PAGE_W / 2, footerY + 7.5, { align: 'center' });
  doc.text(
    `Report ID: ${reportId}  |  Page ${pageNum} of ${totalPages}`,
    PAGE_W - MARGIN, footerY + 7.5, { align: 'right' }
  );
}

// ================================================================
// Main export
// ================================================================
export async function generateReportPDF(report, student, tutor, approver) {
  const centre = CENTRES[report.centreId || 'sydenham'];
  const doc    = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── Load logo ──────────────────────────────────────────────────
  let logoDataUrl = null;
  try {
    const resp = await fetch('/logo.png');
    const blob = await resp.blob();
    logoDataUrl = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(blob);
    });
  } catch (_) {}

  // ── Draw page border ───────────────────────────────────────────
  // Border is drawn on all pages in the final footer loop.

  // ── Header  (y ≈ 0–29 mm) ────────────────────────────────────
  let y = addHeader(doc, centre, logoDataUrl);
  y += 4; // small breathing gap

  // ── Info grid  (y ≈ 33–85 mm, 7 rows × ~7.5 mm each) ─────────
  y = addInfoGrid(doc, report, student, tutor, y);

  // ── Feedback table  (y ≈ 89–210 mm, varies by content) ────────
  y = addFeedbackTable(doc, report, y);

  // ── Authorisation block ────────────────────────────────────────
  const FOOTER_RESERVED   = 14; // footer bar
  const AUTH_H            = 14; // single-row auth table
  const COMMENTS_MIN_H    = 30; // min height for comments box
  const FOOTER_Y          = PAGE_H - FOOTER_RESERVED;

  // If there is not enough room on the current page for the auth block and comments box,
  // push them to a new page.
  if (y > FOOTER_Y - AUTH_H - COMMENTS_MIN_H - 2) {
    doc.addPage();
    y = MARGIN + 10; // Start at the top of the new page
  }

  addAuthorisationBlock(doc, report, tutor, approver, y);
  const afterAuth = doc.lastAutoTable.finalY + 4;

  // ── Additional Comments box (fills white space) ────────────────
  addAdditionalCommentsBox(doc, report.additionalComments, report.managerComments, afterAuth, FOOTER_Y - 2);

  // ── Footer and Border on all pages ──────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageBorder(doc);
    addFooter(doc, centre.name, report.id || 'DRAFT', i, totalPages);
  }

  return doc;
}

export function downloadPDF(doc, filename) {
  doc.save(filename);
}

export function getPDFBase64(doc) {
  return doc.output('datauristring');
}

export function getPDFBlob(doc) {
  return doc.output('blob');
}
