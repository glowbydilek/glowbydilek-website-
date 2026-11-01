"use client";

import { useState } from "react";
import { saveBlockAction, saveOverrideAction, saveWeeklyHoursAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { Button, Field, Input, Select, SubmitButton } from "../ui";

export type Iv = { start: string; end: string };
export type DayHours = { weekday: number; open: Iv[]; breaks: Iv[] };
const DAYS = ["", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

function Rows({ name, suffix = "", rows, setRows, label }: { name: string; suffix?: string; rows: Iv[]; setRows: (r: Iv[]) => void; label: string }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input aria-label={`${label} van`} type="time" step={300} name={`${name}-start${suffix}`} value={r.start} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className="min-w-0 max-w-[8.5rem] flex-1 px-2.5" />
          <span aria-hidden="true">–</span>
          <Input aria-label={`${label} tot`} type="time" step={300} name={`${name}-end${suffix}`} value={r.end} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className="min-w-0 max-w-[8.5rem] flex-1 px-2.5" />
          <button type="button" aria-label={`${label} verwijderen`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/6">✕</button>
        </div>
      ))}
    </div>
  );
}

function DayEditor({ d, value, onChange }: { d: number; value: DayHours & { enabled: boolean }; onChange: (v: DayHours & { enabled: boolean }) => void }) {
  return (
    <div className="rounded-2xl border border-line p-3 sm:p-4">
      <label className="flex min-h-11 items-center justify-between gap-3">
        <span className="font-medium">{DAYS[d]}</span>
        <span className="flex items-center gap-2 text-sm">
          {value.enabled ? "Open" : "Gesloten"}
          <input type="checkbox" name={`open-${d}`} checked={value.enabled} onChange={(e) => onChange({ ...value, enabled: e.target.checked, open: value.open.length ? value.open : [{ start: "09:00", end: "12:00" }] })} className="h-6 w-6 accent-[var(--color-ink)]" />
        </span>
      </label>
      {value.enabled && (
        <div className="mt-2 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.14em] text-muted">Werktijden</p>
            <Rows name="open" suffix={`-${d}`} rows={value.open} setRows={(open) => onChange({ ...value, open })} label="Werktijd" />
            <Button type="button" variant="ghost" className="mt-1 px-2 text-sm" onClick={() => onChange({ ...value, open: [...value.open, { start: "13:00", end: "17:00" }] })}>＋ tijdvak</Button>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.14em] text-muted">Pauzes</p>
            <Rows name="break" suffix={`-${d}`} rows={value.breaks} setRows={(breaks) => onChange({ ...value, breaks })} label="Pauze" />
            <Button type="button" variant="ghost" className="mt-1 px-2 text-sm" onClick={() => onChange({ ...value, breaks: [...value.breaks, { start: "12:00", end: "12:30" }] })}>＋ pauze</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyHoursForm({ initial }: { initial: DayHours[] }) {
  const [days, setDays] = useState(() =>
    [1, 2, 3, 4, 5, 6, 7].map((d) => {
      const x = initial.find((i) => i.weekday === d);
      return { weekday: d, open: x?.open ?? [], breaks: x?.breaks ?? [], enabled: Boolean(x?.open.length) };
    }),
  );
  return (
    <ActionForm action={saveWeeklyHoursAction}>
      <div className="space-y-3">
        {days.map((v, idx) => (
          <DayEditor key={v.weekday} d={v.weekday} value={v} onChange={(nv) => setDays(days.map((x, j) => (j === idx ? nv : x)))} />
        ))}
      </div>
      <SubmitButton pending="Bezig met opslaan…">Werktijden opslaan</SubmitButton>
    </ActionForm>
  );
}

export function OverrideForm({ defaultDay }: { defaultDay: string }) {
  const [mode, setMode] = useState("closed");
  const [open, setOpen] = useState<Iv[]>([{ start: "09:00", end: "13:00" }]);
  const [breaks, setBreaks] = useState<Iv[]>([]);
  return (
    <ActionForm action={saveOverrideAction} resetOnSuccess>
      <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Datum"><Input type="date" name="day" defaultValue={defaultDay} required /></Field>
        <Field label="Wat wil je?">
          <Select name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="closed">Hele dag gesloten</option>
            <option value="hours">Andere werktijden op deze dag</option>
            <option value="breaks">Normale werktijden, extra pauze/blokkade</option>
          </Select>
        </Field>
      </div>
      {mode === "hours" && (
        <div>
          <p className="mb-1 text-sm font-medium">Werktijden op deze dag</p>
          <Rows name="open" rows={open} setRows={setOpen} label="Werktijd" />
          <Button type="button" variant="ghost" className="px-2 text-sm" onClick={() => setOpen([...open, { start: "14:00", end: "17:00" }])}>＋ tijdvak</Button>
        </div>
      )}
      {mode !== "closed" && (
        <div>
          <p className="mb-1 text-sm font-medium">Pauzes / geblokkeerd</p>
          <Rows name="break" rows={breaks} setRows={setBreaks} label="Pauze" />
          <Button type="button" variant="ghost" className="px-2 text-sm" onClick={() => setBreaks([...breaks, { start: "12:00", end: "13:00" }])}>＋ pauze</Button>
        </div>
      )}
      {mode !== "closed" && (
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
          <Field label="Capaciteit op deze dag (optioneel)" hint="Aantal klanten tegelijk"><Input type="number" name="capacity" min={1} max={10} /></Field>
          <Field label="Max. afspraken op deze dag (optioneel)"><Input type="number" name="maxAppointments" min={1} max={50} /></Field>
        </div>
      )}
      <Field label="Notitie voor jezelf (optioneel)"><Input name="note" maxLength={200} placeholder="Bijv. tandarts" /></Field>
      <SubmitButton>Uitzondering opslaan</SubmitButton>
    </ActionForm>
  );
}

export function BlockForm({ defaultDay }: { defaultDay: string }) {
  return (
    <ActionForm action={saveBlockAction} resetOnSuccess>
      <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Van datum"><Input type="date" name="fromDay" defaultValue={defaultDay} required /></Field>
        <Field label="Tot en met datum"><Input type="date" name="toDay" defaultValue={defaultDay} /></Field>
        <Field label="Vanaf tijd (optioneel)" hint="Leeg = hele dag"><Input type="time" name="fromTime" step={300} /></Field>
        <Field label="Tot tijd (optioneel)"><Input type="time" name="toTime" step={300} /></Field>
      </div>
      <Field label="Reden (alleen voor jou)"><Input name="reason" maxLength={200} placeholder="Bijv. vakantie" /></Field>
      <SubmitButton>Blokkade toevoegen</SubmitButton>
    </ActionForm>
  );
}
