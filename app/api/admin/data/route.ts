import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();

  const [
    { data: clients },
    { data: leads },
    { data: contacts },
    { data: quoteReqs },
    { data: services },
    { data: followUps },
    { data: quotesList },
    { data: invoices },
    { data: documents }
  ] = await Promise.all([
    db.from("Client").select("*").order("createdAt", { ascending: false }).limit(50),
    db.from("Lead").select("*").order("createdAt", { ascending: false }).limit(50),
    db.from("ContactSubmission").select("*").order("createdAt", { ascending: false }).limit(50),
    db.from("QuoteRequest").select("*").order("createdAt", { ascending: false }).limit(50),
    db.from("ServiceRequest").select("*, Client(name)").order("createdAt", { ascending: false }).limit(50),
    db.from("FollowUp").select("*, Client(name)").order("dueDate", { ascending: true }).limit(50),
    db.from("Quote").select("*, Client(name, company)").order("createdAt", { ascending: false }).limit(50),
    db.from("Invoice").select("*, Quote(*, Client(name))").order("createdAt", { ascending: false }).limit(50),
    db.from("Document").select("*, Client(name)").not("expiryDate", "is", null).order("expiryDate", { ascending: true }).limit(50)
  ]);

  const [
    { count: clientCount },
    { count: leadCount },
    { count: contactCount },
    { count: quoteReqCount },
    { count: serviceCount },
    { count: followUpCount }
  ] = await Promise.all([
    db.from("Client").select("*", { count: "exact", head: true }),
    db.from("Lead").select("*", { count: "exact", head: true }),
    db.from("ContactSubmission").select("*", { count: "exact", head: true }),
    db.from("QuoteRequest").select("*", { count: "exact", head: true }),
    db.from("ServiceRequest").select("*", { count: "exact", head: true }),
    db.from("FollowUp").select("*", { count: "exact", head: true })
  ]);

  const counts = {
    clients: clientCount ?? 0,
    leads: leadCount ?? 0,
    contacts: contactCount ?? 0,
    quoteReqs: quoteReqCount ?? 0,
    services: serviceCount ?? 0,
    followUps: followUpCount ?? 0
  };

  return NextResponse.json({ counts, clients, leads, contacts, quoteReqs, services, followUps, quotesList, invoices, documents });
}
