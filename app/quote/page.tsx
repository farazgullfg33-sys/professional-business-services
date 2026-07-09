import { QuoteForm } from "@/components/QuoteForm";
import { Reveal } from "@/components/motion/MotionScenes";

export const metadata = {
  title: "Get Quote",
  description: "Request a free quote from Professional Business Services for company formation, visa processing, licensing, or PRO services in the UAE."
};

export default function QuotePage() {
  return (
    <main className="bg-panel py-20">
      <div className="section-shell max-w-3xl">
        <Reveal>
          <h1 className="font-heading text-4xl font-bold text-heading md:text-5xl">Get Free Quote</h1>
          <p className="mt-4 text-lg leading-8 text-body">Share your details and service interest. The team will review and respond with the next steps.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <QuoteForm />
        </Reveal>
      </div>
    </main>
  );
}
