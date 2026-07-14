import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";
import { sendClientStatusUpdate } from "@/lib/whatsapp";

const allowedStatuses = ["new", "in_progress", "review", "completed", "delivered"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await request.json();
  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: service, error } = await db
    .from("ServiceRequest")
    .update({ status })
    .eq("id", params.id)
    .select("*, Client(name, phone)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "updated", entity: "service" });

  if (service?.Client?.phone) {
    sendClientStatusUpdate(
      service.Client.phone,
      service.Client.name,
      service.serviceType,
      status
    ).catch((err: Error) => console.error("WhatsApp status notification failed", err));
  }

  return NextResponse.json({ ok: true, service });
}
