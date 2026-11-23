"use client";

import { redirectAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, SubmitButton } from "../ui";
import { useT } from "@/components/private/PanelLangProvider";

export function RedirectForm({ targets }: { targets: string[] }) {
  const t = useT();
  return (
    <ActionForm action={redirectAction} resetOnSuccess>
      <input type="hidden" name="op" value="save" />
      <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Oud adres" hint="Bijv. /oude-pagina"><Input name="from" required pattern="/.*" /></Field>
        <Field label="Nieuw adres">
          <select name="to" required className="block w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5">
            {targets.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <SubmitButton>{t("Doorverwijzing toevoegen")}</SubmitButton>
    </ActionForm>
  );
}

export function DeleteRedirect({ id }: { id: number }) {
  const t = useT();
  return (
    <ActionForm action={redirectAction} className="">
      <input type="hidden" name="op" value="delete" />
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost" className="min-h-9 px-3 text-xs" confirm="Verwijderen?">{t("Verwijderen")}</SubmitButton>
    </ActionForm>
  );
}
