"use client";

import { useActionState } from "react";
import { respondQuoteAction, type QuoteState } from "@/lib/forms/quoteActions";

export type QuoteLabels = {
  accept: string;
  decline: string;
  pending: string;
  accepted: string;
  declined: string;
  errors: Record<NonNullable<QuoteState["error"]>, string>;
};

/** Accept / decline buttons for a price proposal (works as a plain form post). */
export function QuoteResponse({ token, t }: { token: string; t: QuoteLabels }) {
  const [state, run, pending] = useActionState<QuoteState, FormData>(respondQuoteAction, {});
  if (state.done) {
    return (
      <p role="status" className="rounded-2xl bg-glow-soft p-5 leading-relaxed text-ink">
        {state.done === "accepted" ? t.accepted : t.declined}
      </p>
    );
  }
  return (
    <form action={run} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <p role="alert" className="rounded-2xl border border-[#8e2f24]/40 bg-paper p-4 text-sm text-[#8e2f24]">
          {t.errors[state.error]}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button name="decision" value="accept" disabled={pending} className="btn btn-primary">
          {pending ? t.pending : t.accept}
        </button>
        <button name="decision" value="decline" disabled={pending} className="btn btn-outline">
          {t.decline}
        </button>
      </div>
    </form>
  );
}
