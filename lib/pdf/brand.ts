// Shared PDF branding for Professional Business Services documents.
// Matches Waqas Bhai's live invoice template: orange/black system, circular
// handshake logo, gray company-info box, solid-color section bars, black
// table headers with peach-striped rows, black GRAND TOTAL + advance-due
// bars, signature boxes, and a bank-details page. Used by Quotation, ICV
// Quotation, and Invoice.

import type { jsPDF } from "jspdf";

// ── Brand colors ────────────────────────────────────────────────────
export const ORANGE: [number, number, number] = [230, 126, 34]; // #E67E22
export const ORANGE_DARK: [number, number, number] = [196, 104, 22]; // #C46816
export const BLACK: [number, number, number] = [20, 20, 20]; // #141414 bars
export const TEXT_BLACK: [number, number, number] = [0, 0, 0];
export const WHITE: [number, number, number] = [255, 255, 255];
export const GRAY_BOX: [number, number, number] = [240, 240, 240]; // #F0F0F0
export const GRAY_TEXT: [number, number, number] = [110, 110, 110]; // #6E6E6E
export const PEACH_ROW: [number, number, number] = [253, 240, 227]; // #FDF0E3
export const GREEN: [number, number, number] = [46, 125, 50]; // #2E7D32 discount/credit rows
export const BORDER_GRAY: [number, number, number] = [220, 220, 220];

// ── Page geometry (A4) ──────────────────────────────────────────────
export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN_L = 15;
export const MARGIN_R = 195;
export const CONTENT_W = MARGIN_R - MARGIN_L; // 180

const FONT = "helvetica";

export const FS = {
  companyName: 17,
  tagline: 7.3,
  title: 22,
  refRow: 9,
  section: 10.5,
  body: 9.5,
  dense: 8.3,
  small: 7.5,
  grandTotal: 13,
  closing: 12,
} as const;

// ── Fixed company facts (printed on every document) ─────────────────
export const COMPANY = {
  name: "Professional Business Services",
  tagline: "PRO Services  |  Company Formation  |  Visa Processing  |  Document Attestation",
  phone1: "+971 568 185 548",
  phone2: "02 671 1243",
  website: "professionalbusines.com",
  address: "Abu Dhabi, UAE",
  trn: "100220522500003",
  signatoryName: "M. Waqas, CEO",
};

export const BANK = {
  accountName: "PROFESSIONAL BUSINESS S SOP LLC",
  bankName: "Abu Dhabi Commercial Bank PJSC",
  accountNo: "10485462291001",
  iban: "AE27 0030 0104 8546 2291 001",
  swift: "ADCBAEAA",
  branch: "IBD - Al Nahyan Camp",
  currency: "AED",
};

// ── Money: "AED #,###.00" everywhere ──────────────────────────────
export function money(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return `AED ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function refNumber(dateISO?: string, prefix = "QUO"): string {
  const d = dateISO ? new Date(dateISO) : new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${mm}-${d.getFullYear()}`;
}

export function formatDate(dateISO?: string): string {
  const d = dateISO ? new Date(dateISO) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }); // "23 July 2026"
}

// ── Logo: PRO brand logo from public/pro-logo.png ──────────────────
import { readFileSync } from "fs";
import { join } from "path";

let _logoBase64: string | null = null;
function getLogoBase64(): string {
  if (_logoBase64) return _logoBase64;
  try {
    const buf = readFileSync(join(process.cwd(), "public", "pro-logo.png"));
    _logoBase64 = buf.toString("base64");
  } catch {
    _logoBase64 = "";
  }
  return _logoBase64;
}

function drawLogo(doc: jsPDF, x: number, y: number, w: number) {
  const b64 = getLogoBase64();
  if (!b64) return;
  doc.addImage(b64, "PNG", x, y, w, w);
}

// ── Pagination helpers ────────────────────────────────────────────
export const CONTENT_BOTTOM = 278; // stop above the footer rule at 284

// Minimal repeated header on continuation pages. Returns the y to resume at.
function continuationHeader(doc: jsPDF): number {
  drawTopStrip(doc);
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.section);
  doc.setTextColor(...TEXT_BLACK);
  doc.text(COMPANY.name, MARGIN_L, 12);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_L, 16, MARGIN_R, 16);
  return 26;
}

// Starts a new page (with continuation header) when the next block would overflow.
export function pageBreak(doc: jsPDF, y: number, needed = 0): number {
  if (y + needed > CONTENT_BOTTOM) {
    doc.addPage();
    return continuationHeader(doc);
  }
  return y;
}

// ── Top strip: thin orange bar across the very top edge of every page ──
export function drawTopStrip(doc: jsPDF) {
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, PAGE_W, 3, "F");
}

// ── Full header: logo + company + tagline + right info box + centered
// title with orange underline. Returns the y to start content at. ──────
export function drawHeader(doc: jsPDF, title: string): number {
  drawTopStrip(doc);
  drawLogo(doc, MARGIN_L, 9, 17);

  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.companyName);
  doc.setTextColor(...TEXT_BLACK);
  doc.text(COMPANY.name, MARGIN_L + 21, 16);

  doc.setFont(FONT, "normal");
  doc.setFontSize(FS.tagline);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(COMPANY.tagline, MARGIN_L + 21, 21.5);

  // Right info box: phones, website, address, TRN.
  const boxW = 58, boxX = MARGIN_R - boxW, boxY = 7, boxH = 25;
  doc.setFillColor(...GRAY_BOX);
  doc.rect(boxX, boxY, boxW, boxH, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_BLACK);
  doc.text(COMPANY.phone1, MARGIN_R - 2.5, boxY + 5.2, { align: "right" });
  doc.setFont(FONT, "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(COMPANY.phone2, MARGIN_R - 2.5, boxY + 9.8, { align: "right" });
  doc.setFont(FONT, "normal");
  doc.text(COMPANY.website, MARGIN_R - 2.5, boxY + 13.8, { align: "right" });
  doc.text(COMPANY.address, MARGIN_R - 2.5, boxY + 17.8, { align: "right" });
  doc.setFont(FONT, "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...ORANGE_DARK);
  doc.text(`TRN: ${COMPANY.trn}`, MARGIN_R - 2.5, boxY + 22.2, { align: "right" });

  // Centered document title + orange underline.
  let y = 42;
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.title);
  doc.setTextColor(...TEXT_BLACK);
  doc.text(title.toUpperCase(), PAGE_W / 2, y, { align: "center" });
  y += 3.5;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1);
  doc.line(MARGIN_L, y, MARGIN_R, y);
  return y + 8;
}

// ── Reference/date rows: label:value pairs, left + right aligned ───
export function refDateRows(doc: jsPDF, y: number, rows: [string, string, string, string][]): number {
  rows.forEach(([l1, v1, l2, v2]) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(FS.refRow);
    doc.setTextColor(...TEXT_BLACK);
    doc.text(`${l1}: ${v1}`, MARGIN_L, y);
    doc.text(`${l2}: ${v2}`, MARGIN_R, y, { align: "right" });
    y += 5.6;
  });
  return y + 3;
}

// ── Solid orange section bar (BILL TO / INVOICE BREAKDOWN / etc.) ──
export function sectionBar(doc: jsPDF, title: string, y: number, h = 7): number {
  y = pageBreak(doc, y, h + 12);
  doc.setFillColor(...ORANGE);
  doc.rect(MARGIN_L, y, CONTENT_W, h, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.section);
  doc.setTextColor(...WHITE);
  doc.text(title.toUpperCase(), MARGIN_L + 3, y + h / 2 + 1.6);
  return y + h + 5;
}

// ── "Label : value" two-column field row. Returns y after (grows for wraps). ──
export function fieldRow(doc: jsPDF, y: number, l1: string, v1: string, l2: string, v2: string): number {
  const LEFT_LABEL_X = MARGIN_L, LEFT_VAL_X = MARGIN_L + 24, LEFT_W = 76;
  const RIGHT_LABEL_X = 100, RIGHT_VAL_X = 124, RIGHT_W = 68;
  doc.setFont(FONT, "bold"); doc.setFontSize(FS.body); doc.setTextColor(...TEXT_BLACK);
  doc.text(`${l1} :`, LEFT_LABEL_X, y);
  if (l2) doc.text(`${l2} :`, RIGHT_LABEL_X, y);
  doc.setFont(FONT, "normal");
  const vLines1 = doc.splitTextToSize(v1 || "-", LEFT_W) as string[];
  doc.text(vLines1, LEFT_VAL_X, y);
  let n = vLines1.length;
  if (l2) {
    const vLines2 = doc.splitTextToSize(v2 || "-", RIGHT_W) as string[];
    doc.text(vLines2, RIGHT_VAL_X, y);
    n = Math.max(n, vLines2.length);
  }
  return y + (n - 1) * 5 + 6.5;
}

// Full-width "Label : value" field (for long single values like Subject).
export function fieldFull(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFont(FONT, "bold"); doc.setFontSize(FS.body); doc.setTextColor(...TEXT_BLACK);
  doc.text(`${label} :`, MARGIN_L, y);
  doc.setFont(FONT, "normal");
  const lines = doc.splitTextToSize(value || "-", CONTENT_W - 30) as string[];
  doc.text(lines, MARGIN_L + 24, y);
  return y + (lines.length - 1) * 5 + 6.5;
}

// ── GRAND TOTAL hero bar (black, full width) ────────────────────────
export function grandTotalBar(doc: jsPDF, y: number, total: number, h = 10): number {
  y = pageBreak(doc, y, h);
  doc.setFillColor(...BLACK);
  doc.rect(MARGIN_L, y, CONTENT_W, h, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.grandTotal);
  doc.setTextColor(...WHITE);
  doc.text("GRAND TOTAL", MARGIN_L + 4, y + h / 2 + 2.2);
  doc.text(money(total), MARGIN_R - 4, y + h / 2 + 2.2, { align: "right" });
  return y + h;
}

// ── 50% advance / balance bar (black, invoices only) ────────────────
export function advanceDueBar(doc: jsPDF, y: number, total: number, h = 8): number {
  const half = total / 2;
  y = pageBreak(doc, y, h);
  doc.setFillColor(...BLACK);
  doc.rect(MARGIN_L, y, CONTENT_W, h, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.small + 0.6);
  doc.setTextColor(...WHITE);
  doc.text(`50% ADVANCE DUE: ${money(half)}   |   Balance on Completion: ${money(half)}`, PAGE_W / 2, y + h / 2 + 1.6, { align: "center" });
  return y + h;
}

// ── Signature boxes (invoices only): company + received-by ─────────
export function signatureBoxes(doc: jsPDF, y: number, receivedByName: string, receivedByCompany: string, h = 28): number {
  y = pageBreak(doc, y, h + 4);
  const boxW = (CONTENT_W - 6) / 2;
  const x1 = MARGIN_L, x2 = MARGIN_L + boxW + 6;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.rect(x1, y, boxW, h, "S");
  doc.rect(x2, y, boxW, h, "S");
  doc.setFont(FONT, "bold"); doc.setFontSize(FS.body); doc.setTextColor(...TEXT_BLACK);
  doc.text("For Professional Business Services", x1 + 4, y + 7);
  doc.text("Received By", x2 + 4, y + 7);
  doc.setFont(FONT, "normal"); doc.setFontSize(FS.small); doc.setTextColor(...GRAY_TEXT);
  doc.text(COMPANY.signatoryName, x1 + 4, y + 20);
  doc.setFont(FONT, "italic");
  doc.text("Authorized Signatory & Stamp", x1 + 4, y + 25);
  doc.setFont(FONT, "normal");
  doc.text(receivedByName || "-", x2 + 4, y + 20);
  if (receivedByCompany) doc.text(receivedByCompany, x2 + 4, y + 25);
  return y + h;
}

// ── Bank details page (invoices only) ───────────────────────────────
export function bankDetailsPage(doc: jsPDF, refLabel: string, dateStr: string, clientName: string) {
  doc.addPage();
  drawTopStrip(doc);
  doc.setFont(FONT, "bold"); doc.setFontSize(FS.section); doc.setTextColor(...TEXT_BLACK);
  doc.text(COMPANY.name, MARGIN_L, 12);
  doc.setFont(FONT, "normal"); doc.setFontSize(FS.small); doc.setTextColor(...GRAY_TEXT);
  doc.text(`${refLabel}  |  ${dateStr}  |  ${clientName}`, MARGIN_R, 12, { align: "right" });
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.4);
  doc.line(MARGIN_L, 16, MARGIN_R, 16);

  let y = 30;
  const rows: [string, string][] = [
    ["Account Name", BANK.accountName],
    ["Bank", BANK.bankName],
    ["Account No", BANK.accountNo],
    ["IBAN", BANK.iban],
    ["SWIFT", BANK.swift],
    ["Branch", BANK.branch],
    ["Currency", BANK.currency],
  ];
  const boxH = rows.length * 7 + 8;
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.5);
  doc.setFillColor(...GRAY_BOX);
  doc.rect(MARGIN_L, y, CONTENT_W, boxH, "FD");
  y += 9;
  rows.forEach(([l, v]) => {
    doc.setFont(FONT, "bold"); doc.setFontSize(FS.body); doc.setTextColor(...TEXT_BLACK);
    doc.text(l, MARGIN_L + 5, y);
    doc.setFont(FONT, "normal");
    doc.text(v, MARGIN_L + 55, y);
    y += 7;
  });
}

// ── Footer (every page): company + confidential ─────────────────────
export function drawFooter(doc: jsPDF) {
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, 284, MARGIN_R, 284);
  doc.setFont(FONT, "italic");
  doc.setFontSize(FS.small);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(`${COMPANY.name} | Est. Abu Dhabi, UAE`, MARGIN_L, 289);
  doc.setFont(FONT, "normal");
  doc.text("Confidential", MARGIN_R, 289, { align: "right" });
}

export function paginateFooters(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc);
  }
}

// ── Terms & closing shared blocks ─────────────────────────────────
export const GENERAL_TERMS: string[] = [
  "5% VAT will be shown in the invoice receipt as per UAE FTA regulations.",
  "50% of the total amount is to be paid in advance before commencement of work.",
  "Government fees are subject to change as per the respective authority's tariff.",
  "This quotation is valid for 15 days from the date of issue.",
];

export function invoicePaymentTerms(advance: number): string[] {
  return [
    `50% advance payment (${money(advance)}) to begin processing.`,
    "Remaining 50% upon completion of all services.",
    "5% VAT applicable on service charges.",
    "All payments via bank transfer only.",
    "Computer-generated invoice - no physical signature required.",
  ];
}

export const LIST_LINE_H = 5.5;
export const LIST_GAP = 2.0;

export function listBlock(doc: jsPDF, items: string[], y: number, numbered = false): number {
  items.forEach((item, i) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(FS.body);
    doc.setTextColor(...TEXT_BLACK);
    const marker = numbered ? `${i + 1}.` : "•";
    const lines = doc.splitTextToSize(item, CONTENT_W - 10) as string[];
    y = pageBreak(doc, y, lines.length * LIST_LINE_H);
    doc.text(marker, MARGIN_L + 1, y);
    doc.text(lines, MARGIN_L + 8, y);
    y += lines.length * LIST_LINE_H + LIST_GAP;
  });
  return y;
}

export { FONT };
