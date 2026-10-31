import type { PhotoId } from "@/content/media";
import { hasPhoto } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { LogoSymbol } from "./brand/Logo";
import { Photo } from "./ui/Photo";

/**
 * Hero visual. Shows the registered photo; while no photo exists it shows
 * the stacked brand emblem (the approved logo artwork) on a soft nude
 * surface — brand art, not a fake photograph.
 */
export function HeroVisual({ photo, locale, sizes }: { photo: PhotoId; locale: Locale; sizes?: string }) {
  if (hasPhoto(photo)) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-media)] shadow-soft">
        <Photo id={photo} locale={locale} priority ratio={4 / 5} sizes={sizes ?? "(min-width: 768px) 44vw, 92vw"} />
      </div>
    );
  }
  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-media)] bg-nude-light">
      <div className="absolute inset-4 rounded-[1.4rem] border border-gold/35" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_42%,rgb(255_255_255/0.75),transparent_70%)]" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element -- static vector logo */}
      <img src="/brand/logo-stacked.svg" alt="" width={560} height={440} className="relative w-[88%]" fetchPriority="high" />
    </div>
  );
}

/** Small decorative brand symbol between sections or beside headings. */
export function Ornament({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <div className="flex items-center justify-center gap-4" aria-hidden="true">
      <span className="h-px w-12 bg-gold/50" />
      <LogoSymbol className={className} />
      <span className="h-px w-12 bg-gold/50" />
    </div>
  );
}
