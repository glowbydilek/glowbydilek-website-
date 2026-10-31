"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { CONTACT_TOPICS, validateContact, type ErrorCode } from "@/lib/forms/validation";
import { Icon } from "../ui/Icon";
import { Honeypot, omit, SelectField, TextArea, TextField } from "./Fields";
import { FormError, FormSuccess } from "./FormStatus";
import { useFormSubmit } from "./useFormSubmit";

type Props = {
  locale: "nl" | "en";
  t: Dictionary["forms"];
  privacyHref: string;
  email: string;
  defaultTopic?: (typeof CONTACT_TOPICS)[number];
};

export function ContactForm({ locale, t, privacyHref, email, defaultTopic }: Props) {
  const { state, submit, reset } = useFormSubmit("/api/contact");
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ name: "", email: "", phone: "", topic: defaultTopic ?? "", message: "" });
  const [privacy, setPrivacy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});

  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((e) => omit(e, k));
  };
  const err = (k: string) => (errors[k] ? t.errors[errors[k]] : undefined);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { ...values, privacy, locale };
    const check = validateContact(payload);
    if (!check.ok) {
      setErrors(check.errors);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    const ok = await submit(payload, honeypot);
    if (ok) {
      setValues({ name: "", email: "", phone: "", topic: defaultTopic ?? "", message: "" });
      setPrivacy(false);
    }
  }

  if (state.status === "success") {
    return (
      <FormSuccess
        title={t.status.contactTitle}
        body={t.status.contactBody}
        acknowledged={state.acknowledged}
        t={t}
        onReset={reset}
      />
    );
  }

  const serverFields = state.status === "error" ? state.fields : undefined;
  const fieldErr = (k: string) => err(k) ?? (serverFields?.[k] ? t.errors[serverFields[k] as ErrorCode] : undefined);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-6">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="contact-name" label={t.name} required autoComplete="name" value={values.name} onChange={set("name")} error={fieldErr("name")} />
        <TextField id="contact-email" label={t.email} required type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set("email")} error={fieldErr("email")} />
        <TextField id="contact-phone" label={t.phone} optionalLabel={t.optional} type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={set("phone")} error={fieldErr("phone")} />
        <SelectField id="contact-topic" label={t.topic} required value={values.topic} onChange={set("topic")} error={fieldErr("topic")}>
          <option value="" disabled>
            —
          </option>
          {CONTACT_TOPICS.map((k) => (
            <option key={k} value={k}>
              {t.topics[k]}
            </option>
          ))}
        </SelectField>
      </div>
      <TextArea id="contact-message" label={t.message} required placeholder={t.messagePlaceholder} value={values.message} onChange={set("message")} error={fieldErr("message")} maxLength={3000} />

      <Consent id="contact-privacy" checked={privacy} onChange={(v) => { setPrivacy(v); setErrors((e) => omit(e, "privacy")); }} t={t} privacyHref={privacyHref} error={fieldErr("privacy")} />

      <FormError state={state} t={t} email={email} />

      <button
        type="submit"
        disabled={state.status === "sending"}
        className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-forest px-8 py-4 text-[0.74rem] font-medium uppercase tracking-[0.2em] text-ivory shadow-soft transition-colors duration-500 hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {state.status === "sending" ? t.sending : t.submitContact}
        <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      </button>
    </form>
  );
}

export function Consent({
  id,
  checked,
  onChange,
  t,
  privacyHref,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  t: Dictionary["forms"];
  privacyHref: string;
  error?: string;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-forest)]"
        />
        <label htmlFor={id} className="text-sm leading-relaxed text-charcoal-soft">
          {t.privacy}{" "}
          <Link href={privacyHref} className="font-medium text-forest underline decoration-gold underline-offset-4" target="_blank">
            {t.privacyLink}
          </Link>
          . <span className="sr-only">({t.required})</span>
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#9b3b2f]">
          {error}
        </p>
      )}
    </div>
  );
}
