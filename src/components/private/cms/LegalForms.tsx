"use client";

import { legalStatusAction } from "@/lib/private/legalActions";
import { ActionForm } from "../ActionForm";
import { SubmitButton } from "../ui";

export function LegalToggle({ k, on }: { k: string; on: boolean }) {
  return (
    <ActionForm action={legalStatusAction} className="space-y-2">
      <input type="hidden" name="key" value={k} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <SubmitButton variant={on ? "outline" : "primary"}>{on ? "Offline halen" : "Online zetten"}</SubmitButton>
    </ActionForm>
  );
}
