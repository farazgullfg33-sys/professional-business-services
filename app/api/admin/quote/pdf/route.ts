import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeItems, sumAmount, type LineItem, type DocMeta } from "@/lib/documents";
import {
  BLACK, WHITE, TEXT_BLACK, PEACH_ROW, GRAY_TEXT,
  MARGIN_L, MARGIN_R, money, refNumber, formatDate,
  drawHeader, paginateFooters, refDateRows, sectionBar, fieldRow, fieldFull,
  grandTotalBar, listBlock, GENERAL_TERMS, FONT, FS,
  pageBreak,
} from "@/lib/pdf/brand";

const REQUIRED_DOCS_STD = [
  "PASSPORT COPY (OWNER / PARTNERS)",
  "EMIRATES ID / VISA COPY",
  "TRADE LICENSE COPY (IF EXISTING)",
  "MOA / COMPANY DOCUMENTS",
  "TENANCY CONTRACT / EJARI (IF APPLICABLE)",
];

const REQUIRED_DOCS_ICV = [
  "PRODUCT LIST WITH INFORMATION",
  "COMMERCIAL LICENSE",
  "AUDITED FINANCIAL STATEMENTS (LAST 2 YEARS)",
  "VAT REGISTRATION CERTIFICATE",
  "EMIRATES ID & PASSPORT OF AUTHORIZED SIGNATORY",
];

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const variantParam = searchParams.get("variant");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = createAdminClient();
  const { data: quote, error } = await db.from("Quote").select("*, Client(*)").eq("id", id).single();
  if (error || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const meta = (quote.meta ?? {}) as DocMeta;
  const isIcv = variantParam === "icv" || meta.docType === "icv";
  const client = quote.Client ?? {};

  // Try to parse `services` JSON into individual line items.
  const parseServicesJSON = (raw: unknown): LineItem[] => {
    if (typeof raw !== "string") return [];
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((s: any) => s?.desc)
        .map((s: any) => ({
          description: String(s.desc).trim(),
          quantity: 1,
          unitPrice: Number(s.amount) || 0,
          amount: Number(s.amount) || 0,
        }));
    } catch { return []; }
  };

  // Prefer stored line items; fall back to legacy fees for old records.
  const stored: LineItem[] = normalizeItems(quote.lineItems);
  // Detect when any line item's description is the raw `services` JSON
  // (data migration artifact) — unpack services into individual rows instead.
  const hasJsonBlob = stored.some((it) => it.description?.startsWith("[{"));
  const items: LineItem[] = hasJsonBlob
    ? [
        ...parseServicesJSON(quote.services),
        ...stored.filter((it) => !it.description?.startsWith("[{")),
      ]
    : stored.length > 0
      ? stored
      : [
          { description: quote.services || "Professional Services", quantity: 1, unitPrice: quote.proFees || 0, amount: quote.proFees || 0 },
          { description: "Government / Authority Fees", quantity: 1, unitPrice: quote.govFees || 0, amount: quote.govFees || 0 },
        ];
  // Always total the rows that are actually printed. Reading quote.total first
  // printed a stale figure whenever the line items had been edited, and `||`
  // discarded a legitimate 0 (e.g. a discount row cancelling the charges).
  const total = stored.length > 0 ? sumAmount(items) : (Number(quote.total) || sumAmount(items));

  const clientName = meta.clientName || client.name || "-";
  const company = meta.company || client.company || "-";
  const address = meta.address || client.address || "Abu Dhabi, UAE";
  const contact = meta.contact || client.phone || "-";
  const subject = meta.subject || (isIcv ? "ICV & ADNOC Pre-Qualification" : "Business Services Quotation");
  const reference = meta.referenceNo || refNumber(quote.createdAt, isIcv ? "ICV" : "QUO");
  const dateStr = formatDate(quote.createdAt);
  const validUntil = formatDate(new Date(new Date(quote.createdAt || Date.now()).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString());

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = drawHeader(doc, isIcv ? "ICV & ADNOC QUOTATION" : "QUOTATION");
  y = refDateRows(doc, y, [
    ["Quotation", reference, "Date", dateStr],
    ["Client ID", meta.clientRefId || "-", "Valid Until", validUntil],
  ]);

  y = sectionBar(doc, "CLIENT DETAILS", y);
  y = fieldRow(doc, y, "Name", clientName, "Company", company);
  y = fieldRow(doc, y, "Address", address, "Contact", contact);
  y = fieldFull(doc, y, "Subject", subject);
  y += 4;

  // ── Quotation table (3 columns: S.R.NO | DESCRIPTION | AMOUNT) ───
  const xSR = MARGIN_L, W = MARGIN_R - MARGIN_L;
  const xDesc = xSR + W * 0.15;
  const xAmt = xDesc + W * 0.65;
  const xEnd = MARGIN_R;
  const centerOf = (a: number, b: number) => (a + b) / 2;
  const PAD = 3.5;

  y = sectionBar(doc, isIcv ? "ICV & ADNOC BREAKDOWN" : "QUOTATION BREAKDOWN", y);

  const hH = 9;
  doc.setFillColor(...BLACK);
  doc.rect(xSR, y, W, hH, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.dense);
  doc.setTextColor(...WHITE);
  doc.text("S.R.NO", centerOf(xSR, xDesc), y + hH / 2 + 1.6, { align: "center" });
  doc.text("DESCRIPTION", centerOf(xDesc, xAmt), y + hH / 2 + 1.6, { align: "center" });
  doc.text("AMOUNT", centerOf(xAmt, xEnd), y + hH / 2 + 1.6, { align: "center" });
  y += hH;

  items.forEach((it, i) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(FS.body);
    const qtyNote = (it.quantity && it.quantity > 1) ? `   (${it.quantity} × ${money(it.unitPrice || 0)})` : "";
    const lines = doc.splitTextToSize(`${it.description}${qtyNote}`, (xAmt - xDesc) - PAD * 2) as string[];
    const h = Math.max(9, lines.length * 5 + 3.6);
    const yBefore = y;
    y = pageBreak(doc, y, h);
    if (y === yBefore && i % 2 === 1) {
      doc.setFillColor(...PEACH_ROW);
      doc.rect(xSR, y, W, h, "F");
    }
    doc.setTextColor(...TEXT_BLACK);
    doc.text(String(i + 1), centerOf(xSR, xDesc), y + h / 2 + 1.5, { align: "center" });
    doc.text(lines, xDesc + PAD, y + 5.3);
    doc.text(money(it.amount || 0), xEnd - PAD, y + h / 2 + 1.5, { align: "right" });
    y += h;
  });

  // GRAND TOTAL row inside the table (bold).
  const tH = 9;
  y = pageBreak(doc, y, tH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.dense);
  doc.setTextColor(...TEXT_BLACK);
  doc.text("GRAND TOTAL", centerOf(xSR, xDesc), y + tH / 2 + 1.4, { align: "center" });
  doc.text(money(total), xEnd - PAD, y + tH / 2 + 1.4, { align: "right" });
  y += tH + 4;

  y = grandTotalBar(doc, y, total);
  y += 8;

  // ── Required documents ──────────────────────────────────────────
  y = sectionBar(doc, "REQUIRED DOCUMENTS", y);
  y = listBlock(doc, isIcv ? REQUIRED_DOCS_ICV : REQUIRED_DOCS_STD, y, true);
  y += 4;

  // ── Terms ───────────────────────────────────────────────────────
  y = sectionBar(doc, "TERMS & CONDITIONS", y);
  y = listBlock(doc, GENERAL_TERMS, y, true);
  y += 8;

  // ── Closing block ───────────────────────────────────────────────
  y = pageBreak(doc, y, 20);
  doc.setFont(FONT, "normal");
  doc.setFontSize(FS.body);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("This quotation is solely prepared for the clients of Professional Business Services.", 105, y, { align: "center" });
  y += 5.5;
  doc.text("If you have any questions concerning this quotation, please contact us.", 105, y, { align: "center" });
  y += 10;
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.closing);
  doc.setTextColor(...TEXT_BLACK);
  doc.text("THANK YOU FOR YOUR BUSINESS!", 105, y, { align: "center" });

  paginateFooters(doc);

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${isIcv ? "icv-quotation" : "quotation"}-${reference}.pdf"`,
    },
  });
}
