"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { serviceOptions } from "@/lib/company";

export function QuoteForm() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const progress = (step / 4) * 100;
  return (
    <form
      className="mt-10 rounded-lg border border-navy/10 bg-white p-6 shadow-soft"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        const response = await fetch("/api/quote", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
        if (response.ok) setDone(true);
      }}
    >
      <div className="h-2 rounded-full bg-mist"><div className="h-2 rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
      <p className="mt-3 text-sm font-semibold text-navy">Step {step} of 4</p>
      {done ? (
        <div className="py-10 text-center">
          <h2 className="text-2xl font-semibold text-navy">Thank you</h2>
          <p className="mt-3 text-ink/70">Your quote request has been saved.</p>
        </div>
      ) : (
        <>
          {step === 1 ? (
            <div className="mt-6 grid gap-4">
              <input name="name" required placeholder="Name" className="rounded-md border border-navy/15 px-4 py-3" />
              <input name="email" required type="email" placeholder="Email" className="rounded-md border border-navy/15 px-4 py-3" />
              <input name="phone" placeholder="Phone" className="rounded-md border border-navy/15 px-4 py-3" />
              <input name="company" placeholder="Company (optional)" className="rounded-md border border-navy/15 px-4 py-3" />
            </div>
          ) : null}
          {step === 2 ? (
            <select name="serviceInterest" required className="mt-6 w-full rounded-md border border-navy/15 px-4 py-3">
              <option value="">Select Service Interest</option>
              {serviceOptions.map((service) => <option key={service}>{service}</option>)}
            </select>
          ) : null}
          {step === 3 ? <textarea name="message" placeholder="Additional Message" className="mt-6 h-40 w-full rounded-md border border-navy/15 px-4 py-3" /> : null}
          {step === 4 ? <p className="mt-6 rounded-md bg-mist p-5 text-ink/70">Submit your quote request to Professional Business Services.</p> : null}
          <div className="mt-6 flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</Button>
            {step < 4 ? <Button type="button" onClick={() => setStep((value) => Math.min(4, value + 1))}>Next</Button> : <Button type="submit">Submit</Button>}
          </div>
        </>
      )}
    </form>
  );
}
