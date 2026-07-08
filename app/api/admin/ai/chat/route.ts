import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callDeepSeek, type ChatMessage } from "@/lib/deepseek";

const SYSTEM_PROMPT =
  "You are the internal AI assistant for Professional Business Services, a PRO office handling UAE company formation, visa processing, trade licensing, attestation, and compliance. You help staff (not clients) answer questions, assess client eligibility for services, and generate document checklists. Be concise, use short bullet points, and note when a government portal (Tamm, MOHRE, ICP, GDRFA, Tas'heel, DED, ADDED, FTA, MOFA) confirmation is required before finalizing.";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const mode = body.mode || "chat";

  try {
    if (mode === "eligibility") {
      const { clientId, serviceType } = body;
      if (!clientId || !serviceType) return NextResponse.json({ error: "clientId and serviceType required" }, { status: 400 });

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { services: { select: { serviceType: true, status: true } } }
      });
      if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

      const profile = [
        `Name: ${client.name}`,
        `Company: ${client.company || "N/A"}`,
        `Business type: ${client.businessType || "N/A"}`,
        `Source: ${client.source || "N/A"}`,
        `Existing services: ${client.services.map((s: { serviceType: string; status: string }) => `${s.serviceType} (${s.status})`).join(", ") || "None"}`
      ].join("\n");

      const reply = await callDeepSeek([
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Assess this client's eligibility for "${serviceType}" based on their profile:\n${profile}\n\nGive a clear verdict (Eligible / Likely Eligible / Not Eligible / Needs More Info), 2-4 bullet reasons, and any missing information needed to confirm.`
        }
      ]);

      return NextResponse.json({ reply });
    }

    if (mode === "checklist") {
      const { serviceType } = body;
      if (!serviceType) return NextResponse.json({ error: "serviceType required" }, { status: 400 });

      const reply = await callDeepSeek([
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a document checklist for a UAE PRO service request: "${serviceType}". List each required document as a short bullet, grouped under "Client-provided" and "Prepared by us" where relevant.`
        }
      ]);

      return NextResponse.json({ reply });
    }

    const { message, history } = body;
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    const priorTurns = (Array.isArray(history) ? history : []).slice(-8) as ChatMessage[];
    const reply = await callDeepSeek([{ role: "system", content: SYSTEM_PROMPT }, ...priorTurns, { role: "user", content: message }]);

    return NextResponse.json({ reply });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
