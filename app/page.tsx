import Link from "next/link";
import { ArrowRight, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { HeroCanvas } from "@/components/HeroCanvas";
import { AITeamShowcase, DashboardPreview, HowItWorksFlow, LeadershipTeam, WhyAiInvention } from "@/components/home/HomeSections";
import { CardTilt, StatsCounter } from "@/components/motion/MotionScenes";
import { aiStats, company, serviceHighlights, testimonials } from "@/lib/company";

export default function HomePage() {
  const whatsappHref = `https://wa.me/${company.whatsapp.replace(/\D/g, "")}`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: company.name,
    telephone: company.phone,
    address: { "@type": "PostalAddress", streetAddress: company.address, addressCountry: "AE" },
    areaServed: "Abu Dhabi, United Arab Emirates",
    url: "https://pro.aiinvention.tech",
    sameAs: Object.values(company.social)
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <section className="relative overflow-hidden bg-base">
        <HeroCanvas />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base/10 via-base/60 to-base" />
        <div className="section-shell relative py-20 text-center sm:py-28 lg:py-36">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-glass px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Trusted PRO Services — 2026
          </p>
          <h1 className="mx-auto max-w-4xl font-heading text-4xl font-bold leading-tight text-heading sm:text-5xl md:text-6xl">
            Your Trusted Partner for <span className="gold-gradient">PRO Services in UAE</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-body sm:text-lg">
            Professional business setup, visa processing, and UAE government services — reviewed by our leadership at every step.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/quote">Get Free Consultation</Button>
            <Button href="/services" variant="outline">Our Services</Button>
          </div>
        </div>
        <div className="section-shell relative -mt-6 grid gap-5 rounded-lg border border-edge bg-glass p-6 shadow-soft backdrop-blur md:grid-cols-4">
          {aiStats.map((stat) => <StatsCounter key={stat.label} {...stat} />)}
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading eyebrow="Meet the Team" align="center" title="18 AI Agents, Purpose-Built for UAE PRO Work" copy="Every workflow — visas, licensing, compliance, attestation, finance — runs through a dedicated AI agent trained on UAE government processes, supervised by our leadership team." />
          <div className="mt-10">
            <AITeamShowcase />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading title="Services Built Around UAE Business Reality" copy="From the first trade name reservation to renewal calendars and visa files, every workflow is designed for clarity, speed, and compliant follow-through." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {serviceHighlights.map((service) => {
              const Icon = service.icon;
              return (
                <CardTilt key={service.title}>
                  <Icon className="h-10 w-10 text-gold" />
                  <h3 className="mt-5 font-heading text-xl font-semibold text-heading">{service.title}</h3>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-body">{service.description}</p>
                  <Link href={service.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold">
                    Learn More <ArrowRight size={16} />
                  </Link>
                </CardTilt>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-panel py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading align="center" title="How It Works" copy="A simple three-step flow from document upload to completed government approval." />
          <div className="mt-10">
            <HowItWorksFlow />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading eyebrow="Client Portal" title="A Real-Time View of Every Case" copy="Preview of the admin dashboard the team uses to track clients, quotes, invoices, and renewals — the same visibility your case gets from day one." />
          <div className="mt-10">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="bg-panel py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading align="center" title="Why Choose Us" copy="This isn't off-the-shelf automation — it's a proprietary AI operations layer only Professional Business Services can run." />
          <div className="mt-10">
            <WhyAiInvention />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading eyebrow="Leadership" align="center" title="The Team Behind the Cases" copy="Human leadership directing an 18-agent AI operations team." />
          <div className="mt-10">
            <LeadershipTeam />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="section-shell">
          <SectionHeading title="Client Feedback" copy="Placeholder testimonials showing the quote-style design requested for the launch build." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="glass-panel rounded-lg p-7 shadow-soft">
                <div className="flex gap-1 text-gold">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={17} fill="currentColor" />)}</div>
                <p className="mt-5 leading-7 text-body">&ldquo;{testimonial.text}&rdquo;</p>
                <h3 className="mt-6 font-heading font-semibold text-heading">{testimonial.name}</h3>
                <p className="text-sm text-muted">{testimonial.company}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-panel py-14 sm:py-20">
        <div className="section-shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-heading sm:text-3xl">Ready to Start Your Business in UAE?</h2>
            <p className="mt-3 text-body">Send the request and the team will review the right service route.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={whatsappHref} className="!bg-[#25D366] !text-white hover:!bg-[#1ebe59]"><MessageCircle size={18} /> WhatsApp Us</Button>
            <Button href="/quote">Get Free Quote</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
