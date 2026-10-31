"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { Icon } from "../ui/Icon";
import type { SubmitState } from "./useFormSubmit";

export function FormSuccess({
  title,
  body,
  acknowledged,
  t,
  onReset,
}: {
  title: string;
  body: string;
  acknowledged: boolean;
  t: Dictionary["forms"];
  onReset: () => void;
}) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-start rounded-[1.75rem] bg-charcoal p-8 text-ivory sm:p-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-charcoal-deep">
        <Icon name="check" className="h-6 w-6" />
      </span>
      <h3 className="mt-6 font-serif text-4xl">{title}</h3>
      <p className="mt-4 max-w-xl leading-relaxed text-ivory/80">{body}</p>
      {!acknowledged && <p className="mt-3 text-sm text-ivory/65">{t.status.noAck}</p>}
      <button
        type="button"
        onClick={onReset}
        className="mt-8 rounded-full border border-ivory/35 px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-ivory hover:text-charcoal"
      >
        {t.status.again}
      </button>
    </div>
  );
}

export function FormError({ state, t, email }: { state: SubmitState; t: Dictionary["forms"]; email: string }) {
  if (state.status !== "error") return null;
  const map: Record<string, string> = {
    validation: t.errors.summary,
    unavailable: t.status.unavailable,
    sendFailed: t.status.sendFailed,
    rateLimited: t.status.rateLimited,
    challenge: t.status.challenge,
    duplicate: t.status.duplicate,
  };
  const message = map[state.error] ?? t.status.generic;
  const showEmail = !["validation", "rateLimited", "challenge", "duplicate"].includes(state.error);
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-[#9b3b2f]/30 bg-[#9b3b2f]/5 p-5 text-sm leading-relaxed text-[#7d2f25]">
      <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        {message}
        {showEmail && (
          <>
            {" "}
            <a href={`mailto:${email}`} className="font-medium underline underline-offset-4">
              {email}
            </a>
            .
          </>
        )}
      </p>
    </div>
  );
}
