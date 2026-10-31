export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="mt-4 text-4xl leading-[1.08] sm:text-5xl">{title}</Tag>
      <span className={`gold-rule mt-6 ${center ? "mx-auto" : ""}`} />
      {intro && <p className="mt-6 text-base leading-relaxed text-charcoal-soft sm:text-lg">{intro}</p>}
    </div>
  );
}
