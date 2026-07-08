export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callDeepSeek(messages: ChatMessage[]) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured on the server");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.4,
      max_tokens: 700
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${detail.slice(0, 200)}`);
  }

  const json = await response.json();
  const reply = json.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("DeepSeek returned an empty response");
  return reply;
}
