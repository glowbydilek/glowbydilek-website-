"use client";

import { track } from "@/lib/analytics/track";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { Icon } from "../ui/Icon";
import { Consent } from "./ContactForm";
import { Honeypot, TextArea, TextField } from "./Fields";
import { Turnstile, useTurnstileToken } from "./Turnstile";

export type JourneyTreatment = { id: string; name: string; category: string; duration: number; price: string | null };
type Day = { date: string; times: string[] };

/**
 * Availability-aware appointment request: treatment → day → exact time →
 * details. Submitting creates a PENDING request; Dilek confirms personally.
 */
export function BookingJourney({
  locale,
  t,
  forms,
  treatments,
  categories,
  privacyHref,
  email,
  turnstileSiteKey,
  promoField = false,
}: {
  locale: "nl" | "en";
  t: Dictionary["booking"]["journey"];
  forms: Dictionary["forms"];
  treatments: JourneyTreatment[];
  categories: Record<string, string>;
  privacyHref: string;
  email: string;
  turnstileSiteKey: string;
  promoField?: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState<Day[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "", note: "", promoCode: "" });
  const [privacy, setPrivacy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const challenge = useTurnstileToken();
  const started = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    started.current = Date.now();
    const p = new URLSearchParams(window.location.search);
    const wanted = p.get("behandeling") ?? p.get("treatment");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after hydration
    if (wanted && treatments.some((x) => x.id === wanted)) setPicked([wanted]);
  }, [treatments]);

  const duration = useMemo(() => treatments.filter((x) => picked.includes(x.id)).reduce((s, x) => s + x.duration, 0), [picked, treatments]);

  const load = useCallback(async () => {
    if (!picked.length) return setDays(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/booking/availability?treatments=${picked.join(",")}&from=${from}`);
      const data = (await r.json()) as { ok?: boolean; days?: Day[] };
      setDays(data.ok ? (data.days ?? []) : []);
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [picked, from]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload availability when the selection changes
    load();
    setDate(null);
    setTime(null);
  }, [load]);

  const fmtDay = (d: string) =>
    new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const shift = (n: number) => {
    const d = new Date(`${from}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    const today = new Date().toISOString().slice(0, 10);
    setFrom(d.toISOString().slice(0, 10) < today ? today : d.toISOString().slice(0, 10));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current || !date || !time) return;
    const errs: Record<string, string> = {};
    if (!values.firstName.trim()) errs.firstName = forms.errors.required;
    if (!values.lastName.trim()) errs.lastName = forms.errors.required;
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(values.email.trim())) errs.email = forms.errors.invalid;
    if (!/^\+?[0-9][0-9 ()-]{5,19}$/.test(values.phone.trim())) errs.phone = values.phone.trim() ? forms.errors.invalid : forms.errors.required;
    if (!privacy) errs.privacy = forms.errors.consent;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    if (!challenge.token) {
      challenge.setMissing(true);
      return;
    }
    inFlight.current = true;
    setStatus("sending");
    setError(null);
    try {
      const r = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, treatments: picked, date, time, privacy, locale, company: honeypot, elapsedMs: Date.now() - started.current, turnstileToken: challenge.token }),
      });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, string> };
      if (r.ok && data.ok) {
        setStatus("done");
        track("booking_submitted", { form: "online" });
        return;
      }
      setStatus("error");
      if (data.error === "slotTaken") {
        setError(t.slotTaken);
        setTime(null);
        load();
      } else {
        if (data.fields?.promoCode) setFieldErrors({ promoCode: forms.errors.promoCode });
        const map: Record<string, string> = { rateLimited: forms.status.rateLimited, challenge: forms.status.challenge, duplicate: forms.status.duplicate, validation: forms.errors.summary };
        setError(map[data.error ?? ""] ?? `${forms.status.generic} ${email}.`);
      }
    } catch {
      setStatus("error");
      setError(`${forms.status.generic} ${email}.`);
    } finally {
      inFlight.current = false;
      challenge.renew();
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="rounded-[1.75rem] bg-ink p-8 text-paper sm:p-12">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-ink"><Icon name="check" className="h-6 w-6" /></span>
        <h3 className="mt-6 font-serif text-4xl">{t.successTitle}</h3>
        <p className="mt-4 max-w-xl leading-relaxed text-paper/80">{t.successBody}</p>
      </div>
    );
  }

  const chip = (on: boolean) =>
    `inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-deep ${on ? "border-ink bg-ink text-paper" : "border-ink/15 bg-surface text-ink hover:border-ink/40"}`;
  const selectedDay = days?.find((d) => d.date === date);

  return (
    <form onSubmit={submit} noValidate className="space-y-9">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <fieldset>
        <legend className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink">1 · {t.step1}</legend>
        <div className="mt-4 space-y-4">
          {Object.entries(categories).map(([cat, label]) => {
            const items = treatments.filter((x) => x.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <p className="font-serif text-xl text-ink">{label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {items.map((x) => {
                    const on = picked.includes(x.id);
                    return (
                      <label key={x.id} className={chip(on)}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => setPicked((p) => (on ? p.filter((i) => i !== x.id) : [...p, x.id]))} />
                        {on && <Icon name="check" className="h-3.5 w-3.5" />}
                        {x.name}
                        <span className={`text-xs ${on ? "text-paper/70" : "text-muted"}`}>{x.duration} {t.minutes}{x.price ? ` · ${x.price}` : ""}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {picked.length > 0 && (
        <fieldset>
          <legend className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink">2 · {t.step2} <span className="normal-case tracking-normal text-muted">({t.duration} {duration} {t.minutes})</span></legend>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => shift(-14)} className="min-h-11 rounded-full border border-ink/15 px-4 text-sm">‹ {t.earlier}</button>
            <button type="button" onClick={() => shift(14)} className="min-h-11 rounded-full border border-ink/15 px-4 text-sm">{t.later} ›</button>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-muted" role="status">{t.loading}</p>
          ) : days && days.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-glow-soft p-4 text-sm text-ink-soft">
              {t.noTimes} <Link href={locale === "nl" ? "/contact" : "/en/contact"} className="underline">{forms.topics.question}</Link>
            </p>
          ) : (
            <>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label={t.step2}>
                {(days ?? []).map((d) => (
                  <button key={d.date} type="button" role="option" aria-selected={date === d.date} onClick={() => { if (!date) track("booking_start", { form: "online" }); setDate(d.date); setTime(null); }} className={`min-h-14 shrink-0 rounded-2xl border px-4 text-sm capitalize ${date === d.date ? "border-ink bg-ink text-paper" : "border-ink/15 bg-surface"}`}>
                    {fmtDay(d.date)}
                  </button>
                ))}
              </div>
              {selectedDay && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6" role="listbox" aria-label={fmtDay(selectedDay.date)}>
                  {selectedDay.times.map((tm) => (
                    <button key={tm} type="button" role="option" aria-selected={time === tm} onClick={() => setTime(tm)} className={`min-h-11 rounded-full border text-sm ${time === tm ? "border-ink bg-ink text-paper" : "border-ink/15 bg-surface"}`}>
                      {tm}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </fieldset>
      )}

      {date && time && (
        <fieldset className="space-y-6">
          <legend className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink">3 · {t.step3}</legend>
          <p className="flex items-center justify-between gap-3 rounded-2xl bg-accent/12 p-4 text-sm">
            <span><strong className="font-medium">{t.selected}:</strong> <span className="capitalize">{fmtDay(date)}</span> · {time}</span>
            <button type="button" onClick={() => setTime(null)} className="underline">{t.change}</button>
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField id="bk-first" label={t.firstName} required autoComplete="given-name" value={values.firstName} onChange={(e) => setValues({ ...values, firstName: e.target.value })} error={fieldErrors.firstName} />
            <TextField id="bk-last" label={t.lastName} required autoComplete="family-name" value={values.lastName} onChange={(e) => setValues({ ...values, lastName: e.target.value })} error={fieldErrors.lastName} />
            <TextField id="bk-email" label={t.email} required type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} error={fieldErrors.email} />
            <TextField id="bk-phone" label={t.phone} required type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} error={fieldErrors.phone} />
          </div>
          {promoField && (
            <TextField id="bk-promo" label={forms.promoCode} value={values.promoCode} onChange={(e) => setValues({ ...values, promoCode: e.target.value })} error={fieldErrors.promoCode} maxLength={30} autoComplete="off" />
          )}
          <TextArea id="bk-note" label={t.note} placeholder={t.notePlaceholder} value={values.note} onChange={(e) => setValues({ ...values, note: e.target.value })} maxLength={1000} rows={3} />
          <Consent id="bk-privacy" checked={privacy} onChange={setPrivacy} t={forms} privacyHref={privacyHref} error={fieldErrors.privacy} />
          <div>
            <Turnstile siteKey={turnstileSiteKey} action="booking" locale={locale} resetKey={challenge.resetKey} onToken={challenge.setToken} labels={{ title: forms.challengeLabel, loading: forms.challengeLoading, blocked: forms.challengeBlocked, email, unavailable: forms.status.unavailable }} />
            {challenge.missing && <p role="alert" className="mt-2 text-sm text-[#9b3b2f]">{forms.errors.challenge}</p>}
          </div>
          <p className="flex gap-3 rounded-2xl bg-accent/12 p-4 text-sm leading-relaxed text-ink-soft"><Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-accent-deep" />{t.pending}</p>
          {error && <p role="alert" className="rounded-2xl border border-[#9b3b2f]/30 bg-[#9b3b2f]/5 p-4 text-sm text-[#7d2f25]">{error}</p>}
          <button type="submit" disabled={status === "sending"} className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink px-8 py-4 text-[0.74rem] font-medium uppercase tracking-[0.2em] text-paper disabled:opacity-70 sm:w-auto">
            {status === "sending" ? t.sending : t.submit}
            <Icon name="arrow" className="h-4 w-4" />
          </button>
        </fieldset>
      )}
    </form>
  );
}
