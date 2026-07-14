import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  service: z.string().optional().default(""),
  serviceInterest: z.string().optional().default(""),
  message: z.string().optional().default("")
});

export async function POST(request: Request) {
  const body = await request.json();
  const serviceInterest = body.serviceInterest || body.service || "";
  const data = { ...body, serviceInterest };
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  }

  const db = createAdminClient();
  await Promise.all([
    db.from("QuoteRequest").insert(parsed.data),
    db.from("Lead").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      serviceInterest: parsed.data.serviceInterest,
      message: parsed.data.message,
      source: "website"
    })
  ]);

  return NextResponse.json({ ok: true });
}
