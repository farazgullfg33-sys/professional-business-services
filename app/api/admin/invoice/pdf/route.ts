import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeItems, sumAmount, sumPaid, type LineItem, type DocMeta } from "@/lib/documents";
import {
  BLACK, WHITE, TEXT_BLACK, PEACH_ROW, GREEN,
  MARGIN_L, MARGIN_R, refNumber, formatDate,
  drawHeader, paginateFooters, refDateRows, sectionBar, fieldRow, fieldFull,
  grandTotalBar, advanceDueBar, signatureBoxes, bankDetailsPage,
  listBlock, invoicePaymentTerms, pageBreak, FONT, FS,
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
  const reference = meta.referenceNo || refNumber(invoice.createdAt, "INV");
  const quoteRef = q.meta?.referenceNo || (q.createdAt ? refNumber(q.createdAt, "QUO") : "-");
  const dateStr = formatDate(invoice.createdAt);

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = drawHeader(doc, "TAX INVOICE");
  y = refDateRows(doc, y, [
    ["Invoice", reference, "Date", dateStr],
    ["Quote Ref", quoteRef, "Due", "Immediate"],
  ]);

  y = sectionBar(doc, "BILL TO", y);
  y = fieldRow(doc, y, "Name", clientName, "Company", company);
  y = fieldRow(doc, y, "Contact", contact, "Location", address);
  y = fieldFull(doc, y, "Subject", purpose);
  y += 4;

  y = sectionBar(doc, "INVOICE BREAKDOWN", y);

  // ── Table (6 columns) ────────────────────────────────────────────
  const x0 = MARGIN_L;
  const xRef = x0 + 68.4;
  const xQuote = xRef + 18;
  const xPaid = xQuote + 23.4;
  const xExp = xPaid + 18;
  const xBal = xExp + 23.4;
  const xEnd = MARGIN_R;
  const cols = [x0, xRef, xQuote, xPaid, xExp, xBal, xEnd];
  const mid = (i: number) => (cols[i] + cols[i + 1]) / 2;

  const hH = 9;
  doc.setFillColor(...BLACK);
  doc.rect(x0, y, xEnd - x0, hH, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.dense);
  doc.setTextColor(...WHITE);
  ["DESCRIPTION", "REF", "AMOUNT", "PAID", "EXPENSE", "BALANCE"].forEach((h, i) =>
    doc.text(h, mid(i), y + hH / 2 + 1.6, { align: "center" })
  );
  y += hH;

  doc.setFontSize(FS.dense);
  items.forEach((it, idx) => {
    doc.setFont(FONT, "normal");
    const descLines = doc.splitTextToSize(it.description || "-", (xRef - x0) - 5) as string[];
    const rowH = Math.max(8, descLines.length * 4.2 + 3.6);
    const yBefore = y;
    y = pageBreak(doc, y, rowH);
    const isDiscount = (Number(it.amount) || 0) < 0;
    // Alternate row shading (peach/white), skip the tint on a fresh page.
    if (y === yBefore && idx % 2 === 1) {
      doc.setFillColor(...PEACH_ROW);
      doc.rect(x0, y, xEnd - x0, rowH, "F");
    }
    doc.setTextColor(...(isDiscount ? GREEN : TEXT_BLACK));
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

  // GRAND TOTAL row inside the table (bold).
  const tH = 9;
  y = pageBreak(doc, y, tH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.dense);
  doc.setTextColor(...TEXT_BLACK);
  doc.text("GRAND TOTAL", x0 + 2.5, y + tH / 2 + 1.4);
  doc.text(amt(totalQuote), cols[3] - 2, y + tH / 2 + 1.4, { align: "right" });
  doc.text(amt(totalPaid), cols[4] - 2, y + tH / 2 + 1.4, { align: "right" });
  doc.text(amt(totalExpense), cols[5] - 2, y + tH / 2 + 1.4, { align: "right" });
  doc.text(amt(totalBalance), xEnd - 2, y + tH / 2 + 1.4, { align: "right" });
  y += tH + 4;

  y = grandTotalBar(doc, y, totalQuote);
  y += 3;
  y = advanceDueBar(doc, y, totalQuote);
  y += 8;

  y = sectionBar(doc, "PAYMENT TERMS", y);
  y = listBlock(doc, invoicePaymentTerms(totalQuote / 2), y, true);
  y += 8;

  signatureBoxes(doc, y, clientName, company);

  bankDetailsPage(doc, reference, dateStr, clientName);
  paginateFooters(doc);

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${reference}.pdf"`,
    },
  });
}
