async function sendWhatsAppMessage(to: string, payload: Record<string, unknown>) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured");

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...payload })
  });

  if (!res.ok) throw new Error(`WhatsApp send failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

export async function sendWhatsAppText(to: string, body: string) {
  return sendWhatsAppMessage(to, { type: "text", text: { body } });
}

export async function sendClientStatusUpdate(to: string, clientName: string, serviceType: string, status: string) {
  const statusLabel = status.replace(/_/g, " ");
  const body = `Hello ${clientName}, your "${serviceType}" request has been updated to: ${statusLabel}. Reply STATUS anytime for the latest update. — Professional Business Services`;
  return sendWhatsAppText(to, body);
}
