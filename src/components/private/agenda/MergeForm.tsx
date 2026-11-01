"use client";

import { mergeCustomersAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { SubmitButton } from "../ui";

/** Manual merge: the owner chooses which profile is kept. Never automatic. */
export function MergeForm({ a, b }: { a: { id: number; label: string }; b: { id: number; label: string } }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        [b, a],
        [a, b],
      ].map(([from, into]) => (
        <ActionForm key={`${from.id}-${into.id}`} action={mergeCustomersAction} className="">
          <input type="hidden" name="fromId" value={from.id} />
          <input type="hidden" name="intoId" value={into.id} />
          <SubmitButton variant="outline" confirm={`${from.label} samenvoegen in ${into.label}? Alle afspraken, betalingen en facturen gaan naar ${into.label}. Dit kan niet automatisch worden teruggedraaid.`}>
            Bewaar {into.label}
          </SubmitButton>
        </ActionForm>
      ))}
    </div>
  );
}
