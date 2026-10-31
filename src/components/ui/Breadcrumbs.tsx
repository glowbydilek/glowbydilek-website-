import Link from "next/link";

export type BreadcrumbItem = { name: string; href?: string };

/** Visible breadcrumb trail (structured data is added by PageFrame). */
export function Breadcrumbs({ items, label }: { items: BreadcrumbItem[]; label: string }) {
  return (
    <nav aria-label={label} className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-gold">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-gold-deep">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-charcoal-soft">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
