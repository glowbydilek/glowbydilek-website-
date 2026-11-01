/* eslint-disable @next/next/no-img-element -- static SVG brand assets shown as-is */
import { Glint } from "@/components/brand/Logo";
import { Container } from "@/components/Container";

const assets = [
  { file: "glow-by-dilek-logo-inline.svg", label: "Inline — header, lichte achtergrond", bg: "bg-surface", h: "h-14" },
  { file: "glow-by-dilek-logo-inline-light.svg", label: "Inline — donkere achtergrond", bg: "bg-ink", h: "h-14" },
  { file: "glow-by-dilek-logo.svg", label: "Horizontaal met ‘BY DILEK’", bg: "bg-surface", h: "h-14" },
  { file: "glow-by-dilek-logo-stacked.svg", label: "Gestapeld — licht", bg: "bg-sand", h: "h-28" },
  { file: "glow-by-dilek-logo-stacked-light.svg", label: "Gestapeld — donker (footer)", bg: "bg-ink", h: "h-28" },
  { file: "glow-by-dilek-symbol.svg", label: "Monogram — licht", bg: "bg-surface", h: "h-24" },
  { file: "glow-by-dilek-symbol-light.svg", label: "Monogram — donker", bg: "bg-ink", h: "h-24" },
  { file: "glow-by-dilek-app-icon.svg", label: "App-icoon / favicon", bg: "bg-sand", h: "h-24" },
];

const palette = [
  ["Parel", "#FFFCFB", "bg-paper", "Achtergrond"],
  ["Zacht roze", "#F5E6E7", "bg-sand", "Zachte secties, kaarten"],
  ["Orchidee", "#EEE3F2", "bg-glow-soft", "Lichtreflecties"],
  ["Diep pruim", "#2B202B", "bg-ink", "Tekst, knoppen, donkere secties · 15,3:1"],
  ["Rozenhout", "#8E4759", "bg-accent", "Accent, links, glinstering · 6,4:1"],
  ["Champagne", "#C69B73", "bg-champagne", "Metaaldetail (decoratief, niet voor tekst op licht)"],
  ["Ivoor", "#FAF5EE", "bg-ivory", "Warme tweede ondergrond"],
];

export function BrandPage() {
  return (
    <div className="pt-header bg-paper pb-[var(--space-section)]">
      <Container>
        <p className="eyebrow">Intern · niet geïndexeerd</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">
          Merkidentiteit <em>2026</em>
        </h1>
        <p className="lead mt-5 max-w-2xl">
          Warm, redactioneel en rustig zelfverzekerd. Porselein, espresso en één kenmerkende kleur: hars, de warme amber van wax. De glinstering, een
          vierpuntige ster van licht, is het enige ornament. Alle logo&apos;s zijn zuivere vectorpaden (geen lettertype nodig) en worden gemaakt met{" "}
          <code className="rounded bg-surface px-1.5">npm run brand:logos</code>.
        </p>

        <h2 className="display mt-16 text-4xl">Logobestanden</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <a key={a.file} href={`/brand/${a.file}`} className="group block">
              <div className={`flex h-56 items-center justify-center rounded-[var(--radius-card)] p-6 ${a.bg}`}>
                <img src={`/brand/${a.file}`} alt={a.label} className={`${a.h} w-auto max-w-full`} />
              </div>
              <p className="mt-3 text-sm text-ink-soft group-hover:text-accent-deep">{a.label} · SVG ↓</p>
            </a>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Ook beschikbaar: <a className="underline" href="/brand/icon-512.png">icon-512.png</a>, <a className="underline" href="/brand/profile-icon.png">profile-icon.png</a> (1080×1080, social media) en{" "}
          <a className="underline" href="/brand/og-default.png">og-default.png</a> (1200×630).
        </p>

        <h2 className="display mt-16 text-4xl">Kleuren</h2>
        <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {palette.map(([name, hex, cls, use]) => (
            <div key={hex}>
              <div className={`h-24 rounded-[var(--radius-card)] border border-ink/10 ${cls}`} />
              <p className="mt-3 font-medium">{name}</p>
              <p className="text-sm text-muted">{hex}</p>
              <p className="text-xs text-muted">{use}</p>
            </div>
          ))}
        </div>

        <h2 className="display mt-16 text-4xl">Typografie</h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[var(--radius-card)] bg-surface p-7">
            <p className="eyebrow">Koppen · Bodoni Moda</p>
            <p className="display mt-4 text-5xl">
              Jouw moment <em>om te stralen.</em>
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-surface p-7">
            <p className="eyebrow">Tekst · Instrument Sans</p>
            <p className="mt-4 text-lg leading-relaxed">Beauty &amp; relaxation voor vrouwen: ontspanning en verzorging, op afspraak bij Dilek.</p>
            <p className="mt-3 text-sm font-medium">Knoppen in gewone zinsvorm, nooit in spatiërende hoofdletters.</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-surface p-7">
            <p className="eyebrow">De glinstering</p>
            <p className="mt-4 flex items-center gap-3 text-accent">
              <Glint className="h-10 w-auto" />
              <Glint className="h-6 w-auto" />
              <Glint className="h-3 w-auto" />
            </p>
            <p className="mt-3 text-sm text-muted">Spaarzaam: in het logo, bij labels, als actieve markering en in de paginaovergang. Nooit als patroon.</p>
          </div>
        </div>

        <h2 className="display mt-16 text-4xl">Beeld</h2>
        <ul className="mt-5 max-w-3xl list-disc space-y-2 pl-5 text-ink-soft">
          <li>Eén portret in de hero; verder stillevens, texturen en materialen in warm, natuurlijk licht.</li>
          <li>Geen beelden die suggereren dat het Dilek, haar werkplek of echte klanten zijn, en geen thuissituatie.</li>
          <li>Alleen gelicentieerde beelden met bron en licentie in het mediabestand.</li>
        </ul>
      </Container>
    </div>
  );
}
