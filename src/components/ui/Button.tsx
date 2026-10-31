import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "gold" | "outline" | "light" | "outline-light" | "link" | "link-light";

const base =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full text-[0.74rem] font-medium uppercase tracking-[0.2em] transition-[background-color,color,border-color,box-shadow,transform] duration-500 ease-[var(--ease-luxe)] active:scale-[0.98]";

const styles: Record<Variant, string> = {
  primary: "bg-charcoal px-8 py-4 text-ivory shadow-soft hover:bg-charcoal-soft hover:shadow-[0_20px_40px_-20px_rgb(22_42_34/0.6)]",
  gold: "bg-gold px-8 py-4 text-charcoal-deep hover:bg-gold-light",
  outline: "border border-charcoal/30 px-8 py-4 text-charcoal hover:border-charcoal hover:bg-charcoal-soft hover:text-ivory",
  light: "bg-ivory px-8 py-4 text-charcoal hover:bg-gold-light",
  "outline-light": "border border-ivory/35 px-8 py-4 text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal",
  link: "px-0 py-1 text-charcoal hover:text-gold-deep",
  "link-light": "px-0 py-1 text-ivory hover:text-gold-light",
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
