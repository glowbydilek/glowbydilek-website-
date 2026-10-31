export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  as: Tag = "h2",
  className = "",
  size = "lg",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
  className?: string;
  size?: "md" | "lg";
}) {
  const center = align === "center";
  return (
    <div className={`${center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"} ${className}`} data-reveal>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className={`display mt-4 ${size === "lg" ? "text-[2.3rem] sm:text-5xl lg:text-[3.6rem]" : "text-[2rem] sm:text-4xl lg:text-[2.8rem]"}`}>
        {title}
      </Tag>
      {intro && <p className="lead mt-4">{intro}</p>}
    </div>
  );
}
