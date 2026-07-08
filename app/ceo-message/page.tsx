import { GlowOrb } from "@/components/motion/MotionScenes";
import { ceoMessage } from "@/lib/company";

export const metadata = {
  title: "CEO Message"
};

export default function CEOMessagePage() {
  return (
    <main className="relative overflow-hidden bg-base">
      <GlowOrb />
      <section className="section-shell relative grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[1fr_0.8fr]">
        <article className="border-l-4 border-gold bg-glass py-2 pl-7">
          <h1 className="font-heading text-4xl font-bold text-heading md:text-5xl">CEO Message</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-body">
            {ceoMessage.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <div className="mt-8 text-2xl font-semibold text-heading">Signature Placeholder</div>
        </article>
        <div className="rounded-lg border-4 border-gold bg-surface p-5 shadow-soft">
          <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-panel text-center text-lg font-semibold text-heading">
            CEO Photo Placeholder
          </div>
        </div>
      </section>
    </main>
  );
}
