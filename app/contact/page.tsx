import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/motion/MotionScenes";
import { company } from "@/lib/company";

export const metadata = {
  title: "Contact",
  description: "Contact Professional Business Services in Abu Dhabi for PRO services, visa processing, company formation, and government liaison consultations."
};

export default function ContactPage() {
  return (
    <main>
      <section className="bg-panel py-20">
        <div className="section-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal x={-16} y={0}>
            <SectionHeading title="Contact Professional Business Services" copy="Reach the Abu Dhabi office for consultation, document review, quote requests, or urgent PRO follow-up." />
            <div className="mt-8 space-y-4">
              <a className="glass-panel flex gap-3 rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50" href={`tel:${company.phone.replace(/\s/g, "")}`}><Phone className="text-gold" /> <span className="text-heading">{company.phone}</span></a>
              <a className="glass-panel flex gap-3 rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50" href={`tel:${company.phone2.replace(/\s/g, "")}`}><Phone className="text-gold" /> <span className="text-heading">{company.phone2}</span></a>
              <a className="glass-panel flex gap-3 rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50" href={`mailto:${company.email}`}><Mail className="text-gold" /> <span className="text-heading">{company.email}</span></a>
              <div className="glass-panel flex gap-3 rounded-lg p-5"><MapPin className="shrink-0 text-gold" /> <span className="text-heading">{company.address}</span></div>
            </div>
            <div className="glass-panel mt-8 rounded-lg p-5">
              <h2 className="font-heading font-semibold text-heading">Working Hours</h2>
              <ul className="mt-3 space-y-2 text-sm text-body">{company.hours.map((hour) => <li key={hour}>{hour}</li>)}</ul>
            </div>
          </Reveal>
          <Reveal x={16} y={0} delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
      <Reveal as="div" className="section-shell py-16">
        <iframe
          title="Electra Street Abu Dhabi Map"
          src="https://www.google.com/maps?q=Electra%20Street%20Abu%20Dhabi&output=embed"
          className="h-[380px] w-full rounded-lg border-0 shadow-soft"
          loading="lazy"
        />
      </Reveal>
    </main>
  );
}
