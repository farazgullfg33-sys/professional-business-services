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

  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { quote: { include: { client: true } } } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const q = invoice.quote;

  // Header
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(236, 180, 1);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Professional Business Services", 105, 14, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Tax Invoice | PRO Services in UAE", 105, 22, { align: "center" });
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.text("Abu Dhabi, UAE | info@proservices.ae | +971 50 123 4567", 105, 28, { align: "center" });

  // INVOICE title
  doc.setTextColor(26, 58, 92);
  doc.setFontSize(16);
  doc.text("TAX INVOICE", 105, 42, { align: "center" });
  doc.line(20, 46, 190, 46);

  // Client + Invoice details
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`Bill To: ${q.client.name}`, 20, 56);
  if (q.client.company) doc.text(`Company: ${q.client.company}`, 20, 63);
  doc.text(`Invoice #: INV-${invoice.id.slice(0, 8)}`, 140, 56);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 140, 63);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 70);

  // Services
  let y = 82;
  doc.setFillColor(26, 58, 92);
  doc.rect(20, y, 170, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Description", 25, y + 6);
  doc.text("Amount (AED)", 185, y + 6, { align: "right" });
  y += 10;

  doc.setTextColor(40, 40, 40);
  const services = q.services.split(",").map((s: string) => s.trim());
  services.forEach((s: string) => {
    doc.text(s, 25, y + 5);
    doc.text((q.proFees / (services.length || 1)).toFixed(2), 185, y + 5, { align: "right" });
    y += 8;
  });

  // Total
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(120, y, 190, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", 120, y, { align: "right" });
  doc.text(`AED ${q.proFees.toFixed(2)}`, 185, y, { align: "right" });
  y += 7;
  doc.text("Govt Fees:", 120, y, { align: "right" });
  doc.text(`AED ${q.govFees.toFixed(2)}`, 185, y, { align: "right" });
  y += 7;
  doc.setFontSize(12);
  doc.setTextColor(236, 180, 1);
  doc.text("TOTAL DUE:", 120, y, { align: "right" });
  doc.text(`AED ${invoice.amount.toFixed(2)}`, 185, y, { align: "right" });

  // Payment info
  y += 14;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text("Payment Method: Bank Transfer", 20, y);
  if (invoice.paymentMethod) doc.text(`Method: ${invoice.paymentMethod}`, 20, y + 5);

  // Footer
  doc.setTextColor(130, 130, 130);
  doc.setFontSize(8);
  doc.text("Thank you for your business!", 105, 280, { align: "center" });
  doc.text("Professional Business Services | Abu Dhabi, UAE", 105, 286, { align: "center" });

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.id.slice(0, 8)}.pdf"`
    }
  });
}
