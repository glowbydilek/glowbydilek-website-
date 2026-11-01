import { Fragment, type ReactNode } from "react";
import { override } from "./current";
import { PAGE_SECTIONS } from "./registry";

/**
 * Renders page sections in the owner's chosen order, without hidden ones.
 * Reordering happens in the DOM (not with CSS order), so keyboard and
 * screen-reader order always match what is shown. Locked sections (the
 * opening hero) always stay first and visible.
 */
export function arrangeSections(page: string, sections: Record<string, ReactNode>): ReactNode {
  const defs = PAGE_SECTIONS[page] ?? [];
  const o = (override(`sections:${page}`, "all") ?? {}) as { order?: string[]; hidden?: string[] };
  const known = defs.map((d) => d.id);
  const order = [...(o.order ?? []).filter((id) => known.includes(id)), ...known.filter((id) => !(o.order ?? []).includes(id))];
  const locked = defs.filter((d) => d.locked).map((d) => d.id);
  const sorted = [...locked, ...order.filter((id) => !locked.includes(id))];
  const hidden = new Set((o.hidden ?? []).filter((id) => !locked.includes(id)));
  return sorted.filter((id) => !hidden.has(id) && sections[id] !== undefined).map((id) => <Fragment key={id}>{sections[id]}</Fragment>);
}
