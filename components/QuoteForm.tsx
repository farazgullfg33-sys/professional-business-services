"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/Button";
import { serviceOptions } from "@/lib/company";

export function QuoteForm() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const progress = (step / 4) * 100;
  return (
    <form
      className="glass-panel mt-10 rounded-lg p-6 shadow-soft"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        const response = await fetch("/api/quote", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
        if (response.ok) setDone(true);
      }}
    >
      <div className="h-2 rounded-full bg-panel"><motion.div className="h-2 rounded-full bg-gold" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} /></div>
      <p className="mt-3 text-sm font-semibold text-heading">Step {step} of 4</p>
      {done ? (
        <motion.div className="py-10 text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-semibold text-heading">Thank you</h2>
          <p className="mt-3 text-body">Your quote request has been saved.</p>
        </motion.div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
              {step === 1 ? (
                <div className="mt-6 grid gap-4">
                  <input name="name" required placeholder="Name" className="rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
                  <input name="email" required type="email" placeholder="Email" className="rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
                  <input name="phone" placeholder="Phone" className="rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
                  <input name="company" placeholder="Company (optional)" className="rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
                </div>
              ) : null}
              {step === 2 ? (
                <select name="serviceInterest" required className="mt-6 w-full rounded-md border border-edge bg-base px-4 py-3 text-heading transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                  <option value="">Select Service Interest</option>
                  {serviceOptions.map((service) => <option key={service}>{service}</option>)}
                </select>
              ) : null}
              {step === 3 ? <textarea name="message" placeholder="Additional Message" className="mt-6 h-40 w-full rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" /> : null}
              {step === 4 ? <p className="mt-6 rounded-md bg-panel p-5 text-body">Submit your quote request to Professional Business Services.</p> : null}
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</Button>
            {step < 4 ? <Button type="button" onClick={() => setStep((value) => Math.min(4, value + 1))}>Next</Button> : <Button type="submit">Submit</Button>}
          </div>
        </>
      )}
    </form>
  );
}
