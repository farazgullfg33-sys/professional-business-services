import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quoteId, amount, paymentMethod } = await request.json();
  if (!quoteId || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = createAdminClient();
  const { data: invoice, error } = await db.from("Invoice").insert({
    quoteId,
    amount: Number(amount),
    paymentMethod: paymentMethod || "Bank Transfer",
    status: "pending"
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "invoice" });
  return NextResponse.json({ ok: true, invoice });
}
