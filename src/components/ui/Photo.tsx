import type { CSSProperties } from "react";
import { photos, photoSrcSet, type PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { BotanicalArt } from "./BotanicalArt";

/**
 * Responsive photo from the registry (pre-optimised WebP, no runtime image
 * server). `fill` makes it cover its positioned parent. `parallax` adds a
 * subtle scroll depth. Without a registered photo, a botanical artwork panel
 * is shown (decorative; tracked as missing in docs/PHOTOGRAPHY.md).
 */
export function Photo({
  id,
  locale,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  fill = false,
  parallax,
  style,
  ratio,
}: {
  id: PhotoId;
  locale: Locale;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  parallax?: number;
  style?: CSSProperties;
  /** Override the slot's aspect ratio (width / height). */
  ratio?: number;
}) {
  const photo = photos[id];
  const srcSet = photoSrcSet(photo);
  const frame = fill ? "absolute inset-0" : "relative";
  const frameRatio = fill ? undefined : { aspectRatio: ratio ?? photo.aspect };

  if (!photo.file || !srcSet) {
    return (
      <div className={`${frame} overflow-hidden bg-forest ${className}`} style={{ ...frameRatio, ...style }} aria-hidden="true">
        <BotanicalArt />
      </div>
    );
  }

  return (
    <div className={`${frame} overflow-hidden bg-stone ${className}`} style={{ ...frameRatio, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised responsive WebP; no runtime image processing on Hostinger */}
      <img
        src={`/images/photos/${photo.file}-1600.webp`}
        srcSet={srcSet}
        sizes={sizes}
        alt={photo.alt[locale]}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: photo.focus ?? "50% 50%" }}
        data-parallax={parallax}
      />
    </div>
  );
}
