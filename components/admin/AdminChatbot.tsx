"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatEntry = { role: "user" | "assistant"; content: string };
type Mode = "chat" | "eligibility" | "checklist";
type ClientOption = { id: string; name: string; company?: string };

const modes: { key: Mode; label: string }[] = [
  { key: "chat", label: "Chat" },
  { key: "eligibility", label: "Eligibility" },
  { key: "checklist", label: "Checklist" }
];

const fieldClass = "w-full rounded-md border border-edge bg-base px-3 py-2 text-sm text-heading placeholder:text-muted focus:border-gold focus:outline-none";

export function AdminChatbot({ clients = [] }: { clients?: ClientOption[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatEntry[]>([
    { role: "assistant", content: "Hi, I'm the PRO AI assistant. Ask me anything, or switch to Eligibility / Checklist mode above." }
  ]);
  const [input, setInput] = useState("");
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (body: Record<string, unknown>, userLabel: string) => {
    setMessages((m) => [...m, { role: "user", content: userLabel }]);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: r.ok ? json.reply : `Error: ${json.error || "request failed"}` }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Error: could not reach the AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    run({ mode: "chat", message: text, history: messages.slice(-8) }, text);
  };

  const checkEligibility = () => {
    if (!clientId || !serviceType.trim() || loading) return;
    const client = clients.find((c) => c.id === clientId);
    run({ mode: "eligibility", clientId, serviceType: serviceType.trim() }, `Check eligibility: ${client?.name ?? "client"} for "${serviceType.trim()}"`);
  };

  const generateChecklist = () => {
    if (!serviceType.trim() || loading) return;
    run({ mode: "checklist", serviceType: serviceType.trim() }, `Document checklist for "${serviceType.trim()}"`);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="glass-panel flex h-[520px] w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden rounded-lg shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-edge px-4 py-3">
              <div className="flex items-center gap-2 font-heading font-semibold text-heading">
                <Sparkles size={17} className="text-gold" /> PRO AI Assistant
              </div>
              <button onClick={() => setOpen(false)} className="rounded p-1 text-muted hover:bg-panel" aria-label="Close chatbot">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1.5 border-b border-edge px-3 py-2">
              {modes.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    mode === m.key ? "border-gold/30 bg-gold/15 text-gold" : "border-transparent text-muted hover:border-edge hover:text-heading"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m, i) => (
                <div key={i} className={cn("max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm", m.role === "user" ? "ml-auto bg-gold/15 text-heading" : "bg-panel text-body")}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              )}
            </div>

            <div className="border-t border-edge p-3">
              {mode === "chat" && (
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                    placeholder="Ask a question..."
                    className={fieldClass}
                  />
                  <button onClick={sendChat} disabled={loading} className="flex shrink-0 items-center justify-center rounded-md bg-gold px-3 text-navy disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </div>
              )}

              {mode === "eligibility" && (
                <div className="grid gap-2">
                  <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={fieldClass}>
                    <option value="">Select client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Service e.g. Golden Visa" className={fieldClass} />
                    <button onClick={checkEligibility} disabled={loading} className="shrink-0 rounded-md bg-gold px-3 text-xs font-semibold text-navy disabled:opacity-50">Check</button>
                  </div>
                </div>
              )}

              {mode === "checklist" && (
                <div className="flex gap-2">
                  <input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Service e.g. Trade License Renewal" className={fieldClass} />
                  <button onClick={generateChecklist} disabled={loading} className="shrink-0 rounded-md bg-gold px-3 text-xs font-semibold text-navy disabled:opacity-50">Generate</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-navy shadow-gold"
        aria-label="Toggle PRO AI assistant"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </div>
  );
}
