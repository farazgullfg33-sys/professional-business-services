"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, ChevronUp, Clock, MapPin, Menu, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { company } from "@/lib/company";

const nav = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["CEO Message", "/ceo-message"],
  ["Contact", "/contact"],
  ["Blog", "/blog"]
];

export function TopBar() {
  return (
    <div className="border-b border-white/10 bg-navy py-2 text-sm text-white">
      <div className="section-shell flex flex-wrap items-center justify-center gap-x-6 gap-y-1 md:justify-between">
        <a className="inline-flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm" href={`tel:${company.phone.replace(/\s/g, "")}`}>
          <Phone size={14} className="sm:h-[15px] sm:w-[15px]" /> {company.phone}
        </a>
        <span className="hidden text-xs text-white/70 sm:inline-flex sm:items-center sm:gap-2 sm:text-sm"><Clock size={15} /> Mon-Sat PRO Services in Abu Dhabi</span>
      </div>
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy shadow-soft">
      <div className="section-shell flex min-h-20 items-center justify-between gap-5">
        <Link href="/" className="flex max-w-[200px] items-center gap-2 text-base font-heading font-bold leading-tight text-white sm:max-w-none sm:gap-3 sm:text-lg">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/50 bg-white shadow-sm sm:h-12 sm:w-12">
            <Image src="/favicon.ico" alt="Logo" width={30} height={30} className="sm:h-[34px] sm:w-[34px]" />
          </span>
          <span className="sm:hidden">PRO Services</span>
          <span className="hidden sm:inline">Professional Business Services</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 lg:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-gold">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Button href="/quote">Get Quote</Button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button className="focus-ring rounded-md p-2 text-white" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-navy-dark px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10" onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Button href="/quote" className="mt-2">Get Quote</Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy text-white">
      <div className="section-shell grid gap-10 py-12 md:grid-cols-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">{company.name}</h2>
          <p className="mt-3 flex items-start gap-2 text-sm text-white/75">
            <MapPin size={15} className="mt-0.5 shrink-0 text-gold" />
            {company.address}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(company.social).map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-gold hover:text-gold">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold text-gold">Working Hours</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {company.hours.map((hour) => <li key={hour}>{hour}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold text-gold">Quick Links</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-white/75">
            {nav.slice(0, 5).map(([label, href]) => <Link key={href} href={href} className="hover:text-gold">{label}</Link>)}
            <Link href="/privacy-policy" className="hover:text-gold">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-gold">Terms & Conditions</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-white/70">
        <p>{company.copyright}</p>
      </div>
    </footer>
  );
}

export function FloatingWidgets() {
  const [chatOpen, setChatOpen] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {chatOpen ? (
        <div className="glass-panel w-[min(360px,calc(100vw-40px))] rounded-lg p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-heading"><Bot size={19} /> PRO Assistant</div>
            <button className="rounded p-1 text-muted hover:bg-panel" onClick={() => setChatOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </div>
          <p className="mt-3 rounded-md bg-panel p-3 text-sm leading-6 text-body">
            Ask about PRO, visa, company formation, attestation, or license renewal services.
          </p>
          <form
            className="mt-4 space-y-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              await fetch("/api/chatbot", { method: "POST", body: JSON.stringify(Object.fromEntries(data)), headers: { "Content-Type": "application/json" } });
              form.reset();
              setSent(true);
            }}
          >
            <input name="name" placeholder="Name" className="w-full rounded-md border border-edge bg-base px-3 py-2 text-sm text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <input name="phone" placeholder="Phone" className="w-full rounded-md border border-edge bg-base px-3 py-2 text-sm text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <textarea name="message" required placeholder="How can we help?" className="h-24 w-full rounded-md border border-edge bg-base px-3 py-2 text-sm text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-3 py-2 text-sm font-semibold text-navy transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"><Send size={16} /> Send</button>
            {sent ? <p className="text-xs font-medium text-gold">Thanks. The conversation was saved.</p> : null}
          </form>
        </div>
      ) : null}
      <div className="relative">
        {!chatOpen ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-gold/50"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            aria-hidden="true"
          />
        ) : null}
        <motion.button
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gold text-navy shadow-gold"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setChatOpen((value) => !value)}
          aria-label="Open chatbot"
        >
          {chatOpen ? <ChevronUp /> : <Bot />}
        </motion.button>
      </div>
    </div>
  );
}
