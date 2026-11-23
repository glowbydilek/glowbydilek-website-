"use client";

import type { ConsultationSettings } from "@/lib/consultation/service";
import { consultationSettingsAction } from "@/lib/private/consultationActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, SubmitButton } from "../ui";
import { useT } from "@/components/private/PanelLangProvider";

export function ConsultationSettingsForm({ s }: { s: ConsultationSettings }) {
  const t = useT();
  const box = "mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]";
  return (
    <ActionForm action={consultationSettingsAction} className="space-y-4">
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consentConfirmed" defaultChecked={s.consentConfirmed} className={box} />
        <span>{t("Ik vraag elke klant vóór het vastleggen om")} <strong>{t("uitdrukkelijke toestemming")}</strong> {t("(de verklaring in het formulier) en leg alleen iets vast als die is gegeven. Een klant die weigert, wordt niet anders behandeld dan nodig voor haar veiligheid.")}</span>
      </label>
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="noticeConfirmed" defaultChecked={s.noticeConfirmed} className={box} />
        <span>{t("De klant krijgt vooraf uitleg waarom deze vragen nodig zijn en hoe lang de antwoorden bewaard blijven (de toelichting bij elke vraag en de privacyverklaring).")}</span>
      </label>
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="assessmentConfirmed" defaultChecked={s.assessmentConfirmed} className={box} />
        <span>{t("Ik heb de afweging hiernaast gelezen en laten controleren door een jurist of privacyadviseur, óf ik heb bewust besloten dat een DPIA voor mijn situatie niet verplicht is, en dat vastgelegd.")}</span>
      </label>
      <Field label="Bewaartermijn (maanden na laatste controle)" hint="Daarna worden de antwoorden automatisch verwijderd.">
        <Input name="retentionMonths" type="number" min={1} max={60} defaultValue={s.retentionMonths} className="max-w-[8rem]" />
      </Field>
      <SubmitButton>{t("Opslaan")}</SubmitButton>
    </ActionForm>
  );
}
