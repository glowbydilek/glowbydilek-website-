"use client";

import { useMemo, useState } from "react";
import { createAppointmentAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export type PickTreatment = { id: string; name: string; category: string; duration: number | null; buffer: number };
const CAT: Record<string, string> = { face: "Gezicht", body: "Lichaam", intimate: "Bikini & intiem" };

function addMinutes(t: string, m: number) {
  const [h, mi] = t.split(":").map(Number);
  if (Number.isNaN(h)) return "";
  const total = h * 60 + mi + m;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function NewAppointmentForm({
  treatments,
  day,
  timeValue,
  customer,
}: {
  treatments: PickTreatment[];
  day: string;
  timeValue?: string;
  customer?: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null; locale: string };
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [start, setStart] = useState(timeValue ?? "09:00");
  const [manualDuration, setManualDuration] = useState("");
  const [email, setEmail] = useState(customer?.email ?? "");
  const auto = useMemo(() => {
    const rows = treatments.filter((t) => picked.includes(t.id));
    if (!rows.length || rows.some((r) => !r.duration)) return null;
    return rows.reduce((s, r) => s + (r.duration ?? 0), 0);
  }, [picked, treatments]);
  const duration = Number(manualDuration) || auto || 0;
  const groups = Object.entries(CAT).map(([id, label]) => ({ id, label, items: treatments.filter((t) => t.category === id) }));

  return (
    <ActionForm action={createAppointmentAction} className="space-y-6">
      {customer && <input type="hidden" name="customerId" value={customer.id} />}
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">Behandeling(en)</legend>
        {groups.map((g) => (
          <div key={g.id}>
            <p className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted">{g.label}</p>
            <div className="flex flex-wrap gap-2">
              {g.items.map((t) => {
                const on = picked.includes(t.id);
                return (
                  <label key={t.id} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${on ? "border-charcoal bg-charcoal text-ivory" : "border-stone bg-white"}`}>
                    <input type="checkbox" name="treatments" value={t.id} checked={on} onChange={() => setPicked((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))} className="sr-only" />
                    {t.name}
                    <span className={`text-xs ${on ? "text-ivory/70" : "text-muted"}`}>{t.duration ? `${t.duration} min` : "duur?"}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

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
      <p className="rounded-xl bg-ivory-50 px-4 py-3 text-sm">
        Eindtijd: <strong>{duration ? addMinutes(start, duration) : "—"}</strong>
      </p>

      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Voornaam" htmlFor="firstName">
          <Input id="firstName" name="firstName" required autoComplete="off" defaultValue={customer?.firstName} />
        </Field>
        <Field label="Achternaam" htmlFor="lastName">
          <Input id="lastName" name="lastName" autoComplete="off" defaultValue={customer?.lastName} />
        </Field>
        <Field label="Telefoonnummer" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={customer?.phone ?? ""} />
        </Field>
        <Field label="E-mailadres" htmlFor="email" hint="Nodig om een bevestiging en herinnering te sturen.">
          <Input id="email" name="email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Taal van de e-mails" htmlFor="locale">
          <Select id="locale" name="locale" defaultValue={customer?.locale ?? "nl"}>
            <option value="nl">Nederlands</option>
            <option value="en">Engels</option>
          </Select>
        </Field>
      </div>
      <Field label="Interne notitie (alleen voor jou)" hint="Geen medische details opslaan." htmlFor="internalNote">
        <Textarea id="internalNote" name="internalNote" rows={3} maxLength={2000} />
      </Field>
      <div className="space-y-2">
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="notify" defaultChecked disabled={!email} className="h-5 w-5 accent-[var(--color-charcoal)]" />
          <span className={email ? "" : "text-muted"}>Stuur de klant een bevestiging per e-mail (en later een herinnering)</span>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="allowOutsideHours" className="h-5 w-5 accent-[var(--color-charcoal)]" />
          <span>Toestaan buiten mijn werktijden</span>
        </label>
      </div>
      <SubmitButton className="w-full sm:w-auto" pending="Bezig met opslaan…">
        Afspraak opslaan
      </SubmitButton>
    </ActionForm>
  );
}
