import { QuoteForm } from "@/components/QuoteForm";

export const metadata = {
  title: "Get Quote"
};

export default function QuotePage() {
  return (
    <main className="bg-mist py-20">
      <div className="section-shell max-w-3xl">
        <h1 className="text-4xl font-bold text-navy md:text-5xl">Get Free Quote</h1>
        <p className="mt-4 text-lg leading-8 text-ink/70">Share your details and service interest. The team will review and respond with the next steps.</p>
        <QuoteForm />
      </div>
    </main>
  );
}
