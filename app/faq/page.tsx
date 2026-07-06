import { FAQAccordion } from "@/components/FAQAccordion";
import { faqs } from "@/lib/company";

export const metadata = {
  title: "FAQ"
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
    <main className="bg-mist py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="section-shell">
        <h1 className="text-4xl font-bold text-navy md:text-5xl">Frequently Asked Questions</h1>
        <FAQAccordion />
      </div>
    </main>
  );
}
