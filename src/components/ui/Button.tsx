import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "gold" | "outline" | "light" | "outline-light" | "link" | "link-light";

// Uses the design-system button classes (globals.css), so the owner's theme
// (button shape, colours) applies everywhere.
const base = "btn group relative";

const styles: Record<Variant, string> = {
  primary: "btn-primary",
  gold: "btn-accent",
  outline: "btn-outline",
  light: "bg-paper text-ink hover:bg-glow",
  "outline-light": "border border-paper/40 text-paper hover:border-paper hover:bg-paper/10",
  link: "!min-h-11 !px-0 !py-1 !font-medium text-ink underline decoration-line decoration-1 underline-offset-[6px] hover:text-accent-deep hover:decoration-accent",
  "link-light": "!min-h-11 !px-0 !py-1 text-paper underline decoration-paper/30 underline-offset-[6px] hover:text-glow",
};

type Props = { href: string; children: ReactNode; variant?: Variant; className?: string; arrow?: boolean };

export function ButtonLink({ href, children, variant = "primary", className = "", arrow = false }: Props) {
  const content = (
    <>
      <span className="relative">{children}</span>
      {arrow && (
        <Icon name="arrow" className="relative h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      )}
    </>
  );
  const cls = `${base} ${styles[variant]} ${className}`;
  if (/^(mailto:|tel:|https?:)/.test(href)) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}
