import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeItems, sumAmount, type LineItem, type DocMeta } from "@/lib/documents";
import {
  NAVY, NAVY_MID, HEADER_BG, YELLOW, BLACK, GRAY_TITLE,
  MARGIN_L, MARGIN_R, money, refNumber, formatDate,
  drawHeader, drawFooter, sectionTitle, listBlock, GENERAL_TERMS, FONT,
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

  // Prefer stored line items; fall back to legacy fees for old records.
  let items: LineItem[] = normalizeItems(quote.lineItems);
  if (items.length === 0) {
    items = [
      { description: quote.services || "Professional Services", quantity: 1, unitPrice: quote.proFees || 0, amount: quote.proFees || 0 },
      { description: "Government / Authority Fees", quantity: 1, unitPrice: quote.govFees || 0, amount: quote.govFees || 0 },
    ];
  }
  const total = quote.total || sumAmount(items);

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
  let y = 42;
  const L = (t: string, x: number, yy: number) => { doc.setFont(FONT, "bold"); doc.setTextColor(...BLACK); doc.setFontSize(9.5); doc.text(t, x, yy); };
  const V = (t: string, x: number, yy: number) => { doc.setFont(FONT, "normal"); doc.setTextColor(...BLACK); doc.setFontSize(9.5); doc.text(t || "-", x, yy); };

  L("Name:", MARGIN_L, y);            V(clientName, MARGIN_L + 28, y);
  L("DATE:", 120, y);                 V(formatDate(quote.createdAt), 150, y);
  y += 6;
  L("Company Name:", MARGIN_L, y);    V(company, MARGIN_L + 28, y);
  L("Reference #:", 120, y);          V(reference, 150, y);
  y += 6;
  L("Address:", MARGIN_L, y);         V(address, MARGIN_L + 28, y);
  L("Client's ID:", 120, y);          V(meta.clientRefId || "-", 150, y);
  y += 6;
  L("Contact no.:", MARGIN_L, y);     V(contact, MARGIN_L + 28, y);
  L("Subject:", 120, y);              V(subject, 150, y);
  y += 10;

  // ── Quotation table (3 columns: S.R.NO | DESCRIPTION | AMOUNT) ───
  const xSR = MARGIN_L, xDesc = 42, xAmt = 159, xEnd = MARGIN_R;
  const centerOf = (a: number, b: number) => (a + b) / 2;

  const hH = 9;
  doc.setFillColor(...HEADER_BG);
  doc.rect(xSR, y, 180, hH, "F");
  doc.setDrawColor(...NAVY_MID);
  doc.setLineWidth(0.5);
  doc.rect(xSR, y, 180, hH, "S");
  doc.line(xDesc, y, xDesc, y + hH);
  doc.line(xAmt, y, xAmt, y + hH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text("S.R.NO", centerOf(xSR, xDesc), y + 5.9, { align: "center" });
  doc.text("DESCRIPTION", centerOf(xDesc, xAmt), y + 5.9, { align: "center" });
  doc.text("AMOUNT", centerOf(xAmt, xEnd), y + 5.9, { align: "center" });
  y += hH;

  const bodyRow = (sr: string, descText: string, amountText: string) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(descText, (xAmt - xDesc) - 6) as string[];
    const h = Math.max(8, lines.length * 4.7 + 3.4);
    doc.setDrawColor(...NAVY_MID);
    doc.setLineWidth(0.5);
    doc.rect(xSR, y, 180, h, "S");
    doc.line(xDesc, y, xDesc, y + h);
    doc.line(xAmt, y, xAmt, y + h);
    doc.setTextColor(...BLACK);
    if (sr) doc.text(sr, centerOf(xSR, xDesc), y + h / 2 + 1.5, { align: "center" });
    doc.text(lines, xDesc + 3, y + 5.6);
    if (amountText) doc.text(amountText, xEnd - 3, y + h / 2 + 1.5, { align: "right" });
    y += h;
  };

  items.forEach((it, i) => {
    const qtyNote = (it.quantity && it.quantity > 1) ? `   (${it.quantity} × ${money(it.unitPrice || 0)})` : "";
    bodyRow(String(i + 1), `${it.description}${qtyNote}`, money(it.amount || 0));
  });

  // Total row (mandatory #FFFF00 highlight)
  const tH = 9;
  doc.setFillColor(...YELLOW);
  doc.rect(xSR, y, 180, tH, "F");
  doc.setDrawColor(...NAVY_MID);
  doc.setLineWidth(0.5);
  doc.rect(xSR, y, 180, tH, "S");
  doc.line(xDesc, y, xDesc, y + tH);
  doc.line(xAmt, y, xAmt, y + tH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BLACK);
  doc.text("TOTAL", centerOf(xSR, xDesc), y + 5.9, { align: "center" });
  doc.text(money(total), xEnd - 3, y + 5.9, { align: "right" });
  y += tH + 8;

  // ── Required documents ──────────────────────────────────────────
  y = sectionTitle(doc, "REQUIRED DOCUMENTS:", y);
  y = listBlock(doc, isIcv ? REQUIRED_DOCS_ICV : REQUIRED_DOCS_STD, y, true);
  y += 4;

  // ── Terms ───────────────────────────────────────────────────────
  y = sectionTitle(doc, "GENERAL TERMS AND CONDITIONS", y);
  doc.setFont(FONT, "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text("IT IS AGREED AS FOLLOWS THAT:", MARGIN_L, y);
  y += 5;
  y = listBlock(doc, GENERAL_TERMS, y);
  y += 5;

  // ── Closing block ───────────────────────────────────────────────
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY_TITLE);
  doc.text("The QUOTATION is solely prepared for the Clients of PROFESSIONAL BUSINESS SERVICES.", 105, y, { align: "center" });
  y += 5;
  doc.text("If you have any questions concerning this quotation, please contact us.", 105, y, { align: "center" });
  y += 8;
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text("THANK YOU FOR YOUR BUSINESS!", 105, y, { align: "center" });

  drawFooter(doc, "QUOTATION 1-1");

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${isIcv ? "icv-quotation" : "quotation"}-${reference}.pdf"`,
    },
  });
}
