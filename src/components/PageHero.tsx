import { pick } from "@/i18n/config";
import type { ReactNode } from "react";
import { hasPhoto, type PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Container } from "./Container";
import { Breadcrumbs, type BreadcrumbItem } from "./ui/Breadcrumbs";
import { Photo } from "./ui/Photo";

/** Each page family has its own light: a tinted glow behind the hero. */
export type HeroTone = "rose" | "sage" | "orchid" | "sand" | "pearl" | "champagne";

const SECTION_TONE: Record<string, HeroTone> = { waxing: "rose", massage: "sage", facial: "orchid", bodycare: "sand", packages: "champagne" };
const SECTION_MARK: Record<string, Record<Locale, string>> = {
  waxing: { nl: "Wax", en: "Wax", tr: "Ağda" },
  massage: { nl: "Massage", en: "Massage", tr: "Masaj" },
  facial: { nl: "Gezicht", en: "Facial", tr: "Yüz" },
  bodycare: { nl: "Lichaam", en: "Body", tr: "Vücut" },
};

/** Tone and watermark word for a treatment section, so every section page looks like itself. */
export function sectionHeroStyle(sectionId: string, locale: Locale): { tone: HeroTone; mark?: string } {
  return { tone: SECTION_TONE[sectionId] ?? "pearl", mark: SECTION_MARK[sectionId]?.[locale] };
}

/**
 * Inner-page hero. The header is sticky and part of the document flow, so
 * the hero never sits underneath it.
 * - With a registered photo: text + full 4:5 photo (width derived from the
 *   viewport height, so it is never cropped and never hides under the header).
 * - Without a photo: a compact typographic hero with the brand symbol —
 *   no empty image frame.
 */
export function PageHero({
  locale,
  eyebrow,
  title,
  titleEm,
  subtitle,
  photo,
  children,
  photoLabel,
  ratio = 4 / 5,
  crumbs,
  tone = "pearl",
  mark,
  compact = false,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  titleEm?: string;
  subtitle: string;
  photo: PhotoId;
  children?: ReactNode;
  /** Visible "mood image" caption for stock interiors. */
  photoLabel?: string;
  /** Frame ratio for the hero photo (default 4:5; use 5:4 for landscape subjects). */
  ratio?: number;
  /** Visible breadcrumb trail (Home is added automatically). */
  crumbs?: BreadcrumbItem[];
  /** Page family colour (soft glow behind the hero). */
  tone?: HeroTone;
  /** Large decorative watermark word (aria-hidden). */
  mark?: string;
  /** Text-only hero (no photo), so the page's main task starts right below. */
  compact?: boolean;
}) {
  const withPhoto = !compact && hasPhoto(photo);
  const dict = getDictionary(locale);
  const text = (
    <div>
      {crumbs && (
        <div className="rise mb-6">
          <Breadcrumbs label={dict.nav.breadcrumb} items={[{ name: dict.nav.home, href: pick(locale, { nl: "/", en: "/en", tr: "/tr" }) }, ...crumbs]} />
        </div>
      )}
      <p className="eyebrow rise">{eyebrow}</p>
      <h1 className="display rise mt-5 text-[2.05rem] [--rise-delay:80ms] min-[400px]:text-[2.5rem] sm:text-6xl lg:text-[4.4rem]">
        {title}
        {titleEm && (
          <>
            <br />
            <em>{titleEm}</em>
          </>
        )}
      </h1>
      <p className="lead rise mt-5 max-w-xl [--rise-delay:160ms]">{subtitle}</p>
      {children && <div className="rise mt-8 [--rise-delay:240ms]">{children}</div>}
    </div>
  );

  const watermark = mark ? (
    <span aria-hidden="true" className="hero-mark">
      {mark}
    </span>
  ) : null;

  if (!withPhoto) {
    return (
      <section data-tone={tone} className="hero-tone pt-header relative overflow-hidden border-b border-line bg-paper pb-[var(--space-section-tight)]">
        {watermark}
        <Container className="relative">
          <div className="max-w-3xl">{text}</div>
        </Container>
      </section>
    );
  }

  return (
    <section data-tone={tone} className="hero-tone pt-header relative overflow-hidden bg-paper pb-[var(--space-section-tight)]">
      {watermark}
      <Container className="relative grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {text}
        <div className="rise mx-auto w-full max-w-md [--rise-delay:120ms] md:max-w-none">
          <div className={`hero-kb mx-auto overflow-hidden rounded-[var(--radius-media)] lg:ml-auto lg:mr-0 ${ratio < 1 ? "hero-photo-w" : "w-full max-w-[34rem]"}`}>
            <Photo id={photo} locale={locale} priority ratio={ratio} label={photoLabel} sizes="(min-width: 768px) 40vw, 92vw" />
          </div>
        </div>
      </Container>
    </section>
  );
}
