"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
          <motion.article
            key={faq.question}
            className="glass-panel overflow-hidden rounded-lg transition-colors duration-300 hover:border-gold/40"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: Math.min(index, 10) * 0.04, duration: 0.5 }}
          >
            <button className="flex w-full items-center gap-4 px-5 py-5 text-left" onClick={() => setOpen(active ? -1 : index)}>
              <Icon className="h-5 w-5 shrink-0 text-gold" />
              <span className="flex-1 font-semibold text-heading">{faq.question}</span>
              <motion.span animate={{ rotate: active ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="h-5 w-5 text-heading" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {active ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className={cn("border-t border-edge px-5 py-5 leading-7 text-body")}>{faq.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.article>
        );
      })}
    </div>
  );
}
