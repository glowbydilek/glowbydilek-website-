export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  as: Tag = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
  className?: string;
}) {
  const center = align === "center";
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      {eyebrow && <p className={`eyebrow ${center ? "eyebrow-center" : ""}`}>{eyebrow}</p>}
      <Tag className="display mt-5 text-[2.35rem] sm:text-5xl lg:text-[3.4rem]">{title}</Tag>
      {intro && <p className="mt-6 text-base leading-relaxed text-espresso-soft sm:text-lg">{intro}</p>}
    </div>
  );
}
