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

  const [clients, leads, contacts, quoteReqs, services, followUps, quotesList, invoices, documents] = await Promise.all([
    safeData(() => db.from("Client").select("*").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("Lead").select("*").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("ContactSubmission").select("*").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("QuoteRequest").select("*").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("ServiceRequest").select("*, Client(name)").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("FollowUp").select("*, Client(name)").order("dueDate", { ascending: true }).limit(50)),
    safeData(() => db.from("Quote").select("*, Client(name, company)").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("Invoice").select("*, Quote(*, Client(name))").order("createdAt", { ascending: false }).limit(50)),
    safeData(() => db.from("Document").select("*, Client(name)").not("expiryDate", "is", null).order("expiryDate", { ascending: true }).limit(50)),
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
    clients, leads, contacts, quoteReqs, services, followUps, quotesList, invoices, documents
  });
}
