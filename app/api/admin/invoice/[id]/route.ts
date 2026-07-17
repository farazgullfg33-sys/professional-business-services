import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";
import { normalizeItems, sumAmount } from "@/lib/documents";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const db = createAdminClient();

  const { data: existing } = await db.from("Invoice").select("meta").eq("id", params.id).single();
  const prevMeta = (existing?.meta ?? {}) as Record<string, unknown>;

  const update: Record<string, unknown> = {};

  if (body.lineItems !== undefined) {
    const items = normalizeItems(body.lineItems);
    update.lineItems = items;
    update.amount = sumAmount(items);
  }
  if (body.status !== undefined) update.status = body.status;
  if (body.paymentMethod !== undefined) update.paymentMethod = body.paymentMethod;

  const metaPatch: Record<string, unknown> = {};
  for (const k of ["customerId", "referenceNo", "purpose"] as const) {
    if (body[k] !== undefined) metaPatch[k] = body[k];
  }
  if (Object.keys(metaPatch).length) update.meta = { ...prevMeta, ...metaPatch };

  const { data, error } = await db.from("Invoice").update(update).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "updated", entity: "invoice" });
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { error } = await db.from("Invoice").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "deleted", entity: "invoice" });
  return NextResponse.json({ ok: true });
}
