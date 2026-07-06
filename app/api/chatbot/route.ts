import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  message: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chatbot message" }, { status: 400 });
  }
  const messages = JSON.stringify([
    { role: "user", content: parsed.data.message, at: new Date().toISOString() },
    {
      role: "assistant",
      content: "Thank you. Our team can help with PRO, visa, company formation, attestation, and license services.",
      at: new Date().toISOString()
    }
  ]);
  await prisma.chatbotConversation.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      messages,
      lead: Boolean(parsed.data.phone || parsed.data.email)
    }
  });
  // Also create a Lead if contact info provided
  if (parsed.data.phone || parsed.data.email) {
    await prisma.lead.create({
      data: {
        name: parsed.data.name || "Chatbot Lead",
        phone: parsed.data.phone,
        email: parsed.data.email,
        message: parsed.data.message,
        serviceInterest: "Chatbot Inquiry",
        source: "chatbot"
      }
    });
  }
  return NextResponse.json({ ok: true });
}
