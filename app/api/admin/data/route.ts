import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Supabase returns PromiseLike (PostgrestFilterBuilder), not Promise — use PromiseLike here
async function safeData(query: () => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<unknown[]> {
  try {
    const { data } = await query();
    return data ?? [];
  } catch {
    return [];
  }
}

async function safeCount(query: () => PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  try {
    const { count } = await query();
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();

  const [clients, leads, contacts, quoteReqs, services, followUps, quotesList, invoices, documents, visas, licenses, formation, compliance, staff, attestations, commlog] = await Promise.all([
    safeData(() => db.from("Client").select("*").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("Lead").select("*").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("ContactSubmission").select("*").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("QuoteRequest").select("*").order("createdAt", { ascending: false }).limit(50)),
    // Alias joins to lowercase (client / quote) so the shape matches the component's access pattern
    safeData(() => db.from("ServiceRequest").select("*, client:Client(name)").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("FollowUp").select("*, client:Client(name)").order("dueDate", { ascending: true }).limit(50)),
    safeData(() => db.from("Quote").select("*, client:Client(name, company)").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("Invoice").select("*, quote:Quote(*, client:Client(name))").order("createdAt", { ascending: false }).limit(50)),
    // All documents (not just expiring) — dashboard filters client-side
    safeData(() => db.from("Document").select("*, client:Client(name)").order("createdAt", { ascending: false }).limit(100)),
    safeData(() => db.from("Visa").select("*, client:Client(name)").order("expiryDate", { ascending: true }).limit(100)),
    safeData(() => db.from("License").select("*, client:Client(name)").order("expiryDate", { ascending: true }).limit(100)),
    safeData(() => db.from("FormationChecklist").select("*").order("clientId").order("step")),
    safeData(() => db.from("ComplianceDeadline").select("*, client:Client(name)").order("dueDate", { ascending: true }).limit(100)),
    safeData(() => db.from("Staff").select("id, name, email, role, active").order("name")),
    safeData(() => db.from("Attestation").select("*, client:Client(name)").order("createdAt", { ascending: false }).limit(100)),
    safeData(() => db.from("CommunicationLog").select("*, client:Client(name)").order("createdAt", { ascending: false }).limit(100)),
  ]);

  const [clientCount, leadCount, contactCount, quoteReqCount, serviceCount, followUpCount] = await Promise.all([
    safeCount(() => db.from("Client").select("*", { count: "exact", head: true })),
    safeCount(() => db.from("Lead").select("*", { count: "exact", head: true })),
    safeCount(() => db.from("ContactSubmission").select("*", { count: "exact", head: true })),
    safeCount(() => db.from("QuoteRequest").select("*", { count: "exact", head: true })),
    safeCount(() => db.from("ServiceRequest").select("*", { count: "exact", head: true })),
    safeCount(() => db.from("FollowUp").select("*", { count: "exact", head: true })),
  ]);

  return NextResponse.json({
    counts: { clients: clientCount, leads: leadCount, contacts: contactCount, quoteReqs: quoteReqCount, services: serviceCount, followUps: followUpCount },
    clients, leads, contacts, quoteReqs, services, followUps, quotesList, invoices, documents,
    visas, licenses, formation, compliance, staff, attestations, commlog,
  });
}
