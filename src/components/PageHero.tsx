import type { ReactNode } from "react";
import type { PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { Container } from "./Container";
import { Photo } from "./ui/Photo";

/** Split editorial hero used by all inner pages. */
export function PageHero({
  locale,
  eyebrow,
  title,
  titleEm,
  subtitle,
  photo,
  children,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  titleEm?: string;
  subtitle: string;
  photo: PhotoId;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-ivory-100">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-blush-light lg:block" aria-hidden="true" />
      <Container className="relative grid items-center gap-10 pb-16 pt-10 sm:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-16">
        <div className="animate-fade-up">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-6 text-[2.75rem] sm:text-6xl lg:text-[4.4rem]">
            {title}
            {titleEm && (
              <>
                <br />
                <em>{titleEm}</em>
              </>
            )}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-espresso-soft sm:text-lg">{subtitle}</p>
          {children && <div className="mt-9">{children}</div>}
        </div>
        <div className="animate-fade-up [animation-delay:120ms]">
          <Photo
            id={photo}
            locale={locale}
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="mx-auto max-h-[34rem] w-full max-w-md shadow-soft lg:max-w-none"
          />
        </div>
      </Container>
    </section>
  );
}
