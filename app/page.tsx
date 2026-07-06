import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { CardTilt, HeroMotion, ServiceIconPulse, StatsCounter, WaveBackground } from "@/components/motion/MotionScenes";
import { company, serviceHighlights, testimonials, whyChooseUs } from "@/lib/company";

export default function HomePage() {
  return (
    <main>
      <section className="bg-white">
        <div className="section-shell grid items-center gap-8 py-8 sm:py-12 lg:min-h-[calc(100vh-140px)] lg:grid-cols-[1fr_0.9fr]">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-navy sm:text-4xl md:text-6xl">
              Your Trusted Partner for <span className="gold-gradient">PRO Services in UAE</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:mt-6 sm:text-lg sm:leading-8">
              Professional business setup, visa processing, and UAE government services support
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              <Button href="/quote">Get Free Consultation</Button>
              <Button href="/services" variant="outline">Our Services</Button>
            </div>
          </div>
          <HeroMotion />
        </div>
        <div className="section-shell -mt-4 grid gap-5 rounded-lg border border-navy/10 bg-white p-6 shadow-soft md:grid-cols-4">
          {company.stats.map((stat) => <StatsCounter key={stat.label} {...stat} />)}
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="section-shell">
          <SectionHeading title="Services Built Around UAE Business Reality" copy="From the first trade name reservation to renewal calendars and visa files, every workflow is designed for clarity, speed, and compliant follow-through." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {serviceHighlights.map((service) => {
              const Icon = service.icon;
              return (
                <CardTilt key={service.title}>
                  <Icon className="h-10 w-10 text-gold" />
                  <h3 className="mt-5 text-xl font-semibold text-navy">{service.title}</h3>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-ink/65">{service.description}</p>
                  <Link href={service.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy">
                    Learn More <ArrowRight size={16} />
                  </Link>
                </CardTilt>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-mist py-12 sm:py-20">
        <div className="section-shell">
          <SectionHeading align="center" title="Why Choose Us" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {whyChooseUs.map((item) => {
              const Icon = item.icon;
              return (
                <ServiceIconPulse key={item.title}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gold/15 text-gold transition group-hover:scale-110">
                    <Icon />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-navy">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink/65">Reliable guidance, document discipline, and timely communication for every file.</p>
                </ServiceIconPulse>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="section-shell">
          <SectionHeading title="Client Feedback" copy="Placeholder testimonials showing the quote-style design requested for the launch build." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-lg border border-navy/10 bg-white p-7 shadow-soft">
                <div className="flex gap-1 text-gold">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={17} fill="currentColor" />)}</div>
                <p className="mt-5 leading-7 text-ink/70">&ldquo;{testimonial.text}&rdquo;</p>
                <h3 className="mt-6 font-semibold text-navy">{testimonial.name}</h3>
                <p className="text-sm text-ink/55">{testimonial.company}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <WaveBackground />
      <section className="bg-mist py-12 sm:py-16">
        <div className="section-shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-navy sm:text-3xl">Ready to Start Your Business in UAE?</h2>
            <p className="mt-3 text-ink/65">Send the request and the team will review the right service route.</p>
          </div>
          <Button href="/quote">Get Free Quote</Button>
        </div>
      </section>
    </main>
  );
}
