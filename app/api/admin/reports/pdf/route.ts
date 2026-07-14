import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadsBySource, staffProductivity, statusBreakdown } from "@/lib/reports";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

  const db = createAdminClient();
  const [
    { count: clientCount },
    { data: services },
    { data: leads },
    { data: invoicesMonth },
    { data: invoicesYtd },
    { count: pendingInvoices }
  ] = await Promise.all([
    db.from("Client").select("*", { count: "exact", head: true }),
    db.from("ServiceRequest").select("status, assignedTo"),
    db.from("Lead").select("source"),
    db.from("Invoice").select("amount").eq("status", "paid").gte("paidAt", startOfMonth),
    db.from("Invoice").select("amount").eq("status", "paid").gte("paidAt", startOfYear),
    db.from("Invoice").select("*", { count: "exact", head: true }).eq("status", "pending")
  ]);

  const revenueMonth = (invoicesMonth ?? []).reduce((sum: number, i: { amount: number }) => sum + i.amount, 0);
  const revenueYtd = (invoicesYtd ?? []).reduce((sum: number, i: { amount: number }) => sum + i.amount, 0);
  const pipeline = statusBreakdown(services ?? []);
  const sources = leadsBySource(leads ?? []);
  const productivity = staffProductivity(services ?? []);
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
  y = row("Total Clients", String(clientCount ?? 0), y);
  y = row("Active Services", String((services ?? []).length), y);
  y = row("Revenue This Month (AED)", revenueMonth.toFixed(2), y);
  y = row("Revenue Year to Date (AED)", revenueYtd.toFixed(2), y);
  y = row("Pending Invoices", String(pendingInvoices ?? 0), y);

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
