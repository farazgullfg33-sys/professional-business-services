type Props = {
  eyebrow?: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, copy, align = "left" }: Props) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold leading-tight text-navy md:text-4xl">{title}</h2>
      {copy ? <p className="mt-4 text-base leading-8 text-ink/70">{copy}</p> : null}
    </div>
  );
}
