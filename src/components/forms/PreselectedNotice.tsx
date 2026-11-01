"use client";

import { useEffect, useState } from "react";
import { Icon } from "../ui/Icon";

/**
 * Shows the treatment chosen on a treatment page at the top of the booking
 * page. The page itself opens at the top (no automatic hash jump); this
 * notice offers an explicit same-page link down to the form.
 */
export function PreselectedNotice({
  names,
  label,
  cta,
  anchor,
}: {
  names: Record<string, string>;
  label: string;
  cta: string;
  anchor: string;
}) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("behandeling") ?? p.get("treatment");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after hydration
    if (id && names[id]) setName(names[id]);
  }, [names]);
  if (!name) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-accent/50 bg-surface px-4 py-3 text-sm" role="status">
      <span className="flex items-center gap-2 text-ink">
        <Icon name="check" className="h-4 w-4 text-accent-deep" />
        {label}: <strong className="font-medium">{name}</strong>
      </span>
      <a href={`#${anchor}`} className="inline-flex min-h-11 items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-accent-deep hover:text-ink">
        {cta}
        <Icon name="arrow" className="h-3.5 w-3.5 rotate-90" />
      </a>
    </div>
  );
}
