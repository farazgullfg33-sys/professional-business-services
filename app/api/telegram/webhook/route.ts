import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const db = createAdminClient();

  try {
    switch (command) {
      case "/status": {
        const [
          { count: clients },
          { count: services },
          { count: leads },
          { count: pendingInvoices }
        ] = await Promise.all([
          db.from("Client").select("*", { count: "exact", head: true }),
          db.from("ServiceRequest").select("*", { count: "exact", head: true }),
          db.from("Lead").select("*", { count: "exact", head: true }),
          db.from("Invoice").select("*", { count: "exact", head: true }).eq("status", "pending")
        ]);
        await sendTelegramMessage(
          chatId,
          `*Dashboard Summary*\nClients: ${clients ?? 0}\nActive Services: ${services ?? 0}\nLeads: ${leads ?? 0}\nPending Invoices: ${pendingInvoices ?? 0}`
        );
        break;
      }

      case "/clients": {
        const { data: clients } = await db
          .from("Client")
          .select("name, company, status")
          .order("createdAt", { ascending: false })
          .limit(5);
        const lines = (clients ?? []).map((c: { name: string; company?: string | null; status: string }) =>
          `- ${c.name}${c.company ? ` (${c.company})` : ""} - ${c.status}`
        );
        await sendTelegramMessage(chatId, `*Recent Clients*\n${lines.join("\n") || "No clients yet."}`);
        break;
      }

      case "/revenue": {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        const [{ data: monthInvoices }, { data: ytdInvoices }] = await Promise.all([
          db.from("Invoice").select("amount").eq("status", "paid").gte("paidAt", startOfMonth),
          db.from("Invoice").select("amount").eq("status", "paid").gte("paidAt", startOfYear)
        ]);
        const month = (monthInvoices ?? []).reduce((sum: number, i: { amount: number }) => sum + i.amount, 0);
        const ytd = (ytdInvoices ?? []).reduce((sum: number, i: { amount: number }) => sum + i.amount, 0);
        await sendTelegramMessage(chatId, `*Revenue*\nThis Month: AED ${month.toFixed(2)}\nYear to Date: AED ${ytd.toFixed(2)}`);
        break;
      }

      case "/tasks": {
        const nextWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
        const [
          { count: openServices },
          { count: pendingInvoices },
          { count: dueFollowUps }
        ] = await Promise.all([
          db.from("ServiceRequest").select("*", { count: "exact", head: true }).not("status", "in", '("completed","delivered")'),
          db.from("Invoice").select("*", { count: "exact", head: true }).eq("status", "pending"),
          db.from("FollowUp").select("*", { count: "exact", head: true }).eq("completed", false).lte("dueDate", nextWeek)
        ]);
        await sendTelegramMessage(
          chatId,
          `*Pending Tasks*\nOpen Services: ${openServices ?? 0}\nUnpaid Invoices: ${pendingInvoices ?? 0}\nFollow-ups Due (7d): ${dueFollowUps ?? 0}`
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
