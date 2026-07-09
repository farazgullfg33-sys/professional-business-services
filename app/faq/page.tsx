import { FAQAccordion } from "@/components/FAQAccordion";
import { Reveal } from "@/components/motion/MotionScenes";
import { faqs } from "@/lib/company";

export const metadata = {
  title: "FAQ",
  description: "Answers to common questions about UAE company formation, visa processing, trade licenses, document attestation, and PRO services."
};

export default function FAQPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  };

  return (
    <main className="bg-panel py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="section-shell">
        <Reveal>
          <h1 className="font-heading text-4xl font-bold text-heading md:text-5xl">Frequently Asked Questions</h1>
        </Reveal>
        <FAQAccordion />
      </div>
    </main>
  );
}
