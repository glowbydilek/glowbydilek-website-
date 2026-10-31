import type { ReactNode } from "react";
import { hasPhoto, type PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LogoSymbol } from "./brand/Logo";
import { Container } from "./Container";
import { Breadcrumbs, type BreadcrumbItem } from "./ui/Breadcrumbs";
import { Photo } from "./ui/Photo";

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
}) {
  const withPhoto = hasPhoto(photo);
  const dict = getDictionary(locale);
  const text = (
    <div>
      {crumbs && (
        <div className="rise mb-6">
          <Breadcrumbs label={dict.nav.breadcrumb} items={[{ name: dict.nav.home, href: locale === "nl" ? "/" : "/en" }, ...crumbs]} />
        </div>
      )}
      <p className="eyebrow rise">{eyebrow}</p>
      <h1 className="display rise mt-5 text-[2.5rem] [--rise-delay:80ms] sm:text-6xl lg:text-[4.4rem]">
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

  if (!withPhoto) {
    return (
      <section className="pt-header relative overflow-hidden border-b border-stone/70 bg-ivory pb-[var(--space-section-tight)]">
        <LogoSymbol className="pointer-events-none absolute -right-16 top-8 hidden h-auto w-[26rem] opacity-[0.12] lg:block xl:right-[4vw]" />
        <Container className="relative">
          <div className="max-w-3xl">{text}</div>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-header bg-ivory pb-[var(--space-section-tight)]">
      <Container className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {text}
        <div className="rise mx-auto w-full max-w-md [--rise-delay:120ms] md:max-w-none">
          <div className={`mx-auto overflow-hidden rounded-[var(--radius-media)] shadow-soft lg:ml-auto lg:mr-0 ${ratio < 1 ? "hero-photo-w" : "w-full max-w-[34rem]"}`}>
            <Photo id={photo} locale={locale} priority ratio={ratio} label={photoLabel} sizes="(min-width: 768px) 40vw, 92vw" />
          </div>
        </div>
      </Container>
    </section>
  );
}
