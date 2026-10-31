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
      <Tag className={`display mt-5 ${size === "lg" ? "text-[2.5rem] sm:text-6xl lg:text-[4.25rem]" : "text-4xl sm:text-5xl"}`}>
        {title}
      </Tag>
      {intro && <p className="lead mt-6">{intro}</p>}
    </div>
  );
}
