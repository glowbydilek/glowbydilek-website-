import type { PhotoId } from "@/content/media";
import { hasPhoto } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { Glint, LogoStacked } from "./brand/Logo";
import { Photo } from "./ui/Photo";

/**
 * Hero visual. Shows the registered photo; while no photo exists it shows
 * the stacked brand emblem (the approved logo artwork) on a soft nude
 * surface — brand art, not a fake photograph.
 */
export function HeroVisual({ photo, locale, sizes }: { photo: PhotoId; locale: Locale; sizes?: string }) {
  if (hasPhoto(photo)) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-media)]">
        <Photo id={photo} locale={locale} priority ratio={4 / 5} sizes={sizes ?? "(min-width: 768px) 44vw, 92vw"} />
      </div>
    );
  }
  return (
    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[var(--radius-media)] bg-sand">
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
