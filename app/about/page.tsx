import { SectionHeading } from "@/components/SectionHeading";
import { StatsCounter, TimelineMotion } from "@/components/motion/MotionScenes";
import { aboutParagraphs, company } from "@/lib/company";

export const metadata = {
  title: "About Us"
};

export default function AboutPage() {
  return (
    <main>
      <section className="bg-mist py-20">
        <div className="section-shell grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading title="About Professional Business Services" />
            <div className="mt-8 space-y-6 text-base leading-8 text-ink/75">
              {aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <TimelineMotion />
        </div>
      </section>
      <section className="py-20">
        <div className="section-shell grid items-center gap-10 lg:grid-cols-[0.85fr_1fr]">
          <div className="rounded-lg border-4 border-gold bg-white p-5 shadow-soft">
            <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-mist text-center text-lg font-semibold text-navy">
              CEO Photo Placeholder
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {company.stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-navy/10 bg-white p-7 shadow-soft">
                <StatsCounter {...stat} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
