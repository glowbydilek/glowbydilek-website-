import type { PhotoId } from "@/content/media";
import { hasPhoto } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { Glint, LogoStacked } from "./brand/Logo";
import { Photo } from "./ui/Photo";

/**
 * Hero visual: landscape (3:2) on phones so the first screen stays compact,
 * an arched 4:5 portrait from tablet width (see .hero-frame). Shows the registered photo; while no photo exists it shows
 * the stacked brand emblem (the approved logo artwork) on a soft nude
 * surface — brand art, not a fake photograph.
 */
export function HeroVisual({ photo, locale, sizes }: { photo: PhotoId; locale: Locale; sizes?: string }) {
  if (hasPhoto(photo)) {
    return (
      <div className="hero-frame">
        <Photo id={photo} locale={locale} priority fill sizes={sizes ?? "(min-width: 768px) 44vw, 92vw"} />
      </div>
    );
  }
  return (
    <div className="hero-frame flex items-center justify-center bg-sand">
      <LogoStacked className="relative w-[70%]" />
    </div>
  );
}

/** Small decorative brand symbol between sections or beside headings. */
export function Ornament({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <div className="flex items-center justify-center gap-4 text-accent" aria-hidden="true">
      <span className="h-px w-12 bg-line" />
      <Glint className={className} />
      <span className="h-px w-12 bg-line" />
    </div>
  );
}
