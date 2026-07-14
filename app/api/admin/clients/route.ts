import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, phone, company, businessType, source, notes } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const db = createAdminClient();
  const { data: client, error } = await db.from("Client").insert({
    name,
    email: email || null,
    phone: phone || null,
    company: company || null,
    businessType: businessType || null,
    source: source || "direct",
    notes: notes || null,
    status: "active"
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "client" });
  return NextResponse.json({ ok: true, client });
}
