import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeItems, sumAmount, sumPaid, type LineItem, type DocMeta } from "@/lib/documents";
import {
  NAVY, NAVY_MID, YELLOW, BLACK, WHITE, GRAY_TITLE,
  MARGIN_L, MARGIN_R, refNumber, formatDate,
  drawHeader, sectionTitle, listBlock, GENERAL_TERMS, FONT, FS,
  pageBreak, paginateFooters,
} from "@/lib/pdf/brand";

// Compact amount (no "AED " prefix) for the narrow 6-column invoice cells.
const amt = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = createAdminClient();
  // No direct Client join (Invoice.clientId FK may be uncached) — client details
  // come from the meta snapshot, with the Quote→Client join as a legacy fallback.
  const { data: invoice, error } = await db
    .from("Invoice")
    .select("*, Quote(*, Client(*))")
    .eq("id", id)
    .single();
  if (error || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const meta = (invoice.meta ?? {}) as DocMeta;
  const q = invoice.Quote ?? {};
  const client = q.Client ?? {};

  // Prefer stored line items; fall back for legacy invoices.
  let items: LineItem[] = normalizeItems(invoice.lineItems);
  if (items.length === 0) {
    const paid = invoice.status === "paid" ? (invoice.amount || 0) : 0;
    items = [{
      description: q.services || meta.purpose || "PRO Services",
      refNum: meta.referenceNo || "",
      quantity: 1, unitPrice: invoice.amount || 0, amount: q.total || invoice.amount || 0,
      amtPaid: paid, expense: q.govFees || 0,
    }];
  }

  const totalQuote = sumAmount(items);
  const totalPaid = sumPaid(items);
  const totalExpense = items.reduce((s, i) => s + (Number(i.expense) || 0), 0);
  const totalBalance = totalQuote - totalPaid;

  const clientName = meta.clientName || client.name || "-";
  const company = meta.company || client.company || "-";
  const address = meta.address || client.address || "Abu Dhabi, UAE";
  const contact = meta.contact || client.phone || "-";
  const purpose = meta.purpose || (q.services ? String(q.services).split(",")[0].trim() : "PRO Services");
  const reference = meta.referenceNo || refNumber(invoice.createdAt);

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawHeader(doc, "TAX INVOICE");

  // ── BILL TO (navy bar) + mini date table ────────────────────────
  let y = 40;
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN_L, y, 95, 7, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text("BILL TO", MARGIN_L + 3, y + 5);

  const mx = 130, mLabelW = 30, mW = MARGIN_R - mx, mRowH = 7;
  const miniRows: [string, string][] = [
    ["DATE", formatDate(invoice.createdAt)],
    ["INVOICE #", reference],
    ["CUSTOMER ID", meta.customerId || "-"],
  ];
  doc.setDrawColor(...NAVY_MID);
  doc.setLineWidth(0.4);
  miniRows.forEach((r, i) => {
    const ry = y + i * mRowH;
    doc.rect(mx, ry, mW, mRowH, "S");
    doc.line(mx + mLabelW, ry, mx + mLabelW, ry + mRowH);
    doc.setFont(FONT, "bold"); doc.setFontSize(FS.dense); doc.setTextColor(...NAVY);
    doc.text(r[0], mx + 2, ry + 4.7);
    doc.setFont(FONT, "normal"); doc.setTextColor(...BLACK);
    doc.text(r[1], mx + mLabelW + 2, ry + 4.7);
  });

  y += 12;
  // Values are clipped to the label gutter so a long address can't run under
  // the mini date table on the right.
  const field = (label: string, value: string) => {
    doc.setFont(FONT, "bold"); doc.setFontSize(FS.body); doc.setTextColor(...BLACK);
    doc.text(label, MARGIN_L, y);
    doc.setFont(FONT, "normal");
    const lines = doc.splitTextToSize(value || "-", 110 - 26) as string[];
    doc.text(lines, MARGIN_L + 26, y);
    y += (lines.length - 1) * 5 + 6.5;
  };
  field("Name:", clientName);
  field("Company:", company);
  field("Address:", address);
  field("Phone:", contact);
  field("Purpose:", purpose);
  y += 4;

  // ── Invoice table (6 columns) ───────────────────────────────────
  // Widths follow the reference exactly: 38% / 10% / 13% / 10% / 13% / 16%
  // of the 180mm content width.
  const x0 = MARGIN_L;
  const W = MARGIN_R - x0; // 180
  const xRef = x0 + W * 0.38;   // 68.4
  const xQuote = xRef + W * 0.1;  // 18
  const xPaid = xQuote + W * 0.13; // 23.4
  const xExp = xPaid + W * 0.1;   // 18
  const xBal = xExp + W * 0.13;   // 23.4
  const xEnd = MARGIN_R;          // remaining 16% = 28.8
  const cols = [x0, xRef, xQuote, xPaid, xExp, xBal, xEnd];
  const mid = (i: number) => (cols[i] + cols[i + 1]) / 2;
  const vlines = (yy: number, h: number) => { for (let i = 1; i < 6; i++) doc.line(cols[i], yy, cols[i], yy + h); };

  // Cell padding — keeps text off the column rules. Numeric columns get a
  // tighter pad because the 10%-wide AMT PAID column has only ~14mm to spare.
  const PAD = 3;
  const NPAD = 2;

  // Header (navy fill, white bold). Redrawn at the top of every page the
  // table spills onto, so a continued table is never headerless.
  const hH = 10;
  const drawTableHead = (yy: number): number => {
    doc.setFillColor(...NAVY);
    doc.rect(x0, yy, W, hH, "F");
    doc.setDrawColor(...NAVY_MID);
    doc.setLineWidth(0.5);
    doc.rect(x0, yy, W, hH, "S");
    doc.setDrawColor(...WHITE);
    doc.setLineWidth(0.3);
    vlines(yy, hH);
    doc.setFont(FONT, "bold");
    doc.setFontSize(FS.denseHead);
    doc.setTextColor(...WHITE);
    ["DESCRIPTION", "REF NUM", "AMT QUOTE", "AMT PAID", "EXPENCE", "BALANCE"].forEach((h, i) =>
      doc.text(h, mid(i), yy + 6.4, { align: "center" })
    );
    return yy + hH;
  };
  y = drawTableHead(y);

  // One row per line item
  items.forEach((it) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(FS.dense);
    const descLines = doc.splitTextToSize(it.description || "-", (xRef - x0) - PAD * 2) as string[];
    const rowH = Math.max(10, descLines.length * 5.5 + 4.5);
    // Keep the row whole — start a new page (and repeat the head) rather than
    // clipping it.
    const yBefore = y;
    y = pageBreak(doc, y, rowH);
    if (y !== yBefore) y = drawTableHead(y);
    doc.setDrawColor(...NAVY_MID);
    doc.setLineWidth(0.5);
    doc.rect(x0, y, W, rowH, "S");
    vlines(y, rowH);
    doc.setTextColor(...BLACK);
    doc.text(descLines, x0 + PAD, y + 5.6);
    const cy = y + rowH / 2 + 1.5;
    const bal = (Number(it.amount) || 0) - (Number(it.amtPaid) || 0);
    doc.text(it.refNum || "-", mid(1), cy, { align: "center" });
    doc.text(amt(it.amount || 0), cols[3] - NPAD, cy, { align: "right" });
    doc.text(amt(it.amtPaid || 0), cols[4] - NPAD, cy, { align: "right" });
    doc.text(amt(it.expense || 0), cols[5] - NPAD, cy, { align: "right" });
    doc.text(amt(bal), xEnd - NPAD, cy, { align: "right" });
    y += rowH;
  });

  // Total row (mandatory #FFFF00 highlight) — kept with the table head.
  const tH = 10;
  const yBeforeTotal = y;
  y = pageBreak(doc, y, tH);
  if (y !== yBeforeTotal) y = drawTableHead(y);
  doc.setFillColor(...YELLOW);
  doc.rect(x0, y, W, tH, "F");
  doc.setDrawColor(...NAVY_MID);
  doc.setLineWidth(0.5);
  doc.rect(x0, y, W, tH, "S");
  vlines(y, tH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.dense);
  doc.setTextColor(...BLACK);
  doc.text("TOTAL", x0 + PAD, y + 6.4);
  doc.text(amt(totalQuote), cols[3] - NPAD, y + 6.4, { align: "right" });
  doc.text(amt(totalPaid), cols[4] - NPAD, y + 6.4, { align: "right" });
  doc.text(amt(totalExpense), cols[5] - NPAD, y + 6.4, { align: "right" });
  doc.text(amt(totalBalance), xEnd - NPAD, y + 6.4, { align: "right" });
  y += tH + 4;

  y = pageBreak(doc, y, 6);
  doc.setFont(FONT, "italic");
  doc.setFontSize(FS.small);
  doc.setTextColor(...GRAY_TITLE);
  doc.text("All amounts in AED. 5% VAT applicable as per UAE FTA regulations.", MARGIN_R, y, { align: "right" });
  y += 10;

  // ── Terms ───────────────────────────────────────────────────────
  // The title reserves room for the first couple of bullets; listBlock breaks
  // the rest itself.
  y = sectionTitle(doc, "GENERAL TERMS AND CONDITIONS", y, 24);
  y = listBlock(doc, GENERAL_TERMS, y);
  y += 8;

  // ── Signature block ─────────────────────────────────────────────
  // Follows the terms instead of a fixed y=250, which used to overlap them.
  // 34mm covers the label, the rule 12mm below it, the cheque line and the
  // centered closing underneath.
  const sigY = pageBreak(doc, y, 34);
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.body);
  doc.setTextColor(...BLACK);
  doc.text("Signature & Company Stamp :", MARGIN_L, sigY);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, sigY + 12, MARGIN_L + 70, sigY + 12);
  doc.setFont(FONT, "normal");
  doc.setFontSize(FS.dense);
  doc.setTextColor(...GRAY_TITLE);
  doc.text("Make all cheques payable to Professional Business Services.", MARGIN_L, sigY + 18);

  // Centered closing sits on the signature line's row, clear of the 70mm rule
  // on the left.
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.closing);
  doc.setTextColor(...NAVY);
  doc.text("THANK YOU FOR YOUR BUSINESS!", 105, sigY + 30, { align: "center" });

  paginateFooters(doc, "TAX INVOICE");

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${reference}.pdf"`,
    },
  });
}
