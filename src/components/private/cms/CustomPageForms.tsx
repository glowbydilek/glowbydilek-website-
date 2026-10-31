"use client";

import { createCustomPageAction, customPageSettingsAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, SubmitButton } from "../ui";

export function CreateCustomPage() {
  return (
    <ActionForm action={createCustomPageAction}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Titel (NL)"><Input name="titleNl" required maxLength={120} /></Field>
        <Field label="Titel (EN)"><Input name="titleEn" required maxLength={120} /></Field>
        <Field label="Adres (NL)" hint="Wordt /info/…"><Input name="slugNl" required pattern="[a-z0-9-]+" placeholder="cadeaubon" /></Field>
        <Field label="Adres (EN)" hint="Wordt /en/info/…"><Input name="slugEn" required pattern="[a-z0-9-]+" placeholder="gift-card" /></Field>
      </div>
      <SubmitButton>Pagina aanmaken</SubmitButton>
    </ActionForm>
  );
}

export function CustomPageSettings({ id, published, noindex }: { id: number; published: boolean; noindex: boolean }) {
  return (
    <>
      <ActionForm action={customPageSettingsAction}>
        <input type="hidden" name="id" value={id} />
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="published" defaultChecked={published} className="h-5 w-5" /> Pagina online</label>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="noindex" defaultChecked={noindex} className="h-5 w-5" /> Niet laten vinden in Google</label>
        <SubmitButton variant="outline">Opslaan</SubmitButton>
      </ActionForm>
      <ActionForm action={customPageSettingsAction} className="mt-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="op" value="delete" />
        <SubmitButton variant="danger" confirm="Deze pagina en al haar teksten definitief verwijderen?">Pagina verwijderen</SubmitButton>
      </ActionForm>
    </>
  );
}
