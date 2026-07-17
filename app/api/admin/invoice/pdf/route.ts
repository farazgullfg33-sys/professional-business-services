import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeItems, sumAmount, sumPaid, type LineItem, type DocMeta } from "@/lib/documents";
import {
  NAVY, NAVY_MID, YELLOW, BLACK, WHITE, GRAY_TITLE,
  MARGIN_L, MARGIN_R, refNumber, formatDate,
  drawHeader, drawFooter, sectionTitle, listBlock, GENERAL_TERMS, FONT,
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
    doc.setFont(FONT, "bold"); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
    doc.text(r[0], mx + 2, ry + 4.7);
    doc.setFont(FONT, "normal"); doc.setTextColor(...BLACK);
    doc.text(r[1], mx + mLabelW + 2, ry + 4.7);
  });

  y += 11;
  const field = (label: string, value: string) => {
    doc.setFont(FONT, "bold"); doc.setFontSize(9.5); doc.setTextColor(...BLACK);
    doc.text(label, MARGIN_L, y);
    doc.setFont(FONT, "normal");
    doc.text(value || "-", MARGIN_L + 26, y);
    y += 5.6;
  };
  field("Name:", clientName);
  field("Company:", company);
  field("Address:", address);
  field("Phone:", contact);
  field("Purpose:", purpose);
  y += 4;

  // ── Invoice table (6 columns) ───────────────────────────────────
  const x0 = MARGIN_L;
  const xRef = x0 + 68.4;
  const xQuote = xRef + 18;
  const xPaid = xQuote + 23.4;
  const xExp = xPaid + 18;
  const xBal = xExp + 23.4;
  const xEnd = MARGIN_R;
  const cols = [x0, xRef, xQuote, xPaid, xExp, xBal, xEnd];
  const mid = (i: number) => (cols[i] + cols[i + 1]) / 2;
  const vlines = (yy: number, h: number) => { for (let i = 1; i < 6; i++) doc.line(cols[i], yy, cols[i], yy + h); };

  // Header (navy fill, white bold)
  const hH = 10;
  doc.setFillColor(...NAVY);
  doc.rect(x0, y, MARGIN_R - x0, hH, "F");
  doc.setDrawColor(...NAVY_MID);
  doc.setLineWidth(0.5);
  doc.rect(x0, y, MARGIN_R - x0, hH, "S");
  doc.setDrawColor(...WHITE);
  doc.setLineWidth(0.3);
  vlines(y, hH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...WHITE);
  ["DESCRIPTION", "REF NUM", "AMT QUOTE", "AMT PAID", "EXPENCE", "BALANCE"].forEach((h, i) =>
    doc.text(h, mid(i), y + 6.2, { align: "center" })
  );
  y += hH;

  // One row per line item
  doc.setFontSize(8.5);
  items.forEach((it) => {
    doc.setFont(FONT, "normal");
    const descLines = doc.splitTextToSize(it.description || "-", (xRef - x0) - 5) as string[];
    const rowH = Math.max(8, descLines.length * 4.2 + 3.6);
    doc.setDrawColor(...NAVY_MID);
    doc.setLineWidth(0.5);
    doc.rect(x0, y, MARGIN_R - x0, rowH, "S");
    vlines(y, rowH);
    doc.setTextColor(...BLACK);
    doc.text(descLines, x0 + 2.5, y + 5.3);
    const cy = y + rowH / 2 + 1.3;
    const bal = (Number(it.amount) || 0) - (Number(it.amtPaid) || 0);
    doc.text(it.refNum || "-", mid(1), cy, { align: "center" });
    doc.text(amt(it.amount || 0), cols[3] - 2, cy, { align: "right" });
    doc.text(amt(it.amtPaid || 0), cols[4] - 2, cy, { align: "right" });
    doc.text(amt(it.expense || 0), cols[5] - 2, cy, { align: "right" });
    doc.text(amt(bal), xEnd - 2, cy, { align: "right" });
    y += rowH;
  });

  // Total row (mandatory #FFFF00 highlight)
  const tH = 9;
  doc.setFillColor(...YELLOW);
  doc.rect(x0, y, MARGIN_R - x0, tH, "F");
  doc.setDrawColor(...NAVY_MID);
  doc.setLineWidth(0.5);
  doc.rect(x0, y, MARGIN_R - x0, tH, "S");
  vlines(y, tH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(...BLACK);
  doc.text("TOTAL", x0 + 3, y + 5.8);
  doc.text(amt(totalQuote), cols[3] - 2, y + 5.8, { align: "right" });
  doc.text(amt(totalPaid), cols[4] - 2, y + 5.8, { align: "right" });
  doc.text(amt(totalExpense), cols[5] - 2, y + 5.8, { align: "right" });
  doc.text(amt(totalBalance), xEnd - 2, y + 5.8, { align: "right" });
  y += tH + 3;

  doc.setFont(FONT, "italic");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TITLE);
  doc.text("All amounts in AED. 5% VAT applicable as per UAE FTA regulations.", MARGIN_R, y, { align: "right" });
  y += 8;

  // ── Terms ───────────────────────────────────────────────────────
  y = sectionTitle(doc, "GENERAL TERMS AND CONDITIONS", y);
  y = listBlock(doc, GENERAL_TERMS, y);
  y += 6;

  // ── Signature block (bottom-left) ───────────────────────────────
  const sigY = Math.max(y, 250);
  doc.setFont(FONT, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text("Signature & Company Stamp :", MARGIN_L, sigY);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, sigY + 12, MARGIN_L + 70, sigY + 12);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_TITLE);
  doc.text("Make all cheques payable to Professional Business Services.", MARGIN_L, sigY + 17);

  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text("THANK YOU FOR YOUR BUSINESS!", 105, sigY + 5, { align: "center" });

  drawFooter(doc, "TAX INVOICE 1-1");

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${reference}.pdf"`,
    },
  });
}
