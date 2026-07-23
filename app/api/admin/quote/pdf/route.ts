import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeItems, sumAmount, type LineItem, type DocMeta } from "@/lib/documents";
import {
  NAVY, NAVY_MID, HEADER_BG, YELLOW, BLACK, GRAY_TITLE,
  MARGIN_L, MARGIN_R, money, refNumber, formatDate,
  drawHeader, sectionTitle, listBlock, GENERAL_TERMS, FONT, FS,
  pageBreak, paginateFooters,
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
        .map((s: any, idx: number) => ({
          description: String(s.desc).trim(),
          quantity: 1,
          unitPrice: Number(s.amount) || 0,
          amount: Number(s.amount) || 0,
          refNum: idx === 0 ? undefined : undefined,
        }));
    } catch { return []; }
  };

  // Prefer stored line items; fall back to legacy fees for old records.
  const stored: LineItem[] = normalizeItems(quote.lineItems);
  // Detect when a single line item's description is the raw `services` JSON
  // (data migration artifact) — unpack it into individual rows.
  const isJsonBlob = stored.length === 1 && stored[0]?.description?.startsWith("[{");
  const items: LineItem[] = isJsonBlob
    ? parseServicesJSON(quote.services)
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
  const reference = meta.referenceNo || refNumber(quote.createdAt);

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawHeader(doc, "QUOTATION");

  // ── Client info block (two columns) ─────────────────────────────
  // Left column: label at MARGIN_L, value at +30, clipped at 112 so it can't
  // run into the right column (labels start at 120).
  let y = 42;
  const LEFT_V = MARGIN_L + 30, LEFT_W = 112 - LEFT_V;
  const RIGHT_V = 150, RIGHT_W = MARGIN_R - RIGHT_V;
  const L = (t: string, x: number, yy: number) => { doc.setFont(FONT, "bold"); doc.setTextColor(...BLACK); doc.setFontSize(FS.body); doc.text(t, x, yy); };
  // Returns how many lines the value wrapped to, so the row can grow.
  const V = (t: string, x: number, yy: number, w: number) => {
    doc.setFont(FONT, "normal"); doc.setTextColor(...BLACK); doc.setFontSize(FS.body);
    const lines = doc.splitTextToSize(t || "-", w) as string[];
    doc.text(lines, x, yy);
    return lines.length;
  };
  // One row of the two-column block; advances y past the taller of the two.
  const row = (l1: string, v1: string, l2: string, v2: string) => {
    L(l1, MARGIN_L, y);
    L(l2, 120, y);
    const n = Math.max(V(v1, LEFT_V, y, LEFT_W), V(v2, RIGHT_V, y, RIGHT_W));
    y += (n - 1) * 5 + 6.5;
  };

  row("Name:", clientName, "DATE:", formatDate(quote.createdAt));
  row("Company Name:", company, "Reference #:", reference);
  row("Address:", address, "Client's ID:", meta.clientRefId || "-");
  row("Contact no.:", contact, "Subject:", subject);
  y += 6;

  // ── Quotation table (3 columns: S.R.NO | DESCRIPTION | AMOUNT) ───
  // Reference proportions of the 180mm body: 15% / 65% / 20%.
  const xSR = MARGIN_L, W = MARGIN_R - MARGIN_L;
  const xDesc = xSR + W * 0.15;  // 42
  const xAmt = xDesc + W * 0.65; // 159
  const xEnd = MARGIN_R;         // remaining 20%
  const centerOf = (a: number, b: number) => (a + b) / 2;
  const PAD = 3.5; // cell padding — keeps text off the column rules

  const hH = 10;
  // Repeated at the top of every page the table continues onto.
  const drawTableHead = (yy: number): number => {
    doc.setFillColor(...HEADER_BG);
    doc.rect(xSR, yy, W, hH, "F");
    doc.setDrawColor(...NAVY_MID);
    doc.setLineWidth(0.5);
    doc.rect(xSR, yy, W, hH, "S");
    doc.line(xDesc, yy, xDesc, yy + hH);
    doc.line(xAmt, yy, xAmt, yy + hH);
    doc.setFont(FONT, "bold");
    doc.setFontSize(FS.tableHead);
    doc.setTextColor(...NAVY);
    doc.text("S.R.NO", centerOf(xSR, xDesc), yy + 6.4, { align: "center" });
    doc.text("DESCRIPTION", centerOf(xDesc, xAmt), yy + 6.4, { align: "center" });
    doc.text("AMOUNT", centerOf(xAmt, xEnd), yy + 6.4, { align: "center" });
    return yy + hH;
  };
  y = drawTableHead(y);

  const bodyRow = (sr: string, descText: string, amountText: string) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(FS.body);
    const lines = doc.splitTextToSize(descText, (xAmt - xDesc) - PAD * 2) as string[];
    const h = Math.max(10, lines.length * 5.5 + 4.5);
    // Keep the row whole — start a new page (and repeat the head) rather than
    // clipping it.
    const yBefore = y;
    y = pageBreak(doc, y, h);
    if (y !== yBefore) y = drawTableHead(y);
    doc.setDrawColor(...NAVY_MID);
    doc.setLineWidth(0.5);
    doc.rect(xSR, y, W, h, "S");
    doc.line(xDesc, y, xDesc, y + h);
    doc.line(xAmt, y, xAmt, y + h);
    doc.setTextColor(...BLACK);
    if (sr) doc.text(sr, centerOf(xSR, xDesc), y + h / 2 + 1.5, { align: "center" });
    doc.text(lines, xDesc + PAD, y + 5.8);
    if (amountText) doc.text(amountText, xEnd - PAD, y + h / 2 + 1.5, { align: "right" });
    y += h;
  };

  items.forEach((it, i) => {
    const qtyNote = (it.quantity && it.quantity > 1) ? `   (${it.quantity} × ${money(it.unitPrice || 0)})` : "";
    bodyRow(String(i + 1), `${it.description}${qtyNote}`, money(it.amount || 0));
  });

  // Total row (mandatory #FFFF00 highlight) — kept with the table head.
  const tH = 10;
  const yBeforeTotal = y;
  y = pageBreak(doc, y, tH);
  if (y !== yBeforeTotal) y = drawTableHead(y);
  doc.setFillColor(...YELLOW);
  doc.rect(xSR, y, W, tH, "F");
  doc.setDrawColor(...NAVY_MID);
  doc.setLineWidth(0.5);
  doc.rect(xSR, y, W, tH, "S");
  doc.line(xDesc, y, xDesc, y + tH);
  doc.line(xAmt, y, xAmt, y + tH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.total);
  doc.setTextColor(...BLACK);
  doc.text("TOTAL", centerOf(xSR, xDesc), y + 6.5, { align: "center" });
  doc.text(money(total), xEnd - PAD, y + 6.5, { align: "right" });
  y += tH + 10;

  // ── Required documents ──────────────────────────────────────────
  // sectionTitle reserves room for its first items; listBlock breaks the rest.
  y = sectionTitle(doc, "REQUIRED DOCUMENTS:", y, 24);
  y = listBlock(doc, isIcv ? REQUIRED_DOCS_ICV : REQUIRED_DOCS_STD, y, true);
  y += 6;

  // ── Terms ───────────────────────────────────────────────────────
  y = sectionTitle(doc, "GENERAL TERMS AND CONDITIONS", y, 30);
  doc.setFont(FONT, "italic");
  doc.setFontSize(FS.body);
  doc.setTextColor(...BLACK);
  doc.text("IT IS AGREED AS FOLLOWS THAT:", MARGIN_L, y);
  y += 6.5;
  y = listBlock(doc, GENERAL_TERMS, y);
  y += 8;

  // ── Closing block ───────────────────────────────────────────────
  // 22mm holds both centered lines plus the closing line beneath them.
  y = pageBreak(doc, y, 22);
  doc.setFont(FONT, "normal");
  doc.setFontSize(FS.body);
  doc.setTextColor(...GRAY_TITLE);
  doc.text("The QUOTATION is solely prepared for the Clients of PROFESSIONAL BUSINESS SERVICES.", 105, y, { align: "center" });
  y += 5.5;
  doc.text("If you have any questions concerning this quotation, please contact us.", 105, y, { align: "center" });
  y += 10;
  doc.setFont(FONT, "bold");
  doc.setFontSize(FS.closing);
  doc.setTextColor(...NAVY);
  doc.text("THANK YOU FOR YOUR BUSINESS!", 105, y, { align: "center" });

  paginateFooters(doc, "QUOTATION");

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${isIcv ? "icv-quotation" : "quotation"}-${reference}.pdf"`,
    },
  });
}
