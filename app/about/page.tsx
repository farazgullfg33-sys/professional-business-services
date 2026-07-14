import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { ParallaxWrap, Reveal, TimelineMotion } from "@/components/motion/MotionScenes";
import { aboutParagraphs, company, leadershipTeam } from "@/lib/company";

const Stats3D = dynamic(
  () => import("@/components/3d/Stats3D").then((m) => m.Stats3D),
  { ssr: false }
);

export const metadata = {
  title: "About Us",
  description: "Learn about Professional Business Services — a PRO services team in Abu Dhabi handling company formation, visa processing, and UAE government liaison work."
};

export default function AboutPage() {
  return (
    <main>
      <section className="bg-panel py-20">
        <div className="section-shell grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading title="About Professional Business Services" />
            <div className="mt-8 space-y-6 text-base leading-8 text-body">
              {aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <TimelineMotion />
        </div>
      </section>
      <section className="py-20">
        <div className="section-shell grid items-center gap-10 lg:grid-cols-[0.85fr_1fr]">
          <ParallaxWrap offset={24}>
            <Reveal x={-16} y={0}>
              <div className="rounded-lg border-4 border-gold bg-surface p-5 shadow-soft">
                <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-panel text-center text-lg font-semibold text-heading">
                  CEO Photo Placeholder
                </div>
              </div>
            </Reveal>
          </ParallaxWrap>
          <div className="grid gap-5 sm:grid-cols-2">
            {company.stats.map((stat, i) => (
              <div key={stat.label} className="glass-panel rounded-lg p-7 shadow-soft">
                <Stats3D value={stat.value} suffix={stat.suffix} label={stat.label} coinCount={3 + i} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-panel py-20">
        <div className="section-shell">
          <SectionHeading eyebrow="Leadership" title="Meet Our CEO" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <ParallaxWrap offset={24}>
              <Reveal x={-16} y={0}>
                <div className="rounded-lg border-4 border-gold bg-surface p-5 shadow-soft">
                  <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-panel text-center text-lg font-semibold text-heading">
                    Muhammad Waqas — Photo Placeholder
                  </div>
                </div>
              </Reveal>
            </ParallaxWrap>
            <Reveal x={16} y={0} delay={0.12} className="glass-panel rounded-lg p-8 shadow-soft">
              <h3 className="font-heading text-2xl font-semibold text-heading">Muhammad Waqas</h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-gold">Chief Executive Officer</p>
              <p className="mt-6 leading-8 text-body">
                Muhammad Waqas leads Professional Business Services with a clear focus on making UAE business setup smooth and
                predictable for international clients. Under his direction, the firm has built a reputation for hands-on
                government liaison work, transparent guidance, and consistent follow-through on every client file — from first
                enquiry to final approval.
              </p>
              <p className="mt-4 leading-8 text-body">
                His approach centers on personal accountability: every client works with a team that understands UAE
                regulations in depth and stays engaged until the case is fully resolved.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="section-shell">
          <SectionHeading eyebrow="Our Team" title="The People Behind Your Case" copy="A dedicated team of PRO officers and consultants working from our Abu Dhabi office." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {leadershipTeam.concat([
              { name: "PRO Team", role: "Government Liaison" },
              { name: "Client Services", role: "Case Coordination" },
              { name: "Documentation", role: "Attestation & Compliance" }
            ]).map((member, index) => (
              <Reveal key={member.name} delay={index * 0.08} className="glass-panel group overflow-hidden rounded-lg p-5 text-center shadow-soft transition-transform duration-300 hover:-translate-y-1">
                <div className="relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border-2 border-gold/60 bg-panel text-sm font-semibold text-heading">
                  Photo Placeholder
                  <div className="absolute inset-0 flex items-end justify-center bg-navy/70 p-3 text-xs font-semibold text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {member.role}
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-heading">{member.name}</h3>
                <p className="mt-1 text-sm text-muted">{member.role}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-panel py-20">
        <div className="section-shell grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <Reveal x={-16} y={0}>
            <SectionHeading eyebrow="Visit Us" title="Our Abu Dhabi Office" />
            <div className="glass-panel mt-6 flex gap-3 rounded-lg p-5">
              <MapPin className="mt-1 shrink-0 text-gold" />
              <p className="text-heading">{company.address}</p>
            </div>
          </Reveal>
          <Reveal x={16} y={0} delay={0.1}>
            <iframe
              title="Professional Business Services Office Location"
              src="https://www.google.com/maps?q=Electra%20Street%20Abu%20Dhabi&output=embed"
              className="h-[300px] w-full rounded-lg border-0 shadow-soft"
              loading="lazy"
            />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
