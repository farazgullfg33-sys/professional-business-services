import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { DashboardPreview, HowItWorksFlow, LeadershipTeam, WhyChooseUs } from "@/components/home/HomeSections";
import { CardTilt, Reveal, ScrollCue, TestimonialCarousel, TypingText } from "@/components/motion/MotionScenes";
import { company, serviceHighlights, teamStats, testimonials } from "@/lib/company";

const HeroScene = dynamic(
  () => import("@/components/3d/HeroScene").then((m) => m.HeroScene),
  { ssr: false }
);

const ServiceCard3D = dynamic(
  () => import("@/components/3d/ServiceCard3D").then((m) => m.ServiceCard3D),
  { ssr: false }
);

const Stats3D = dynamic(
  () => import("@/components/3d/Stats3D").then((m) => m.Stats3D),
  { ssr: false }
);

const ParticleField = dynamic(
  () => import("@/components/3d/ParticleField").then((m) => m.ParticleField),
  { ssr: false }
);

// Map service titles to 3D icon types
const SERVICE_ICON_MAP: Record<string, string> = {
  "Company Formation": "building",
  "Visa Processing": "passport",
  "Document Attestation": "certificate",
  "Government Liaison": "shield",
  "MOHRE & Labour": "document",
  "Compliance": "gear",
  "Finance & Billing": "coin"
};

export default function HomePage() {
  const whatsappHref = `https://wa.me/${company.whatsapp.replace(/\D/g, "")}`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: company.name,
    telephone: company.phone,
    address: { "@type": "PostalAddress", streetAddress: company.address, addressCountry: "AE" },
    areaServed: "Abu Dhabi, United Arab Emirates",
    url: "https://professionalbusines.com",
    sameAs: Object.values(company.social)
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-base">
        <HeroScene />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base/10 via-base/60 to-base" />
        <div className="section-shell relative py-20 text-center sm:py-28 lg:py-36">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-glass px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Trusted PRO Services — Abu Dhabi, UAE
          </p>
          <h1 className="mx-auto max-w-4xl font-heading text-4xl font-bold leading-tight text-heading sm:text-5xl md:text-6xl">
            Your UAE <TypingText text="PRO Services Partner" className="text-gold" />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-body sm:text-lg">
            Company formation, visa processing, and government liaison — handled by experienced PRO officers in Abu Dhabi.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/quote">Get Free Consultation</Button>
            <Button href="/services" variant="outline">Our Services</Button>
          </div>
          <ScrollCue />
        </div>
        {/* Stats Bar — 3D coin counters */}
        <div className="section-shell relative -mt-6 grid gap-5 rounded-lg border border-edge bg-glass p-6 shadow-soft backdrop-blur md:grid-cols-4">
          {teamStats.map((stat, i) => (
            <Stats3D key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} coinCount={3 + i} />
          ))}
        </div>
      </section>

      {/* Services Grid — 3D cards */}
      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Our Services"
            title="Complete PRO Services Under One Roof"
            copy="From company formation to visa processing and government liaison — every service handled by experienced PRO officers."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {serviceHighlights.map((service) => {
              const Icon = service.icon;
              const iconType = Object.entries(SERVICE_ICON_MAP).find(([key]) =>
                service.title.includes(key)
              )?.[1] ?? "document";
              return (
                <ServiceCard3D key={service.title} iconType={iconType}>
                  <h3 className="font-heading text-xl font-semibold text-heading">{service.title}</h3>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-body">{service.description}</p>
                  <Link href={service.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold transition-transform duration-300 group-hover:translate-x-1">
                    Learn More <ArrowRight size={16} />
                  </Link>
                </ServiceCard3D>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-panel py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading
            align="center"
            title="Why Professional Business Services"
            copy="Deep expertise, physical presence in Abu Dhabi, and a dedicated team that handles your entire file from start to finish."
          />
          <div className="mt-10">
            <WhyChooseUs />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading align="center" title="How It Works" copy="A simple three-step process from document submission to completed government approval." />
          <div className="mt-10">
            <HowItWorksFlow />
          </div>
        </div>
      </section>

      {/* Client Portal Preview */}
      <section className="bg-panel py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Client Portal"
            title="Real-Time Visibility on Every Case"
            copy="Track your applications, quotes, invoices, and renewals through our client dashboard — the same tools our PRO officers use daily."
          />
          <div className="mt-10">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Leadership"
            align="center"
            title="The Team Behind Your Case"
            copy="Led by Muhammad Waqas, our experienced PRO team handles every file with precision and professionalism."
          />
          <div className="mt-10">
            <LeadershipTeam />
          </div>
        </div>
      </section>

      {/* Client Results — with particle field background */}
      <section className="relative bg-panel py-16 sm:py-24 overflow-hidden">
        <ParticleField className="absolute inset-0" />
        <div className="section-shell relative z-10">
          <SectionHeading
            align="center"
            title="Client Results"
            copy="Real numbers from our work across Abu Dhabi and the UAE."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {[
              { value: 100, suffix: "+", label: "Companies Formed" },
              { value: 5000, suffix: "+", label: "Visas Processed" },
              { value: 98, suffix: "%", label: "First-Time Approval" },
              { value: 15, suffix: "+ Yrs", label: "Combined Experience" }
            ].map((item, index) => (
              <Reveal key={item.label} delay={index * 0.08} className="glass-panel rounded-lg p-6 text-center shadow-soft">
                <Stats3D value={item.value} suffix={item.suffix} label={item.label} coinCount={4} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading eyebrow="Client Voices" align="center" title="What Our Clients Say" copy="Feedback from business owners we've supported across Abu Dhabi and the UAE." />
          <Reveal className="mx-auto mt-10 max-w-2xl" delay={0.1}>
            <TestimonialCarousel items={testimonials} />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <Reveal className="section-shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-heading sm:text-3xl">Ready to Start Your Business in UAE?</h2>
            <p className="mt-3 text-body">Send your request and our team will prepare the right service package for you.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={whatsappHref} className="!bg-[#25D366] !text-white hover:!bg-[#1ebe59]"><MessageCircle size={18} /> WhatsApp Us</Button>
            <Button href="/quote">Get Free Quote</Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
