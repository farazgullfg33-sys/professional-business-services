import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { SectionHeading } from "@/components/SectionHeading";
import { company } from "@/lib/company";

export const metadata = {
  title: "Contact"
};

export default function ContactPage() {
  return (
    <main>
      <section className="bg-mist py-20">
        <div className="section-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading title="Contact Professional Business Services" copy="Reach the Abu Dhabi office for consultation, document review, quote requests, or urgent PRO follow-up." />
            <div className="mt-8 space-y-4">
              <a className="flex gap-3 rounded-lg bg-white p-5 shadow-soft" href={`tel:${company.phone.replace(/\s/g, "")}`}><Phone className="text-gold" /> <span>{company.phone}</span></a>
              <a className="flex gap-3 rounded-lg bg-white p-5 shadow-soft" href={`tel:${company.phone2.replace(/\s/g, "")}`}><Phone className="text-gold" /> <span>{company.phone2}</span></a>
              <a className="flex gap-3 rounded-lg bg-white p-5 shadow-soft" href={`mailto:${company.email}`}><Mail className="text-gold" /> <span>{company.email}</span></a>
              <div className="flex gap-3 rounded-lg bg-white p-5 shadow-soft"><MapPin className="shrink-0 text-gold" /> <span>{company.address}</span></div>
            </div>
            <div className="mt-8 rounded-lg bg-white p-5 shadow-soft">
              <h2 className="font-semibold text-navy">Working Hours</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/70">{company.hours.map((hour) => <li key={hour}>{hour}</li>)}</ul>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
      <section className="section-shell py-16">
        <iframe
          title="Electra Street Abu Dhabi Map"
          src="https://www.google.com/maps?q=Electra%20Street%20Abu%20Dhabi&output=embed"
          className="h-[380px] w-full rounded-lg border-0 shadow-soft"
          loading="lazy"
        />
      </section>
    </main>
  );
}
