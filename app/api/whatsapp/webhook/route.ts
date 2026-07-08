import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from as string | undefined;
    const text = (message?.text?.body as string | undefined)?.trim().toLowerCase();

    if (from && text === "status") {
      const client = await prisma.client.findFirst({
        where: { phone: { contains: from.slice(-9) } },
        include: { services: { orderBy: { createdAt: "desc" }, take: 1 } }
      });
      const latest = client?.services[0];
      const reply = latest
        ? `Hi ${client!.name}, your "${latest.serviceType}" request is currently: ${latest.status.replace(/_/g, " ")}.`
        : "We couldn't find an active request for this number. Please contact our office directly.";
      await sendWhatsAppText(from, reply);
    }
  } catch (error) {
    console.error("WhatsApp webhook error", error);
  }

  return NextResponse.json({ ok: true });
}
