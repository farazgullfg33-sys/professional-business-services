import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const quote = await prisma.quote.findUnique({ where: { id }, include: { client: true } });
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Header with logo
  doc.setFillColor(26, 58, 92); // navy
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(236, 180, 1); // gold
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Professional Business Services", 105, 14, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("PRO Services in UAE | Company Formation | Visa Processing", 105, 22, { align: "center" });

  // Contact info
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.text("Abu Dhabi, UAE | info@proservices.ae | +971 50 123 4567", 105, 28, { align: "center" });

  // Quote title
  doc.setTextColor(26, 58, 92);
  doc.setFontSize(16);
  doc.text("QUOTATION", 105, 42, { align: "center" });
  doc.setDrawColor(236, 180, 1);
  doc.line(20, 46, 190, 46);

  // Client info
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`Client: ${quote.client.name}`, 20, 56);
  if (quote.client.company) doc.text(`Company: ${quote.client.company}`, 20, 63);
  if (quote.client.email) doc.text(`Email: ${quote.client.email}`, 20, 70);
  doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 140, 56);
  doc.text(`Quote #: ${quote.id.slice(0, 8)}`, 140, 63);

  // Services table
  let y = 82;
  doc.setFillColor(26, 58, 92);
  doc.rect(20, y, 170, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Service", 25, y + 6);
  doc.text("Govt Fee (AED)", 120, y + 6, { align: "right" });
  doc.text("PRO Fee (AED)", 155, y + 6, { align: "right" });
  doc.text("Total (AED)", 185, y + 6, { align: "right" });

  y += 10;
  doc.setTextColor(40, 40, 40);
  const services = quote.services.split(",").map((s: string) => s.trim());
  services.forEach((s: string) => {
    doc.text(s, 25, y + 5);
    doc.text("0.00", 120, y + 5, { align: "right" });
    doc.text("0.00", 155, y + 5, { align: "right" });
    doc.text("0.00", 185, y + 5, { align: "right" });
    y += 8;
  });

  // Totals
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(120, y, 190, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Govt Fees:", 120, y, { align: "right" });
  doc.text(`AED ${quote.govFees.toFixed(2)}`, 185, y, { align: "right" });
  y += 7;
  doc.text("PRO Service Fees:", 120, y, { align: "right" });
  doc.text(`AED ${quote.proFees.toFixed(2)}`, 185, y, { align: "right" });
  y += 7;
  doc.setFontSize(12);
  doc.setTextColor(236, 180, 1);
  doc.text("TOTAL:", 120, y, { align: "right" });
  doc.text(`AED ${quote.total.toFixed(2)}`, 185, y, { align: "right" });

  // Footer
  doc.setTextColor(130, 130, 130);
  doc.setFontSize(8);
  doc.text("This is a computer-generated quotation. Valid for 15 days.", 105, 280, { align: "center" });
  doc.text("Professional Business Services | Abu Dhabi, UAE", 105, 286, { align: "center" });

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quote-${quote.id.slice(0, 8)}.pdf"`
    }
  });
}
