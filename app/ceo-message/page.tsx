import Image from "next/image";
import { GlowOrb, ParallaxWrap, Reveal, TypingText } from "@/components/motion/MotionScenes";
import { ceoMessage } from "@/lib/company";

export const metadata = {
  title: "CEO Message",
  description: "A message from the CEO of Professional Business Services on the company's mission to simplify UAE business setup, visas, and PRO services."
};

export default function CEOMessagePage() {
  return (
    <main className="relative overflow-hidden bg-base">
      <GlowOrb />
      <section className="section-shell relative grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[1fr_0.8fr]">
        <Reveal x={-16} y={0}>
          <article className="border-l-4 border-gold bg-glass py-2 pl-7">
            <h1 className="font-heading text-4xl font-bold text-heading md:text-5xl">CEO Message</h1>
            <div className="mt-8 space-y-6 text-base leading-8 text-body">
              {ceoMessage.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <div className="mt-8 font-heading text-2xl font-semibold">
              <TypingText text="Muhammad Waqas" className="text-gold" startDelay={300} />
            </div>
          </article>
        </Reveal>
        <ParallaxWrap offset={24}>
          <Reveal x={16} y={0} delay={0.15}>
            <div className="rounded-lg border-4 border-gold bg-surface p-5 shadow-soft">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md">
                <Image
                  src="/ceo-waqas.jpeg"
                  alt="Muhammad Waqas — CEO, Professional Business Services"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 420px"
                  priority
                />
              </div>
            </div>
          </Reveal>
        </ParallaxWrap>
      </section>
    </main>
  );
}
