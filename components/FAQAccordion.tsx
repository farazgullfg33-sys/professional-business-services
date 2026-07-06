"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/lib/company";
import { cn } from "@/lib/utils";

export function FAQAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mt-10 grid gap-4">
      {faqs.map((faq, index) => {
        const Icon = faq.icon;
        const active = open === index;
        return (
          <article key={faq.question} className="rounded-lg border border-navy/10 bg-white shadow-sm">
            <button className="flex w-full items-center gap-4 px-5 py-5 text-left" onClick={() => setOpen(active ? -1 : index)}>
              <Icon className="h-5 w-5 shrink-0 text-gold" />
              <span className="flex-1 font-semibold text-navy">{faq.question}</span>
              <ChevronDown className={cn("h-5 w-5 text-navy transition", active && "rotate-180")} />
            </button>
            {active ? <p className="border-t border-navy/10 px-5 py-5 leading-7 text-ink/70">{faq.answer}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
