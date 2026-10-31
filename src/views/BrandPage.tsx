/* eslint-disable @next/next/no-img-element -- static SVG brand assets shown as-is */
import { Container } from "@/components/Container";

const assets = [
  { file: "logo-horizontal.svg", label: "Horizontaal — lichte achtergrond (header)", bg: "bg-ivory-50", h: "h-16" },
  { file: "logo-horizontal-dark.svg", label: "Horizontaal — donkere achtergrond (footer)", bg: "bg-charcoal", h: "h-16" },
  { file: "logo-wordmark.svg", label: "Zonder tagline", bg: "bg-ivory-50", h: "h-14" },
  { file: "logo-stacked.svg", label: "Embleem — licht", bg: "bg-nude-light", h: "h-56" },
  { file: "logo-stacked-dark.svg", label: "Embleem — donker", bg: "bg-charcoal", h: "h-56" },
  { file: "logo-symbol.svg", label: "Symbool — licht", bg: "bg-ivory-50", h: "h-24" },
  { file: "logo-symbol-dark.svg", label: "Symbool — donker", bg: "bg-charcoal", h: "h-24" },
  { file: "favicon.svg", label: "Favicon / app-icoon", bg: "bg-stone-light", h: "h-24" },
  { file: "profile-icon.svg", label: "Social media profielfoto (1080 × 1080)", bg: "bg-stone-light", h: "h-40" },
];

const palette = [
  ["Warm Ivory", "#F8F5EF", "bg-ivory", "Hoofdachtergrond"],
  ["Soft Nude", "#E9D5C7", "bg-nude", "Accentvlakken"],
  ["Stone Beige", "#DDD2C4", "bg-stone", "Lijnen en rustige vlakken"],
  ["Champagne Gold", "#C4A16F", "bg-gold", "Symbool, lijnen, accenten"],
  ["Gold (tekst)", "#85663A", "bg-gold-deep", "Kleine gouden tekst (AA)"],
  ["Elegant Charcoal", "#292724", "bg-charcoal", "Tekst, knoppen, donkere band"],
];

export function BrandPage() {
  return (
    <div className="pt-header bg-ivory pb-[var(--space-section)]">
      <Container>
        <p className="eyebrow">Intern · niet geïndexeerd</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">
          Merkidentiteit <em>Glow by Dilek</em>
        </h1>
        <p className="lead mt-5 max-w-2xl">
          Uitgewerkt op basis van het goedgekeurde logoconcept: een champagnegouden ‘Glow’, een handgeschreven ‘by Dilek’,
          een lotus-symbool met zwierig blad en druppel, en de tagline ‘Professional Waxing’. Alle bestanden zijn zuivere
          vectorpaden en staan in <code className="rounded bg-ivory-50 px-1.5">/public/brand</code>.
        </p>

        <h2 className="display mt-16 text-4xl">Logobestanden</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <a key={a.file} href={`/brand/${a.file}`} className="group block">
              <div className={`flex h-64 items-center justify-center rounded-[var(--radius-card)] p-6 ${a.bg}`}>
                <img src={`/brand/${a.file}`} alt={a.label} className={`${a.h} w-auto max-w-full`} />
              </div>
              <p className="mt-3 text-sm text-charcoal-soft group-hover:text-gold-deep">{a.label} · SVG ↓</p>
            </a>
          ))}
        </div>

        <h2 className="display mt-16 text-4xl">Kleuren</h2>
        <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {palette.map(([name, hex, cls, use]) => (
            <div key={hex}>
              <div className={`h-24 rounded-[var(--radius-card)] border border-charcoal/10 ${cls}`} />
              <p className="mt-3 font-medium">{name}</p>
              <p className="text-sm text-muted">{hex}</p>
              <p className="text-xs text-muted">{use}</p>
            </div>
          ))}
        </div>

        <h2 className="display mt-16 text-4xl">Typografie</h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[var(--radius-card)] bg-ivory-50 p-7">
            <p className="eyebrow">Display · Cormorant Garamond</p>
            <p className="display mt-4 text-5xl">
              Zacht voor je huid. <em>Rustig voor jou.</em>
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-ivory-50 p-7">
            <p className="eyebrow">Tekst · Jost</p>
            <p className="mt-4 text-lg leading-relaxed">Een kleine, persoonlijke waxstudio voor gezicht, lichaam en bikinizone.</p>
            <p className="mt-3 text-[0.74rem] font-medium uppercase tracking-[0.2em]">Labels en knoppen</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-ivory-50 p-7">
            <p className="eyebrow">Signatuur · Parisienne</p>
            <p className="script mt-4 text-6xl text-gold-deep">Dilek</p>
            <p className="mt-2 text-sm text-muted">Alleen als handtekening-accent.</p>
          </div>
        </div>
      </Container>
    </div>
  );
}
