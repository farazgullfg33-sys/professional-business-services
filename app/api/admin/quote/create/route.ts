import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, services, govFees, proFees } = await request.json();
  if (!clientId || !services) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const total = (Number(govFees) || 0) + (Number(proFees) || 0);

  const db = createAdminClient();
  const { data: quote, error: qErr } = await db.from("Quote").insert({
    clientId,
    services,
    govFees: Number(govFees) || 0,
    proFees: Number(proFees) || 0,
    total,
    status: "draft"
  }).select().single();

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  await db.from("Invoice").insert({ quoteId: quote.id, amount: total, status: "pending" });

  adminEventBus.emit({ type: "created", entity: "invoice" });
  return NextResponse.json({ ok: true, quote, invoice: true });
}
