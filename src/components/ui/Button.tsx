import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "outline" | "light" | "outline-light" | "link";

const base =
  "group inline-flex items-center justify-center gap-3 rounded-full text-[0.74rem] font-medium uppercase tracking-[0.2em] transition-all duration-500 ease-[var(--ease-luxe)]";

const styles: Record<Variant, string> = {
  primary: "bg-espresso px-8 py-4 text-ivory hover:bg-champagne-deep shadow-soft",
  outline: "border border-espresso/25 px-8 py-4 text-espresso hover:border-espresso hover:bg-espresso hover:text-ivory",
  light: "bg-ivory px-8 py-4 text-espresso hover:bg-champagne-light",
  "outline-light": "border border-ivory/35 px-8 py-4 text-ivory hover:border-ivory hover:bg-ivory hover:text-espresso",
  link: "px-0 py-1 text-espresso hover:text-champagne-deep",
};

type Props = { href: string; children: ReactNode; variant?: Variant; className?: string; arrow?: boolean };

export function ButtonLink({ href, children, variant = "primary", className = "", arrow = false }: Props) {
  const content = (
    <>
      {children}
      {arrow && (
        <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      )}
    </>
  );
  const cls = `${base} ${styles[variant]} ${className}`;
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("http")) {
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
