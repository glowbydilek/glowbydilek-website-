"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { Honeypot, TextArea, TextField } from "./Fields";
import { Turnstile, useTurnstileToken } from "./Turnstile";
import { useFormSubmit } from "./useFormSubmit";
import { track } from "@/lib/analytics/track";

const noop = () => () => {};
function inviteToken(): string | null {
  const v = new URLSearchParams(window.location.search).get("t");
  return v && /^[A-Za-z0-9_-]{20,80}$/.test(v) ? v : null;
}

type Props = { locale: "nl" | "en"; t: Dictionary["reviews"]["form"]; forms: Dictionary["forms"]; privacyHref: string; email: string; turnstileSiteKey: string };

/** Review form. Reads an optional invitation token from the URL (?t=…) so the page itself can stay static. */
export function ReviewForm({ locale, t, forms, privacyHref, email, turnstileSiteKey }: Props) {
  const challenge = useTurnstileToken();
  const { state, submit } = useFormSubmit("/api/reviews");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"name" | "initials" | "anonymous">("name");
  const [mail, setMail] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const token = useSyncExternalStore(noop, inviteToken, () => null);

  const all = { ...(state.status === "error" ? (state.fields ?? {}) : {}), ...errors };
  const err = (k: string) => (all[k] ? (t.errors as Record<string, string>)[all[k]] ?? t.errors.required : undefined);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!rating) local.rating = "required";
    if (body.trim().length < 20) local.body = "tooShort";
    if (!name.trim()) local.displayName = "required";
    if (!privacy) local.privacy = "required";
    setErrors(local);
    if (Object.keys(local).length) return;
    if (!challenge.token) {
      challenge.setMissing(true);
      return;
    }
    const ok = await submit({ rating, body, displayName: name, displayMode: mode, email: mail, privacy, locale, inviteToken: token, turnstileToken: challenge.token }, honeypot);
    if (ok) track("review_submitted");
    challenge.renew();
  }


  if (state.status === "success")
    return (
      <p role="status" className="rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] p-6 text-lg">
        {t.success}
      </p>
    );

  const errorText =
    state.status === "error" && !state.fields
      ? state.error === "duplicate"
        ? t.duplicate
        : state.error === "rateLimited"
          ? t.rateLimited
          : t.error.replace("{email}", email)
      : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {token && <p className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm">{t.invited}</p>}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t.rating}</legend>
        <div role="radiogroup" aria-label={t.rating} className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" aria-label={t.stars[n - 1]} />
              <span aria-hidden="true" className={`grid h-11 w-11 place-items-center rounded-full text-2xl transition peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-accent)] ${n <= rating ? "text-[var(--color-accent)]" : "text-[var(--color-line-strong)]"}`}>
                ★
              </span>
            </label>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-sm text-[#9b3b2f]">{t.errors.required}</p>}
      </fieldset>
      <TextArea id="review-body" label={t.body} hint={t.bodyHint} required value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} rows={5} error={err("body")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="review-name" label={t.name} required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="given-name" error={err("displayName")} />
        <TextField id="review-email" label={t.email} type="email" value={mail} onChange={(e) => setMail(e.target.value)} autoComplete="email" error={err("email")} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t.display}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {(
            [
              ["name", t.displayName],
              ["initials", t.displayInitials],
              ["anonymous", t.displayAnonymous],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className="flex min-h-11 items-center gap-2">
              <input type="radio" name="displayMode" value={v} checked={mode === v} onChange={() => setMode(v)} className="h-5 w-5 accent-[var(--color-ink)]" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex gap-3 text-sm leading-relaxed">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-ink)]" aria-invalid={errors.privacy ? true : undefined} />
        <span>
          {t.privacy}{" "}
          <Link href={privacyHref} className="underline underline-offset-4">
            {t.privacyLink}
          </Link>
          .
        </span>
      </label>
      {errors.privacy && <p className="-mt-3 text-sm text-[#9b3b2f]">{t.errors.required}</p>}
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <div>
        <Turnstile
          siteKey={turnstileSiteKey}
          action="review"
          locale={locale}
          resetKey={challenge.resetKey}
          onToken={challenge.setToken}
          labels={{ title: forms.challengeLabel, loading: forms.challengeLoading, blocked: forms.challengeBlocked, email, unavailable: forms.status.unavailable }}
        />
        {challenge.missing && (
          <p role="alert" className="mt-2 text-sm text-[#9b3b2f]">
            {forms.errors.challenge}
          </p>
        )}
      </div>
      {errorText && (
        <p role="alert" className="text-sm text-[#9b3b2f]">
          {errorText}
        </p>
      )}
      <button type="submit" disabled={state.status === "sending"} className="btn btn-primary">
        {state.status === "sending" ? t.sending : t.submit}
      </button>
    </form>
  );
}
