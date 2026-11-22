"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createAppointmentAction } from "@/lib/private/agendaActions";
import { centsToInput, formatCents } from "@/lib/finance/money";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export type PickTreatment = { id: string; name: string; category: string; duration: number | null; buffer: number; priceCents: number | null };
type Known = { id: number; firstName: string; lastName: string; email: string | null; phone: string | null; locale: string };
type Suggestion = Known & { strong: boolean; reason: string };

function addMinutes(t: string, m: number) {
  const [h, mi] = t.split(":").map(Number);
  if (Number.isNaN(h)) return "";
  const total = h * 60 + mi + m;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * New appointment. While Dilek types a phone number, email or full name,
 * existing profiles are suggested (normalised matching on the server). She
 * picks the existing customer, or explicitly confirms a new one: profiles
 * are never merged automatically.
 */
export function NewAppointmentForm({ treatments, day, timeValue, customer }: { treatments: PickTreatment[]; day: string; timeValue?: string; customer?: Known }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [start, setStart] = useState(timeValue ?? "09:00");
  const [manualDuration, setManualDuration] = useState("");
  const [selected, setSelected] = useState<Known | null>(customer ?? null);
  const [person, setPerson] = useState({ firstName: customer?.firstName ?? "", lastName: customer?.lastName ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "" });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [forceNew, setForceNew] = useState(false);
  const [price, setPrice] = useState<string | null>(null);

  const rows = treatments.filter((t) => picked.includes(t.id));
  const auto = useMemo(() => (!rows.length || rows.some((r) => !r.duration) ? null : rows.reduce((s, r) => s + (r.duration ?? 0), 0)), [rows]);
  const listPrice = !rows.length || rows.some((r) => r.priceCents == null) ? null : rows.reduce((s, r) => s + (r.priceCents ?? 0), 0);
  const duration = Number(manualDuration) || auto || 0;
  // `category` is the display group label (waxing zone or service section), in catalogue order.
  const groups = [...new Set(treatments.map((t) => t.category))].map((label) => ({ id: label, label, items: treatments.filter((t) => t.category === label) }));

  // Returning-customer recognition (debounced, owner-only endpoint).
  useEffect(() => {
    if (selected) return;
    const { phone, email, firstName, lastName } = person;
    const enough = phone.replace(/\D/g, "").length >= 9 || /@.+\./.test(email) || (firstName.length > 1 && lastName.length > 1);
    if (!enough) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const q = new URLSearchParams({ phone, email, first: firstName, last: lastName });
        const r = await fetch(`/agenda/klanten/zoeken?${q}`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        if (r.ok) setSuggestions(((await r.json()) as { matches: Suggestion[] }).matches);
      } catch {
        /* typing on; ignore aborted lookups */
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [person, selected]);
  const visibleSuggestions = selected ? [] : suggestions;

  const set = (k: keyof typeof person) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerson((p) => ({ ...p, [k]: e.target.value }));
    setForceNew(false);
  };
  const strongMatch = visibleSuggestions.some((s) => s.strong);

  return (
    <ActionForm action={createAppointmentAction} className="space-y-6">
      {selected && (
        <>
          <input type="hidden" name="customerId" value={selected.id} />
          <input type="hidden" name="firstName" value={selected.firstName} />
          <input type="hidden" name="lastName" value={selected.lastName} />
          <input type="hidden" name="email" value={selected.email ?? ""} />
          <input type="hidden" name="phone" value={selected.phone ?? ""} />
          <input type="hidden" name="locale" value={selected.locale} />
        </>
      )}
      {forceNew && <input type="hidden" name="forceNew" value="on" />}

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">Klant</legend>
        {selected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/20 bg-surface p-4">
            <div className="min-w-0">
              <p className="font-medium">
                {selected.firstName} {selected.lastName}
              </p>
              <p className="break-words text-sm text-muted">{[selected.phone, selected.email].filter(Boolean).join(" · ") || "Geen contactgegevens"}</p>
              <p className="mt-1 text-xs text-muted">Bestaande klant: de afspraak komt in dit klantprofiel.</p>
            </div>
            {!customer && (
              <button type="button" onClick={() => setSelected(null)} className="min-h-11 rounded-full border border-ink/20 px-4 text-sm">
                Andere klant
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
              <Field label="Telefoonnummer" htmlFor="phone" hint="Een bekend nummer of e-mailadres wordt herkend.">
                <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="off" value={person.phone} onChange={set("phone")} />
              </Field>
              <Field label="E-mailadres" htmlFor="email" hint="Nodig voor bevestiging en herinnering.">
                <Input id="email" name="email" type="email" inputMode="email" autoComplete="off" value={person.email} onChange={set("email")} />
              </Field>
              <Field label="Voornaam" htmlFor="firstName">
                <Input id="firstName" name="firstName" required autoComplete="off" value={person.firstName} onChange={set("firstName")} />
              </Field>
              <Field label="Achternaam" htmlFor="lastName">
                <Input id="lastName" name="lastName" autoComplete="off" value={person.lastName} onChange={set("lastName")} />
              </Field>
              <Field label="Taal van de e-mails" htmlFor="locale">
                <Select id="locale" name="locale" defaultValue="nl">
                  <option value="nl">Nederlands</option>
                  <option value="en">Engels</option>
                </Select>
              </Field>
            </div>
            {visibleSuggestions.length > 0 && (
              <div role="status" className="space-y-2 rounded-2xl border border-accent/60 bg-[#fbf3e4] p-4">
                <p className="text-sm font-medium">Bestaande klant{visibleSuggestions.length > 1 ? "en" : ""} gevonden</p>
                <ul className="space-y-2">
                  {visibleSuggestions.map((sg) => (
                    <li key={sg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
                      <span className="min-w-0 text-sm">
                        <strong>
                          {sg.firstName} {sg.lastName}
                        </strong>
                        <span className="block break-words text-muted">{[sg.phone, sg.email].filter(Boolean).join(" · ")}</span>
                        <span className="block text-xs text-muted">{sg.reason}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(sg);
                          setForceNew(false);
                        }}
                        className="min-h-11 rounded-full bg-ink px-4 text-sm text-paper"
                      >
                        Deze klant gebruiken
                      </button>
                    </li>
                  ))}
                </ul>
                {strongMatch && (
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input type="checkbox" checked={forceNew} onChange={(e) => setForceNew(e.target.checked)} className="h-5 w-5 accent-[var(--color-ink)]" />
                    Nee, dit is een andere persoon: maak een nieuw klantprofiel
                  </label>
                )}
              </div>
            )}
          </>
        )}
      </fieldset>

      <TreatmentPicker treatments={treatments} groups={groups} picked={picked} setPicked={setPicked} auto={auto} listPrice={listPrice} />

      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-3">
        <Field label="Datum" htmlFor="day">
          <Input id="day" name="day" type="date" required defaultValue={day} />
        </Field>
        <Field label="Begintijd" htmlFor="time">
          <Input id="time" name="time" type="time" step={300} required value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Duur (minuten)" hint={auto ? `Automatisch: ${auto} min` : "Niet alle behandelingen hebben een vaste duur — vul hem in."} htmlFor="duration">
          <Input id="duration" name="duration" type="number" min={5} max={600} step={5} inputMode="numeric" placeholder={auto ? String(auto) : "bijv. 45"} value={manualDuration} onChange={(e) => setManualDuration(e.target.value)} />
        </Field>
      </div>
      <p className="rounded-xl bg-surface px-4 py-3 text-sm">
        Eindtijd: <strong>{duration ? addMinutes(start, duration) : "—"}</strong>
      </p>

      <Field
        label="Afgesproken prijs (optioneel)"
        htmlFor="price"
        hint={listPrice != null ? `Volgens je prijslijst: ${formatCents(listPrice)}. Pas aan als je iets anders hebt afgesproken.` : "Geen vaste prijs ingesteld voor deze keuze. Laat leeg als je het nog niet weet."}
      >
        <Input id="price" name="price" inputMode="decimal" placeholder={listPrice != null ? centsToInput(listPrice) : "bijv. 45,00"} value={price ?? (listPrice != null ? centsToInput(listPrice) : "")} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      <Field label="Interne notitie (alleen voor jou)" hint="Geen gezondheidsinformatie: daarvoor is het consultatieformulier." htmlFor="internalNote">
        <Textarea id="internalNote" name="internalNote" rows={3} maxLength={2000} />
      </Field>
      <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-soft">
        {selected?.email || person.email
          ? "De klant krijgt automatisch een bevestiging per e-mail, en een herinnering vóór de afspraak."
          : "Zonder e-mailadres kan er geen bevestiging of herinnering worden verstuurd. Laat het de klant dan zelf weten."}
      </p>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="allowOutsideHours" className="h-5 w-5 accent-[var(--color-ink)]" />
        <span>Toestaan buiten mijn werktijden</span>
      </label>
      <SubmitButton className="w-full sm:w-auto" pending="Bezig met opslaan…" disabled={!selected && strongMatch && !forceNew}>
        Afspraak opslaan
      </SubmitButton>
      {!selected && strongMatch && !forceNew && <p className="text-sm text-muted">Kies het bestaande klantprofiel, of geef aan dat het een andere persoon is.</p>}
    </ActionForm>
  );
}

/**
 * Treatment picker: search, collapsible categories and equal-size cards.
 * Every checkbox stays in the DOM (hidden when filtered out), so a search
 * never drops an already selected treatment from the submitted form.
 * Missing durations/prices are shown as "not set yet", never as a value.
 */
function TreatmentPicker({
  treatments,
  groups,
  picked,
  setPicked,
  auto,
  listPrice,
}: {
  treatments: PickTreatment[];
  groups: { id: string; label: string; items: PickTreatment[] }[];
  picked: string[];
  setPicked: (fn: (p: string[]) => string[]) => void;
  auto: number | null;
  listPrice: number | null;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLocaleLowerCase("nl");
  const match = (t: PickTreatment) => !needle || t.name.toLocaleLowerCase("nl").includes(needle) || t.category.toLocaleLowerCase("nl").includes(needle);
  const rows = picked.map((id) => treatments.find((t) => t.id === id)).filter((t): t is PickTreatment => Boolean(t));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const missing = rows.some((r) => !r.duration || r.priceCents == null);

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">Behandeling(en)</legend>
      <div className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek een behandeling…"
          aria-label="Zoek een behandeling"
          enterKeyHint="search"
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus-visible:border-ink"
        />
      </div>

      <div className="space-y-2">
        {groups.map((g) => {
          const visible = g.items.filter(match);
          const count = g.items.filter((t) => picked.includes(t.id)).length;
          return (
            <details
              key={g.id}
              open={Boolean(needle) || count > 0 || groups.length <= 2}
              className={`group rounded-2xl border border-line bg-white ${needle && !visible.length ? "hidden" : ""}`}
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 truncate">{g.label}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  {count > 0 && <span className="rounded-full bg-ink px-2 py-0.5 font-semibold text-paper">{count}</span>}
                  <span>{g.items.length}</span>
                  <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
                </span>
              </summary>
              <div className="grid grid-cols-1 gap-2 px-3 pb-3 min-[420px]:grid-cols-2">
                {g.items.map((t) => {
                  const on = picked.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        on ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40"
                      } ${match(t) ? "" : "hidden"}`}
                    >
                      <input type="checkbox" name="treatments" value={t.id} checked={on} onChange={() => toggle(t.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-medium leading-snug">{t.name}</span>
                        <span className={`mt-0.5 block text-xs ${on ? "text-paper/75" : "text-muted"}`}>
                          {t.duration ? `${t.duration} min` : "duur nog niet ingesteld"}
                          {" · "}
                          {t.priceCents != null ? formatCents(t.priceCents) : "prijs op aanvraag"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </details>
          );
        })}
        {needle && !treatments.some(match) && <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">Geen behandeling gevonden voor “{q}”.</p>}
      </div>

      {rows.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
          <p className="mb-2 font-medium text-ink">Gekozen ({rows.length})</p>
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 break-words">{r.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                  <span>{r.duration ? `${r.duration} min` : "—"}</span>
                  <span>{r.priceCents != null ? formatCents(r.priceCents) : "—"}</span>
                  <button type="button" onClick={() => toggle(r.id)} aria-label={`${r.name} verwijderen`} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/6">
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between border-t border-line pt-2 font-medium">
            <span>Totaal</span>
            <span>
              {auto ? `${auto} min` : "duur zelf invullen"} · {listPrice != null ? formatCents(listPrice) : "prijs zelf afspreken"}
            </span>
          </p>
          {missing && (
            <p className="mt-2 text-xs text-muted">
              Niet alle duur/prijzen zijn ingesteld.{" "}
              <Link href="/admin/behandelingen" className="underline">
                Stel ze in bij Behandelingen &amp; prijzen
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
