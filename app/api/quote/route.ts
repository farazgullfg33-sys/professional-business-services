import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  // Merge service/serviceInterest
  const serviceInterest = body.serviceInterest || body.service || "";
  const data = { ...body, serviceInterest };
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  }
  await prisma.quoteRequest.create({ data: parsed.data });
  await prisma.lead.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      serviceInterest: parsed.data.serviceInterest,
      message: parsed.data.message,
      source: "website"
    }
  });
  return NextResponse.json({ ok: true });
}
