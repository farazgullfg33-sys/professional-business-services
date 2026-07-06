import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  serviceInterest: z.string().min(1),
  message: z.string().optional().default("")
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
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
