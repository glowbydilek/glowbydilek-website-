"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { Icon } from "./ui/Icon";

type Group = { id: string; name: string; treatments: { id: string; name: string }[] };

/**
 * Contact-based appointment request.
 *
 * Builds a pre-filled email in the visitor's own mail app (mailto:).
 * Nothing is submitted to or stored by this website — the visitor reviews
 * and sends the email themselves. Replace with the real booking flow once
 * the secure backend exists (see docs/ARCHITECTURE.md).
 */
export function RequestComposer({ t, groups, email }: { t: Dictionary["request"]; groups: Group[]; email: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [moments, setMoments] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    groups.forEach((g) => g.treatments.forEach((tr) => m.set(tr.id, `${tr.name} (${g.name})`)));
    return m;
  }, [groups]);

  const mailHref = useMemo(() => {
    const m = t.mail;
    const lines = [
      m.greeting,
      "",
      m.intro,
      "",
      `${m.treatments}: ${selected.length ? selected.map((id) => nameById.get(id)).join(", ") : m.none}`,
      `${m.moments}: ${moments.trim() || "-"}`,
      ...(note.trim() ? [`${m.note}: ${note.trim()}`] : []),
      "",
      m.closing,
      m.namePlaceholder,
    ];
    return `mailto:${email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }, [t, selected, moments, note, nameById, email]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the address is visible anyway */
    }
  };

  const field =
    "mt-3 w-full rounded-2xl border border-espresso/15 bg-ivory px-5 py-4 text-base text-espresso placeholder:text-espresso-muted/70 transition-colors focus:border-champagne-deep focus:outline-none";

  return (
    <div className="rounded-[2rem] bg-ivory p-6 shadow-card sm:p-10">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2 className="display mt-4 text-4xl sm:text-5xl">{t.title}</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-espresso-soft">{t.intro}</p>

      <fieldset className="mt-10">
        <legend className="flex w-full items-baseline justify-between text-sm font-medium uppercase tracking-[0.16em] text-espresso">
          {t.treatmentsLabel}
          {selected.length > 0 && (
            <span className="text-xs normal-case tracking-normal text-champagne-deep">
              {selected.length} {t.selected}
            </span>
          )}
        </legend>
        <div className="mt-5 space-y-6">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="font-serif text-xl">{g.name}</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {g.treatments.map((tr) => {
                  const on = selected.includes(tr.id);
                  return (
                    <label
                      key={tr.id}
                      className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-champagne-deep ${
                        on
                          ? "border-espresso bg-espresso text-ivory"
                          : "border-espresso/15 bg-ivory-100 text-espresso hover:border-espresso/40"
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(tr.id)} />
                      <span className="inline-flex items-center gap-2">
                        {on && <Icon name="check" className="h-3.5 w-3.5" />}
                        {tr.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium uppercase tracking-[0.16em]">{t.momentsLabel}</span>
          <textarea
            rows={3}
            value={moments}
            onChange={(e) => setMoments(e.target.value)}
            placeholder={t.momentsPlaceholder}
            className={field}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium uppercase tracking-[0.16em]">{t.noteLabel}</span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholder}
            className={field}
          />
        </label>
      </div>

      <div className="mt-10 flex flex-col gap-5 border-t border-espresso/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
        <a
          href={mailHref}
          className="group inline-flex shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-espresso px-8 py-4 text-[0.74rem] font-medium uppercase tracking-[0.2em] text-ivory shadow-soft transition-colors duration-500 hover:bg-champagne-deep"
        >
          <Icon name="mail" className="h-4 w-4" />
          {t.submit}
        </a>
        <p className="flex max-w-md items-start gap-3 text-sm leading-relaxed text-espresso-muted">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-champagne-deep" />
          {t.disclaimer}
        </p>
      </div>
      <p className="mt-6 text-sm text-espresso-muted">
        {t.fallback}{" "}
        <a href={`mailto:${email}`} className="font-medium text-espresso underline decoration-champagne underline-offset-4">
          {email}
        </a>
        <button
          type="button"
          onClick={copy}
          className="ml-3 rounded-full border border-espresso/15 px-3 py-1 text-xs transition-colors hover:border-espresso/40"
          aria-live="polite"
        >
          {copied ? t.copied : t.copy}
        </button>
      </p>
    </div>
  );
}
