import type { CSSProperties } from "react";
import { resolvePhoto, type PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { BotanicalArt } from "./BotanicalArt";

/**
 * Responsive photo from the registry (pre-optimised WebP; no runtime image
 * server on Hostinger).
 *
 * - The frame reserves its aspect ratio (no layout shift) unless `fill` is
 *   used inside an explicitly sized parent.
 * - Focal points come from media.ts per breakpoint (`.photo-img` + --fm/--fd),
 *   so heads and products are not cropped.
 * - `parallax` is opt-in and must NOT be used on hero/critical images.
 * - Without a registered photo a quiet, decorative botanical panel is shown
 *   (tracked as missing in docs/PHOTOGRAPHY.md).
 */
export function Photo({
  id,
  locale,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  fill = false,
  parallax,
  ratio,
  style,
  label,
}: {
  id: PhotoId;
  locale: Locale;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  parallax?: number;
  /** Override the slot's aspect ratio (width / height). */
  ratio?: number;
  style?: CSSProperties;
  /** Small visible caption, e.g. "Sfeerbeeld" for stock interiors that are not the actual studio. */
  label?: string;
}) {
  const photo = resolvePhoto(id);
  const frame = fill ? "absolute inset-0" : "relative w-full";
  const frameStyle: CSSProperties = { ...(fill ? {} : { aspectRatio: ratio ?? photo?.aspect ?? 4 / 5 }), ...style };

  if (!photo) {
    return (
      <div className={`${frame} overflow-hidden ${className}`} style={frameStyle} aria-hidden="true" data-photo-missing={id}>
        <BotanicalArt />
      </div>
    );
  }

  const focus = {
    ["--fm" as string]: photo.focus.mobile,
    ["--fd" as string]: photo.focus.desktop,
  } as CSSProperties;

  return (
    <div className={`${frame} overflow-hidden bg-stone ${className}`} style={frameStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised responsive WebP; no runtime image processing on Hostinger */}
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={sizes}
        alt={photo.alt[locale]}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="photo-img absolute inset-0 h-full w-full object-cover"
        style={focus}
        data-parallax={parallax}
      />
      {label && (
        <span className="glass absolute bottom-3 left-3 rounded-full px-3 py-1 text-[0.66rem] uppercase tracking-[0.16em] text-charcoal-soft">
          {label}
        </span>
      )}
    </div>
  );
}
