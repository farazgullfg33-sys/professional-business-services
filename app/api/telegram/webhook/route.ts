import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

const HELP_TEXT =
  "*PRO Admin Bot*\n/status — dashboard summary\n/clients — recent clients\n/revenue — month/YTD revenue\n/tasks — pending tasks\n/help — this message";

export async function POST(request: Request) {
  const update = await request.json();
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text = typeof message?.text === "string" ? message.text.trim() : "";

  if (!chatId || !text) return NextResponse.json({ ok: true });

  const command = text.split(/\s+/)[0].toLowerCase();

  try {
    switch (command) {
      case "/status": {
        const [clients, services, leads, pendingInvoices] = await Promise.all([
          prisma.client.count(),
          prisma.serviceRequest.count(),
          prisma.lead.count(),
          prisma.invoice.count({ where: { status: "pending" } })
        ]);
        await sendTelegramMessage(
          chatId,
          `*Dashboard Summary*\nClients: ${clients}\nActive Services: ${services}\nLeads: ${leads}\nPending Invoices: ${pendingInvoices}`
        );
        break;
      }

      case "/clients": {
        const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
        const lines = clients.map((c: { name: string; company?: string | null; status: string }) => `- ${c.name}${c.company ? ` (${c.company})` : ""} - ${c.status}`);
        await sendTelegramMessage(chatId, `*Recent Clients*\n${lines.join("\n") || "No clients yet."}`);
        break;
      }

      case "/revenue": {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const [monthInvoices, ytdInvoices] = await Promise.all([
          prisma.invoice.findMany({ where: { status: "paid", paidAt: { gte: startOfMonth } }, select: { amount: true } }),
          prisma.invoice.findMany({ where: { status: "paid", paidAt: { gte: startOfYear } }, select: { amount: true } })
        ]);
        const month = monthInvoices.reduce((sum: number, i: { amount: number }) => sum + i.amount, 0);
        const ytd = ytdInvoices.reduce((sum: number, i: { amount: number }) => sum + i.amount, 0);
        await sendTelegramMessage(chatId, `*Revenue*\nThis Month: AED ${month.toFixed(2)}\nYear to Date: AED ${ytd.toFixed(2)}`);
        break;
      }

      case "/tasks": {
        const [openServices, pendingInvoices, dueFollowUps] = await Promise.all([
          prisma.serviceRequest.count({ where: { status: { notIn: ["completed", "delivered"] } } }),
          prisma.invoice.count({ where: { status: "pending" } }),
          prisma.followUp.count({ where: { completed: false, dueDate: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) } } })
        ]);
        await sendTelegramMessage(
          chatId,
          `*Pending Tasks*\nOpen Services: ${openServices}\nUnpaid Invoices: ${pendingInvoices}\nFollow-ups Due (7d): ${dueFollowUps}`
        );
        break;
      }

      case "/help":
      case "/start":
      default:
        await sendTelegramMessage(chatId, HELP_TEXT);
    }
  } catch (error) {
    console.error("Telegram webhook error", error);
  }

  return NextResponse.json({ ok: true });
}
