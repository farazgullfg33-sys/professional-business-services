import { CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { CardTilt, MapPulse } from "@/components/motion/MotionScenes";
import { serviceSections } from "@/lib/company";

export const metadata = {
  title: "Services"
};

export default function ServicesPage() {
  return (
    <main>
      <section className="bg-panel py-20">
        <div className="section-shell grid items-center gap-12 lg:grid-cols-[0.95fr_1fr]">
          <div>
            <h1 className="font-heading text-4xl font-bold text-heading md:text-5xl">Complete PRO & Business Services</h1>
            <p className="mt-5 text-lg leading-8 text-body">Government liaison, company formation, visas, licensing, compliance, attestation, and support workflows across the UAE.</p>
          </div>
          <MapPulse />
        </div>
      </section>
      {serviceSections.map((section, sectionIndex) => (
        <section key={section.id} id={section.id} className={sectionIndex % 2 ? "bg-panel py-20" : "py-20"}>
          <div className="section-shell">
            <SectionHeading title={section.title} />
            {section.style === "cards" ? (
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <CardTilt key={item}>
                    <CheckCircle2 className="h-8 w-8 text-gold" />
                    <h3 className="mt-4 text-lg font-semibold leading-7 text-heading">{item}</h3>
                  </CardTilt>
                ))}
              </div>
            ) : (
              <ul className="mt-10 grid gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item} className="glass-panel flex items-start gap-3 rounded-md p-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-gold" />
                    <span className="font-medium text-heading">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
