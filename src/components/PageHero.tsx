import { Container } from "./Container";

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="bg-silk relative overflow-hidden border-b border-champagne/20">
      <Ornament />
      <Container className="relative pb-20 pt-40 text-center sm:pb-28 sm:pt-48">
        <p className="eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="animate-fade-up mx-auto mt-5 max-w-3xl text-[2.6rem] leading-[1.05] [animation-delay:80ms] sm:text-6xl">
          {title}
        </h1>
        <span className="gold-rule mx-auto mt-7" />
        <p className="animate-fade-up mx-auto mt-7 max-w-xl text-base leading-relaxed text-charcoal-soft [animation-delay:160ms] sm:text-lg">
          {subtitle}
        </p>
      </Container>
    </section>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 600"
      className={`pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] text-champagne/30 ${className}`}
    >
      <circle cx="300" cy="300" r="299" fill="none" stroke="currentColor" />
      <circle cx="300" cy="300" r="240" fill="none" stroke="currentColor" />
      <circle cx="300" cy="300" r="180" fill="none" stroke="currentColor" />
    </svg>
  );
}
