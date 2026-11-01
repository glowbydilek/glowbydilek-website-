"use client";

import { inviteReviewAction, moderateReviewAction, replyReviewAction, reviewSettingsAction } from "@/lib/private/reviewActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, SubmitButton, Textarea } from "../ui";

export function ModerateButtons({ id, status }: { id: number; status: string }) {
  const ops: [string, string, "primary" | "outline" | "danger"][] =
    status === "published"
      ? [["remove", "Offline halen", "danger"]]
      : status === "pending"
        ? [
            ["publish", "Publiceren", "primary"],
            ["reject", "Afwijzen", "outline"],
          ]
        : [["pending", "Opnieuw beoordelen", "outline"]];
  return (
    <div className="flex flex-wrap gap-2">
      {ops.map(([op, label, variant]) => (
        <ActionForm key={op} action={moderateReviewAction} className="">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="op" value={op} />
          <SubmitButton variant={variant}>{label}</SubmitButton>
        </ActionForm>
      ))}
    </div>
  );
}

export function ReplyForm({ id, reply }: { id: number; reply: string | null }) {
  return (
    <details>
      <summary className="cursor-pointer text-sm text-accent-deep underline">{reply ? "Reactie wijzigen" : "Openbaar reageren"}</summary>
      <ActionForm action={replyReviewAction} className="mt-2 space-y-2">
        <input type="hidden" name="id" value={id} />
        <Textarea name="reply" rows={3} maxLength={1000} defaultValue={reply ?? ""} aria-label="Reactie" />
        <SubmitButton variant="outline">Reactie opslaan</SubmitButton>
      </ActionForm>
    </details>
  );
}

export function ReviewSettingsForm({ googleReviewUrl, invitesEnabled }: { googleReviewUrl: string; invitesEnabled: boolean }) {
  return (
    <ActionForm action={reviewSettingsAction} className="space-y-3">
      <Field label="Link naar je Google-beoordelingen (optioneel)" hint="Uit je Google Bedrijfsprofiel: ‘Vraag om beoordelingen’. Leeg = niet tonen.">
        <Input name="googleReviewUrl" type="url" defaultValue={googleReviewUrl} placeholder="https://g.page/r/…" />
      </Field>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" name="invitesEnabled" defaultChecked={invitesEnabled} className="h-5 w-5 accent-[var(--color-ink)]" />
        Knop ‘vraag om beoordeling’ tonen bij afgeronde afspraken
      </label>
      <SubmitButton variant="outline">Opslaan</SubmitButton>
    </ActionForm>
  );
}

export function InviteButton({ appointmentId }: { appointmentId: number }) {
  return (
    <ActionForm action={inviteReviewAction} className="">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <SubmitButton variant="outline" confirm="De klant per e-mail uitnodigen om een beoordeling te schrijven? (eenmalig, vrijblijvend, zonder beloning)">
        Om beoordeling vragen
      </SubmitButton>
    </ActionForm>
  );
}
