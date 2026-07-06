"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bot, ChevronUp, Clock, Menu, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/Button";
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
    <div className="bg-navy py-2 text-sm text-white">
      <div className="section-shell flex flex-wrap items-center justify-center gap-x-6 gap-y-1 md:justify-between">
        <a className="inline-flex items-center gap-2" href={`tel:${company.phone.replace(/\s/g, "")}`}>
          <Phone size={15} /> {company.phone}
        </a>
        <span className="inline-flex items-center gap-2"><Clock size={15} /> Mon-Sat PRO Services in Abu Dhabi</span>
      </div>
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <div className="section-shell flex min-h-20 items-center justify-between gap-5">
        <Link href="/" className="flex max-w-[260px] items-center gap-3 text-lg font-bold leading-tight text-navy md:max-w-none">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-gold/50 bg-white shadow-sm">
            <Image src="/favicon.ico" alt="Professional Business Services logo" width={34} height={34} />
          </span>
          <span>Professional Business Services</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 lg:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-navy">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button href="/quote">Get Quote</Button>
        </div>
        <button className="focus-ring rounded-md p-2 text-navy lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-navy/10 bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-semibold text-navy hover:bg-mist" onClick={() => setOpen(false)}>
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
    <footer className="bg-navy text-white">
      <div className="section-shell grid gap-10 py-12 md:grid-cols-3">
        <div>
          <h2 className="text-xl font-semibold">{company.name}</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {Object.entries(company.social).map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-gold hover:text-gold">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gold">Working Hours</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {company.hours.map((hour) => <li key={hour}>{hour}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gold">Quick Links</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-white/75">
            {nav.slice(0, 5).map(([label, href]) => <Link key={href} href={href} className="hover:text-gold">{label}</Link>)}
            <Link href="/privacy-policy" className="hover:text-gold">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-gold">Terms & Conditions</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-white/70">{company.copyright}</div>
    </footer>
  );
}

export function FloatingWidgets() {
  const [chatOpen, setChatOpen] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {chatOpen ? (
        <div className="w-[min(360px,calc(100vw-40px))] rounded-lg border border-navy/10 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-navy"><Bot size={19} /> PRO Assistant</div>
            <button className="rounded p-1 text-ink/60 hover:bg-mist" onClick={() => setChatOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </div>
          <p className="mt-3 rounded-md bg-mist p-3 text-sm leading-6 text-ink/70">
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
            <input name="name" placeholder="Name" className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm" />
            <input name="phone" placeholder="Phone" className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm" />
            <textarea name="message" required placeholder="How can we help?" className="h-24 w-full rounded-md border border-navy/15 px-3 py-2 text-sm" />
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-3 py-2 text-sm font-semibold text-navy"><Send size={16} /> Send</button>
            {sent ? <p className="text-xs font-medium text-navy">Thanks. The conversation was saved.</p> : null}
          </form>
        </div>
      ) : null}
      <button className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-soft" onClick={() => setChatOpen((value) => !value)} aria-label="Open chatbot">
        {chatOpen ? <ChevronUp /> : <Bot />}
      </button>
    </div>
  );
}
