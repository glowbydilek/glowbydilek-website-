import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-charcoal text-ivory hover:bg-champagne-deep shadow-soft",
  outline:
    "border border-charcoal/25 text-charcoal hover:border-champagne-deep hover:text-champagne-deep bg-transparent",
  ghost: "text-charcoal hover:text-champagne-deep px-0! underline-offset-8 hover:underline",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[0.78rem] font-medium uppercase tracking-[0.2em] transition-all duration-300 ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
