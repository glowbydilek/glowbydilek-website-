"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { TIME_RANGES, validateAppointment, type ErrorCode, type TimeRange } from "@/lib/forms/validation";
import { Icon } from "../ui/Icon";
import { Consent } from "./ContactForm";
import { Honeypot, omit, TextArea, TextField } from "./Fields";
import { FormError, FormSuccess } from "./FormStatus";
import { useFormSubmit } from "./useFormSubmit";

type Group = { id: string; name: string; treatments: { id: string; name: string }[] };

/**
 * Appointment REQUEST form. Sends the request to the studio mailbox and an
 * acknowledgement to the customer. It never shows availability or confirms
 * an appointment — Dilek confirms personally.
 */
export function AppointmentForm({
  locale,
  t,
  groups,
  privacyHref,
  email,
  notConfirmed,
}: {
  locale: "nl" | "en";
  t: Dictionary["forms"];
  groups: Group[];
  privacyHref: string;
  email: string;
  notConfirmed: string;
}) {
  const { state, submit, reset } = useFormSubmit("/api/appointment");
  const formRef = useRef<HTMLFormElement>(null);
  const ids = useMemo(() => groups.flatMap((g) => g.treatments.map((x) => x.id)), [groups]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const empty = { preferredDate: "", alternative: "", name: "", email: "", phone: "", notes: "" };
  const [values, setValues] = useState(empty);
  const [treatments, setTreatments] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange | "">("");
  const [privacy, setPrivacy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});

  const clear = (k: string) => errors[k] && setErrors((e) => omit(e, k));
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    clear(k);
  };
  const toggle = (id: string) => {
    setTreatments((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    clear("treatments");
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { ...values, treatments, timeRange, privacy, locale };
    const check = validateAppointment(payload, ids);
    if (!check.ok) {
      setErrors(check.errors);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    const ok = await submit(payload, honeypot);
    if (ok) {
      setValues(empty);
      setTreatments([]);
      setTimeRange("");
      setPrivacy(false);
    }
  }

  if (state.status === "success") {
    return (
      <FormSuccess
        title={t.status.appointmentTitle}
        body={t.status.appointmentBody}
        acknowledged={state.acknowledged}
        t={t}
        onReset={reset}
      />
    );
  }

  const serverFields = state.status === "error" ? state.fields : undefined;
  const fe = (k: string) => (errors[k] ? t.errors[errors[k]] : serverFields?.[k] ? t.errors[serverFields[k] as ErrorCode] : undefined);

  const chip = (on: boolean) =>
    `inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-deep ${
      on ? "border-forest bg-forest text-ivory" : "border-forest/15 bg-ivory-50 text-charcoal hover:border-forest/40"
    }`;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-9">
      <Honeypot value={honeypot} onChange={setHoneypot} />

      <fieldset aria-describedby={fe("treatments") ? "appt-treatments-error" : "appt-treatments-hint"}>
        <legend className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-forest">
          {t.treatments} <span aria-hidden="true" className="text-gold-deep">*</span>
        </legend>
        <p id="appt-treatments-hint" className="mt-1 text-sm text-muted">
          {t.treatmentsHint}
        </p>
        <div className="mt-4 space-y-5">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="font-serif text-xl text-forest">{g.name}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {g.treatments.map((tr) => {
                  const on = treatments.includes(tr.id);
                  return (
                    <label key={tr.id} className={chip(on)}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => toggle(tr.id)}
                        aria-invalid={fe("treatments") ? true : undefined}
                      />
                      {on && <Icon name="check" className="h-3.5 w-3.5" />}
                      {tr.name}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {fe("treatments") && (
          <p id="appt-treatments-error" className="mt-3 text-sm text-[#9b3b2f]">
            {fe("treatments")}
          </p>
        )}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="appt-date" label={t.preferredDate} required type="date" min={today} value={values.preferredDate} onChange={set("preferredDate")} error={fe("preferredDate")} />
        <fieldset aria-describedby={fe("timeRange") ? "appt-time-error" : undefined}>
          <legend className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-forest">
            {t.timeRange} <span aria-hidden="true" className="text-gold-deep">*</span>
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TIME_RANGES.map((r) => (
              <label key={r} className={`${chip(timeRange === r)} justify-center`}>
                <input
                  type="radio"
                  name="timeRange"
                  value={r}
                  className="sr-only"
                  checked={timeRange === r}
                  onChange={() => {
                    setTimeRange(r);
                    clear("timeRange");
                  }}
                />
                {t.timeRanges[r]}
              </label>
            ))}
          </div>
          {fe("timeRange") && (
            <p id="appt-time-error" className="mt-2 text-sm text-[#9b3b2f]">
              {fe("timeRange")}
            </p>
          )}
        </fieldset>
      </div>

      <TextField id="appt-alternative" label={t.alternative} optionalLabel={t.optional} placeholder={t.alternativePlaceholder} value={values.alternative} onChange={set("alternative")} error={fe("alternative")} maxLength={200} />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="appt-name" label={t.name} required autoComplete="name" value={values.name} onChange={set("name")} error={fe("name")} />
        <TextField id="appt-email" label={t.email} required type="email" inputMode="email" autoComplete="email" value={values.email} onChange={set("email")} error={fe("email")} />
        <TextField id="appt-phone" label={t.phone} optionalLabel={t.optional} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={set("phone")} error={fe("phone")} />
      </div>

      <TextArea id="appt-notes" label={t.notes} optionalLabel={t.optional} placeholder={t.notesPlaceholder} value={values.notes} onChange={set("notes")} error={fe("notes")} maxLength={1500} rows={4} />

      <Consent
        id="appt-privacy"
        checked={privacy}
        onChange={(v) => {
          setPrivacy(v);
          clear("privacy");
        }}
        t={t}
        privacyHref={privacyHref}
        error={fe("privacy")}
      />

      <p className="flex gap-3 rounded-2xl bg-gold/12 p-4 text-sm leading-relaxed text-charcoal-soft">
        <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
        {notConfirmed}
      </p>

      <FormError state={state} t={t} email={email} />

      <button
        type="submit"
        disabled={state.status === "sending"}
        className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-forest px-8 py-4 text-[0.74rem] font-medium uppercase tracking-[0.2em] text-ivory shadow-soft transition-colors duration-500 hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {state.status === "sending" ? t.sending : t.submitAppointment}
        <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      </button>
    </form>
  );
}
