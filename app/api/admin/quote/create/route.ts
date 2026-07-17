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
  const { clientId, docType, subject, clientRefId, referenceNo } = body;
  if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });

  const db = createAdminClient();
  const { data: client } = await db.from("Client").select("name, company, address, phone").eq("id", clientId).single();

  // New shape uses lineItems; legacy modal sends services/govFees/proFees.
  let items: LineItem[] = normalizeItems(body.lineItems);
  if (items.length === 0 && (body.services || body.proFees || body.govFees)) {
    const govFees = Number(body.govFees) || 0;
    const proFees = Number(body.proFees) || 0;
    items = [
      { description: String(body.services || "Professional Services"), quantity: 1, unitPrice: proFees, amount: proFees },
      { description: "Government / Authority Fees", quantity: 1, unitPrice: govFees, amount: govFees },
    ];
  }
  if (items.length === 0) return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });

  const total = sumAmount(items);
  const type = docType === "icv" ? "icv" : "quotation";
  const meta = {
    docType: type,
    ...clientSnapshot(client),
    subject: subject || (type === "icv" ? "ICV & ADNOC Pre-Qualification" : "Business Services Quotation"),
    clientRefId: clientRefId || "",
    referenceNo: referenceNo || "",
  };

  const { data: quote, error } = await db.from("Quote").insert({
    clientId,
    services: items.map((i) => i.description).join(", "),
    govFees: 0,
    proFees: total,
    total,
    status: "draft",
    lineItems: items,
    meta,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "invoice" });
  return NextResponse.json({ ok: true, quote });
}
