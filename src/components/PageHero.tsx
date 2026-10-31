import type { ReactNode } from "react";
import type { PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { Photo } from "./ui/Photo";

/** Editorial split hero for inner pages: text on ivory, photo bleeding to the edge. */
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
    <section className="relative overflow-hidden bg-ivory">
      <div className="mx-auto grid max-w-[100rem] lg:min-h-[44rem] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-5 pb-12 pt-32 sm:px-8 lg:py-36 lg:pl-12 lg:pr-16 xl:pl-[max(3rem,calc((100vw-88rem)/2+3rem))]">
          <p className="eyebrow rise">{eyebrow}</p>
          <h1 className="display rise mt-7 text-[2.9rem] [--rise-delay:80ms] sm:text-6xl lg:text-[5rem]">
            {title}
            {titleEm && (
              <>
                <br />
                <em>{titleEm}</em>
              </>
            )}
          </h1>
          <p className="lead rise mt-7 max-w-xl [--rise-delay:160ms]">{subtitle}</p>
          {children && <div className="rise mt-10 [--rise-delay:240ms]">{children}</div>}
        </div>
        <div className="relative mx-3 mb-3 h-[24rem] overflow-hidden rounded-[2rem] sm:mx-5 sm:h-[30rem] lg:m-0 lg:h-auto lg:rounded-none lg:rounded-bl-[7rem]" data-reveal="mask">
          <Photo id={photo} locale={locale} fill priority parallax={0.06} sizes="(min-width: 1024px) 48vw, 100vw" />
        </div>
      </div>
    </section>
  );
}
