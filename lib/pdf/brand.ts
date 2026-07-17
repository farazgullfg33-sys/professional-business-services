// Shared PDF branding for Professional Business Services documents.
// Matches Waqas Bhai's document pattern (see PRO_Document_Design_Specs.md):
// navy wordmark + orange logo, gray document title, #DCE6F1 table headers,
// mandatory #FFFF00 total highlight, Arial (Helvetica metric-equivalent),
// A4, standardized footer. Used by Quotation, ICV Quotation, and Invoice.

import type { jsPDF } from "jspdf";

// ── Brand colors (RGB) ────────────────────────────────────────────
export const NAVY: [number, number, number] = [31, 56, 100]; // #1F3864
export const NAVY_MID: [number, number, number] = [46, 83, 149]; // #2E5395 borders
export const GRAY_TITLE: [number, number, number] = [128, 128, 128]; // #808080
export const ORANGE: [number, number, number] = [245, 166, 35]; // #F5A623
export const HEADER_BG: [number, number, number] = [220, 230, 241]; // #DCE6F1
export const YELLOW: [number, number, number] = [255, 255, 0]; // #FFFF00
export const FOOTER_GRAY: [number, number, number] = [89, 89, 89]; // #595959
export const BLACK: [number, number, number] = [0, 0, 0];
export const WHITE: [number, number, number] = [255, 255, 255];

// ── Page geometry (A4, margins L/R 0.6in, T/B 0.5in) ──────────────
export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN_L = 15; // ~0.6in
export const MARGIN_R = 195; // 210 - 15
export const CONTENT_W = MARGIN_R - MARGIN_L; // 180

const FONT = "helvetica"; // jsPDF's Arial-equivalent core font

// ── Money: "AED #,###.00" everywhere ──────────────────────────────
export function money(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return `AED ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Reference number: QUO-MM-YYYY ─────────────────────────────────
export function refNumber(dateISO?: string, prefix = "QUO"): string {
  const d = dateISO ? new Date(dateISO) : new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${mm}-${d.getFullYear()}`;
}

export function formatDate(dateISO?: string): string {
  const d = dateISO ? new Date(dateISO) : new Date();
  return d.toLocaleDateString("en-GB"); // dd/mm/yyyy — matches reference
}

// ── Logo: orange circle + white handshake abstraction ─────────────
function drawLogo(doc: jsPDF, cx: number, cy: number, r: number) {
  doc.setFillColor(...ORANGE);
  doc.circle(cx, cy, r, "F");
  doc.setDrawColor(...WHITE);
  doc.setLineWidth(0.8);
  doc.circle(cx, cy, r - 1.6, "S");
  // Two white arrows meeting in the center — a clean "handshake / deal" mark.
  doc.setFillColor(...WHITE);
  doc.triangle(cx - 6.5, cy, cx - 1, cy - 3.6, cx - 1, cy + 3.6, "F");
  doc.triangle(cx + 6.5, cy, cx + 1, cy - 3.6, cx + 1, cy + 3.6, "F");
  doc.setFillColor(...WHITE);
  doc.rect(cx - 1.4, cy - 1.4, 2.8, 2.8, "F");
}

// ── Header (every document): logo + navy wordmark + gray title ────
export function drawHeader(doc: jsPDF, title: string) {
  drawLogo(doc, 24, 20, 11);

  doc.setFont(FONT, "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(15);
  doc.text("PROFESSIONAL BUSINESS", 40, 16);
  doc.text("SERVICES", 40, 23.5);

  doc.setFont(FONT, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_TITLE);
  doc.text("Company Setup  •  Visa Processing  •  Government Liaison", 40.3, 28.5);

  // Document title, top-right, large, all caps, gray.
  doc.setFont(FONT, "bold");
  doc.setFontSize(30);
  doc.setTextColor(...GRAY_TITLE);
  doc.text(title.toUpperCase(), MARGIN_R, 22, { align: "right" });

  // Navy rule under header.
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_L, 33, MARGIN_R, 33);
}

// ── Footer (every document): page label + address ─────────────────
export function drawFooter(doc: jsPDF, pageLabel: string) {
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_L, 285, MARGIN_R, 285);

  doc.setFont(FONT, "italic");
  doc.setFontSize(8);
  doc.setTextColor(...FOOTER_GRAY);
  doc.text(pageLabel, MARGIN_L, 290);

  doc.setFont(FONT, "normal");
  doc.setTextColor(...FOOTER_GRAY);
  doc.text(
    "Electra Street Abu Dhabi  •  P.O.Box 128287  •  Tel: 02-671-1243",
    MARGIN_R,
    290,
    { align: "right" }
  );
}

// ── Terms & closing shared blocks ─────────────────────────────────
export const GENERAL_TERMS: string[] = [
  "5% VAT will be shown in the invoice receipt as per UAE FTA regulations.",
  "50% of the total amount is to be paid in advance before commencement of work.",
  "Government fees are subject to change as per the respective authority's tariff.",
  "This quotation is valid for 15 days from the date of issue.",
];

// Draws a bold, underlined section title. Returns the new y.
export function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(title, MARGIN_L, y);
  const w = doc.getTextWidth(title);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y + 1.2, MARGIN_L + w, y + 1.2);
  return y + 6;
}

// Draws bulleted/numbered lines. Returns the new y.
export function listBlock(doc: jsPDF, items: string[], y: number, numbered = false): number {
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  items.forEach((item, i) => {
    const marker = numbered ? `${i + 1}.` : "•";
    const lines = doc.splitTextToSize(item, CONTENT_W - 8) as string[];
    doc.text(marker, MARGIN_L + 1, y);
    doc.text(lines, MARGIN_L + 7, y);
    y += lines.length * 4.6 + 1.4;
  });
  return y;
}

export { FONT };
