export type ChartInvoice = { amount: number; status: string; paidAt?: string | null; createdAt: string };
export type ChartService = { status: string; assignedTo?: string | null };
export type ChartLead = { source: string };

const statusLabels: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  delivered: "Delivered"
};

export function monthlyRevenueSeries(invoices: ChartInvoice[] = [], monthsBack = 6) {
  const now = new Date();
  const series = Array.from({ length: monthsBack }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - idx), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }), revenue: 0 };
  });
  const byKey = new Map(series.map((s) => [s.key, s]));
  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    const paidOn = new Date(inv.paidAt || inv.createdAt);
    const bucket = byKey.get(`${paidOn.getFullYear()}-${paidOn.getMonth()}`);
    if (bucket) bucket.revenue += Number(inv.amount) || 0;
  }
  return series.map(({ month, revenue }) => ({ month, revenue }));
}

export function statusBreakdown(services: ChartService[] = []) {
  const counts = new Map<string, number>();
  for (const s of services) counts.set(s.status, (counts.get(s.status) || 0) + 1);
  return Array.from(counts.entries()).map(([status, count]) => ({ status: statusLabels[status] || status, count }));
}

export function leadsBySource(leads: ChartLead[] = []) {
  const counts = new Map<string, number>();
  for (const l of leads) counts.set(l.source, (counts.get(l.source) || 0) + 1);
  return Array.from(counts.entries()).map(([source, count]) => ({ source, count }));
}

export function acquisitionFunnel(counts: { leads: number; quoteReqs: number; clients: number; completed: number }) {
  return [
    { stage: "Leads", value: counts.leads },
    { stage: "Quote Requests", value: counts.quoteReqs },
    { stage: "Clients", value: counts.clients },
    { stage: "Completed Services", value: counts.completed }
  ];
}

export function staffProductivity(services: ChartService[] = []) {
  const map = new Map<string, { staff: string; total: number; completed: number }>();
  for (const s of services) {
    const staff = s.assignedTo || "Unassigned";
    if (!map.has(staff)) map.set(staff, { staff, total: 0, completed: 0 });
    const row = map.get(staff)!;
    row.total += 1;
    if (["completed", "delivered"].includes(s.status)) row.completed += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
