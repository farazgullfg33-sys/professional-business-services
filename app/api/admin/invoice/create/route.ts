import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";
import { normalizeItems, sumAmount, clientSnapshot, type LineItem } from "@/lib/documents";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { clientId, quoteId, customerId, referenceNo, purpose, paymentMethod, status } = body;

  const db = createAdminClient();

  // Legacy path: create straight from an existing quote's amount.
  let items: LineItem[] = normalizeItems(body.lineItems);
  if (items.length === 0 && quoteId && body.amount) {
    items = [{ description: purpose || "PRO Services", quantity: 1, unitPrice: Number(body.amount) || 0, amount: Number(body.amount) || 0 }];
  }
  if (!clientId && !quoteId) return NextResponse.json({ error: "clientId or quoteId is required" }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });

  // Resolve the client (directly, or via the quote) for the meta snapshot.
  let resolvedClientId = clientId as string | undefined;
  if (!resolvedClientId && quoteId) {
    const { data: q } = await db.from("Quote").select("clientId").eq("id", quoteId).single();
    resolvedClientId = q?.clientId;
  }
  const { data: client } = resolvedClientId
    ? await db.from("Client").select("name, company, address, phone").eq("id", resolvedClientId).single()
    : { data: null };

  const amount = sumAmount(items);
  const meta = {
    docType: "invoice",
    ...clientSnapshot(client),
    customerId: customerId || "",
    referenceNo: referenceNo || "",
    purpose: purpose || "",
  };

  const { data: invoice, error } = await db.from("Invoice").insert({
    quoteId: quoteId || null,
    clientId: resolvedClientId || null,
    amount,
    status: status || "pending",
    paymentMethod: paymentMethod || "Bank Transfer",
    lineItems: items,
    meta,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "invoice" });
  return NextResponse.json({ ok: true, invoice });
}
