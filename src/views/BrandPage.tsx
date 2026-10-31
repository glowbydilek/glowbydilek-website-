/* eslint-disable @next/next/no-img-element -- static SVG brand assets shown as-is */
import { Container } from "@/components/Container";

const concepts = [
  {
    id: "A",
    name: "Lumen",
    file: "concept-a-lumen",
    recommended: true,
    text: "Een kalligrafische G met dik-dun contrast, die een parel van licht vasthoudt: de ‘glow’. Herkenbaar tot 16 px, niet gebonden aan waxing en dus geschikt voor een groeiende beauty studio. Klassieke serif-wordmark met cursieve ‘by’ voor warmte.",
  },
  {
    id: "B",
    name: "Atelier",
    file: "concept-b-atelier",
    text: "Een verweven G/D-monogram in een slanke boog, verwijzend naar een spiegel of de deur van een studio. Luxe en klassiek, maar minder krachtig op kleine formaten door de fijne lijnen.",
  },
  {
    id: "C",
    name: "Halo",
    file: "concept-c-halo",
    text: "Een stralende ring met een lichtkern die de O van GLOW vervangt. Modern en grafisch; het symbool is abstracter en daardoor minder direct aan Glow by Dilek te koppelen.",
  },
];

const versions = [
  { file: "logo-horizontal.svg", label: "Horizontaal", bg: "bg-ivory" },
  { file: "logo-horizontal-light.svg", label: "Horizontaal — licht", bg: "bg-forest" },
  { file: "logo-stacked.svg", label: "Gestapeld", bg: "bg-ivory" },
  { file: "logo-stacked-light.svg", label: "Gestapeld — licht", bg: "bg-forest" },
  { file: "logo-icon.svg", label: "Icoon", bg: "bg-ivory" },
  { file: "logo-icon-light.svg", label: "Icoon — licht", bg: "bg-forest" },
  { file: "favicon.svg", label: "Favicon / app-icoon", bg: "bg-ivory-50" },
  { file: "profile-icon.svg", label: "Social media profielfoto", bg: "bg-ivory-50" },
];

const palette = [
  ["Warm ivory", "#F4F0E8", "bg-ivory"],
  ["Deep forest", "#20382F", "bg-forest"],
  ["Soft stone", "#D5CCBE", "bg-stone"],
  ["Botanical sage", "#859283", "bg-sage"],
  ["Champagne gold", "#B99C6B", "bg-gold"],
  ["Rich charcoal", "#232825", "bg-charcoal"],
];

export function BrandPage() {
  return (
    <div className="bg-ivory-50 py-16 sm:py-24">
      <Container>
        <p className="eyebrow">Intern · niet geïndexeerd</p>
        <h1 className="display mt-5 text-5xl sm:text-7xl">
          Merkidentiteit <em>Glow by Dilek</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-forest-soft">
          Drie originele logoconcepten. Concept A (Lumen) is aanbevolen en op de website doorgevoerd. Alle bestanden staan
          in <code className="rounded bg-ivory px-1.5">/public/brand</code>.
        </p>

        <h2 className="display mt-20 text-4xl">Logoconcepten</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {concepts.map((c) => (
            <article key={c.id} className={`rounded-[1.75rem] bg-ivory p-8 shadow-card ${c.recommended ? "ring-2 ring-gold" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="eyebrow">Concept {c.id}</p>
                {c.recommended && (
                  <span className="rounded-full bg-forest px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-ivory">
                    Aanbevolen
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-3xl">{c.name}</h3>
              <div className="mt-8 flex h-40 items-center justify-center rounded-2xl bg-ivory-50 p-6">
                <img src={`/brand/concepts/${c.file}.svg`} alt={`Logoconcept ${c.name}`} className="max-h-full max-w-full" />
              </div>
              <div className="mt-4 flex h-28 items-center justify-center rounded-2xl bg-ivory-50">
                <img src={`/brand/concepts/${c.file}-icon.svg`} alt={`Icoon concept ${c.name}`} className="h-20 w-20" />
              </div>
              <p className="mt-6 leading-relaxed text-forest-soft">{c.text}</p>
            </article>
          ))}
        </div>

        <h2 className="display mt-20 text-4xl">Logoversies (concept A)</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {versions.map((v) => (
            <a key={v.file} href={`/brand/${v.file}`} className="group block">
              <div className={`flex h-48 items-center justify-center rounded-2xl p-6 ${v.bg}`}>
                <img src={`/brand/${v.file}`} alt={v.label} className="max-h-full max-w-full" />
              </div>
              <p className="mt-3 text-sm text-forest-soft group-hover:text-gold-deep">{v.label} · SVG ↓</p>
            </a>
          ))}
        </div>

        <h2 className="display mt-20 text-4xl">Kleuren</h2>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {palette.map(([name, hex, cls]) => (
            <div key={hex}>
              <div className={`h-28 rounded-2xl border border-forest/10 ${cls}`} />
              <p className="mt-3 font-medium">{name}</p>
              <p className="text-sm text-forest-muted">{hex}</p>
            </div>
          ))}
        </div>

        <h2 className="display mt-20 text-4xl">Typografie</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] bg-ivory p-8">
            <p className="eyebrow">Display · Cormorant Garamond</p>
            <p className="display mt-5 text-6xl">
              Zacht, zuiver <em>en stralend.</em>
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-ivory p-8">
            <p className="eyebrow">Tekst · Jost</p>
            <p className="mt-5 text-lg leading-relaxed">
              Glow by Dilek staat voor verfijnde waxbehandelingen in een rustige, hygiënische en persoonlijke setting.
            </p>
            <p className="mt-4 text-[0.74rem] font-medium uppercase tracking-[0.2em]">Knoppen en labels in kapitalen</p>
          </div>
        </div>
      </Container>
    </div>
  );
}
