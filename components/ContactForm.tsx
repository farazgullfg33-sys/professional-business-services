"use client";

import { useState } from "react";
import { MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  return (
    <div className="glass-panel rounded-lg p-6 shadow-soft">
      <div className="relative mb-6 flex h-28 items-center justify-center overflow-hidden rounded-md bg-panel">
        <motion.span className="absolute h-16 w-16 rounded-full border-2 border-gold" animate={{ scale: [0.8, 2.4], opacity: [0.7, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <MapPin className="relative z-10 h-10 w-10 text-gold" />
      </div>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setStatus("idle");
          const form = event.currentTarget;
          const data = Object.fromEntries(new FormData(form));
          const response = await fetch("/api/contact", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
          if (response.ok) {
            form.reset();
            setStatus("sent");
          } else {
            setStatus("error");
          }
        }}
      >
        <input name="name" placeholder="Name" className="w-full rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
        <input name="email" required type="email" placeholder="Email" className="w-full rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
        <input name="phone" placeholder="Phone" className="w-full rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
        <textarea name="message" required placeholder="Message" className="h-36 w-full rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
        <Button type="submit"><Send size={18} /> Submit</Button>
        {status === "sent" ? <p className="text-sm font-semibold text-gold">Thank you. Your message has been saved.</p> : null}
        {status === "error" ? <p className="text-sm font-semibold text-red-400">Something went wrong. Please try again.</p> : null}
      </form>
    </div>
  );
}
