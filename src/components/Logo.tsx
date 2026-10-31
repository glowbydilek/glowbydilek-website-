import Link from "next/link";
import { href, type Locale } from "@/i18n/config";

export function Monogram({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fontFamily="Cormorant Garamond Variable, Georgia, serif"
        fontSize="19"
        fontStyle="italic"
        fill="currentColor"
      >
        GD
      </text>
    </svg>
  );
}

export function Logo({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  return (
    <Link
      href={href(locale, "home")}
      onClick={onNavigate}
      className="group flex items-center gap-3 text-charcoal"
      aria-label="Glow by Dilek — Home"
    >
      <Monogram className="h-10 w-10 text-champagne transition-colors group-hover:text-champagne-deep" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.45rem] font-medium tracking-wide">Glow by Dilek</span>
        <span className="mt-1 text-[0.58rem] font-medium uppercase tracking-[0.34em] text-charcoal-muted">
          Waxing &amp; Beauty
        </span>
      </span>
    </Link>
  );
}
