"use client";

import { useState } from "react";
import { sectionsAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { SubmitButton } from "../ui";

export function SectionsEditor({ page, defs, order, hidden }: { page: string; defs: { id: string; label: string; locked?: boolean }[]; order: string[]; hidden: string[] }) {
  const [list, setList] = useState(() => {
    const ids = [...order.filter((id) => defs.some((d) => d.id === id)), ...defs.map((d) => d.id).filter((id) => !order.includes(id))];
    return ids.map((id) => defs.find((d) => d.id === id)!).sort((a, b) => Number(Boolean(b.locked)) - Number(Boolean(a.locked)));
  });
  const move = (i: number, d: number) => {
    const n = [...list];
    const j = i + d;
    if (j < 0 || j >= n.length || n[j].locked || n[i].locked) return;
    [n[i], n[j]] = [n[j], n[i]];
    setList(n);
  };
  return (
    <ActionForm action={sectionsAction}>
      <input type="hidden" name="page" value={page} />
      <ul className="space-y-2">
        {list.map((d, i) => (
          <li key={d.id} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
            <input type="hidden" name="order" value={d.id} />
            <label className="flex flex-1 items-center gap-3">
              <input type="checkbox" name={`show-${d.id}`} defaultChecked={d.locked || !hidden.includes(d.id)} disabled={d.locked} className="h-5 w-5" />
              <span>{d.label}</span>
              {d.locked && <span className="text-xs text-muted">(vast)</span>}
            </label>
            {!d.locked && (
              <span className="flex gap-1">
                <button type="button" aria-label={`${d.label} omhoog`} onClick={() => move(i, -1)} className="h-10 w-10 rounded-full hover:bg-ink/6">↑</button>
                <button type="button" aria-label={`${d.label} omlaag`} onClick={() => move(i, 1)} className="h-10 w-10 rounded-full hover:bg-ink/6">↓</button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <SubmitButton>Volgorde opslaan en publiceren</SubmitButton>
    </ActionForm>
  );
}
