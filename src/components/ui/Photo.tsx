import { photos, photoSrcSet, type PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { LogoMark } from "../brand/Logo";

/**
 * Photo slot. Renders the optimised photo when one is registered in
 * src/content/media.ts, otherwise a designed brand panel (purely
 * decorative, hidden from assistive technology).
 */
const panels: Record<PhotoId, string> = {
  "hero-portrait":
    "radial-gradient(70% 55% at 62% 30%, #fff7ee 0%, rgb(255 247 238 / 0) 60%), linear-gradient(160deg, #efdcc9 0%, #e2c3b2 45%, #c99f8c 100%)",
  "hero-detail":
    "radial-gradient(80% 70% at 30% 25%, #fbefe6 0%, rgb(251 239 230 / 0) 65%), linear-gradient(200deg, #e8cdbf 0%, #d3ab98 100%)",
  "zone-face":
    "radial-gradient(60% 50% at 40% 35%, #f8e9dc 0%, rgb(248 233 220 / 0) 70%), linear-gradient(170deg, #d9b7a2 0%, #a77a64 100%)",
  "zone-body":
    "radial-gradient(70% 60% at 70% 30%, #fbf3ea 0%, rgb(251 243 234 / 0) 70%), linear-gradient(180deg, #eee0d1 0%, #d8bfa9 100%)",
  "zone-intimate":
    "radial-gradient(65% 55% at 50% 30%, #fbf1ec 0%, rgb(251 241 236 / 0) 70%), linear-gradient(175deg, #f0dcd5 0%, #d5b0a5 100%)",
  hygiene:
    "radial-gradient(70% 60% at 50% 25%, #ffffff 0%, rgb(255 255 255 / 0) 65%), linear-gradient(180deg, #f3ece3 0%, #ddc9b2 100%)",
  aftercare:
    "radial-gradient(60% 60% at 35% 35%, #f9eddc 0%, rgb(249 237 220 / 0) 70%), linear-gradient(150deg, #e6cfae 0%, #b99067 100%)",
  "dilek-portrait":
    "radial-gradient(60% 50% at 50% 30%, #fbf2ea 0%, rgb(251 242 234 / 0) 70%), linear-gradient(180deg, #eadbd0 0%, #cfb2a3 100%)",
  atmosphere:
    "radial-gradient(50% 80% at 75% 40%, #fff3e6 0%, rgb(255 243 230 / 0) 70%), linear-gradient(120deg, #e9d6c6 0%, #d2ae99 60%, #b48f7f 100%)",
};

export function Photo({
  id,
  locale,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  rounded = "rounded-[2rem]",
  caption,
  fill = false,
}: {
  id: PhotoId;
  locale: Locale;
  className?: string;
  sizes?: string;
  priority?: boolean;
  rounded?: string;
  /** Optional caption shown on the brand panel (e.g. "portrait coming soon"). */
  caption?: string;
  /** Fill the parent instead of using the photo's aspect ratio. */
  fill?: boolean;
}) {
  const photo = photos[id];
  const srcSet = photoSrcSet(photo);

  if (photo.file && srcSet) {
    return (
      <div className={`relative overflow-hidden bg-blush ${rounded} ${className}`} style={fill ? undefined : { aspectRatio: photo.aspect }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised responsive WebP, no runtime image server needed */}
        <img
          src={`/images/photos/${photo.file}-1440.webp`}
          srcSet={srcSet}
          sizes={sizes}
          alt={photo.alt[locale]}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: photo.focus ?? "50% 50%" }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden={caption ? undefined : true}
      className={`grain relative overflow-hidden ${rounded} ${className}`}
      style={{ aspectRatio: fill ? undefined : photo.aspect, background: panels[id] }}
      data-photo-slot={id}
    >
      <div className="absolute inset-[6%] rounded-[inherit] border border-ivory/45" />
      <LogoMark
        className="absolute -bottom-[12%] -right-[10%] h-[70%] w-[70%] opacity-[0.16]"
        ink="#fffaf3"
        accent="#fffaf3"
      />
      <div className="absolute left-[14%] top-[16%] h-[38%] w-[38%] rounded-full bg-[radial-gradient(circle,rgb(255_250_243/0.75),rgb(255_250_243/0)_70%)] blur-xl" />
      {caption && (
        <p className="absolute inset-x-0 bottom-[9%] z-[2] text-center text-[0.68rem] font-medium uppercase tracking-[0.28em] text-espresso/70">
          {caption}
        </p>
      )}
    </div>
  );
}
