import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadsBySource, staffProductivity, statusBreakdown } from "@/lib/reports";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [clientCount, services, leads, invoicesMonth, invoicesYtd, pendingInvoices] = await Promise.all([
    prisma.client.count(),
    prisma.serviceRequest.findMany({ select: { status: true, assignedTo: true } }),
    prisma.lead.findMany({ select: { source: true } }),
    prisma.invoice.findMany({ where: { status: "paid", paidAt: { gte: startOfMonth } }, select: { amount: true } }),
    prisma.invoice.findMany({ where: { status: "paid", paidAt: { gte: startOfYear } }, select: { amount: true } }),
    prisma.invoice.count({ where: { status: "pending" } })
  ]);

  const revenueMonth = invoicesMonth.reduce((sum, i) => sum + i.amount, 0);
  const revenueYtd = invoicesYtd.reduce((sum, i) => sum + i.amount, 0);
  const pipeline = statusBreakdown(services);
  const sources = leadsBySource(leads);
  const productivity = staffProductivity(services);
  const periodLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Professional Business Services", 105, 14, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Monthly Performance Report - ${periodLabel}`, 105, 22, { align: "center" });

  const section = (title: string, y: number) => {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 58, 92);
    doc.text(title, 20, y);
    doc.setDrawColor(201, 168, 76);
    doc.line(20, y + 2, 190, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    return y + 10;
  };

  const row = (label: string, value: string, y: number) => {
    doc.text(label, 20, y);
    doc.text(value, 190, y, { align: "right" });
    return y + 7;
  };

  let y = 42;
  y = section("Summary", y);
  y = row("Total Clients", String(clientCount), y);
  y = row("Active Services", String(services.length), y);
  y = row("Revenue This Month (AED)", revenueMonth.toFixed(2), y);
  y = row("Revenue Year to Date (AED)", revenueYtd.toFixed(2), y);
  y = row("Pending Invoices", String(pendingInvoices), y);

  y = section("Service Pipeline", y + 6);
  if (pipeline.length === 0) y = row("No service requests yet", "", y);
  for (const p of pipeline) y = row(p.status, String(p.count), y);

  y = section("Leads by Source", y + 6);
  if (sources.length === 0) y = row("No leads yet", "", y);
  for (const s of sources) y = row(s.source, String(s.count), y);

  y = section("Staff Productivity", y + 6);
  if (productivity.length === 0) y = row("No assignments yet", "", y);
  for (const p of productivity) y = row(p.staff, `${p.completed} / ${p.total} completed`, y);

  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Generated ${now.toLocaleString()}`, 105, 286, { align: "center" });

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="monthly-report-${now.getFullYear()}-${now.getMonth() + 1}.pdf"`
    }
  });
}
