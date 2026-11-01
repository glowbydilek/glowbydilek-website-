import Link from "next/link";
import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { dayLabel, time } from "@/components/private/agenda/format";
import { Card, LinkButton, PageHeader } from "@/components/private/ui";
import { listRange, listUpcoming, loadOverrides } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { addDays, daysInMonth, formatLocal, isLocalDate, isoWeekday, localToUtc, startOfMonth, startOfWeek, todayLocal, toLocalParts } from "@/lib/time";

export const metadata = { title: "Agenda" };

type View = "day" | "week" | "month" | "list";
const VIEWS: { v: View; label: string }[] = [
  { v: "day", label: "Dag" },
  { v: "week", label: "Week" },
  { v: "month", label: "Maand" },
  { v: "list", label: "Lijst" },
];

export default async function AgendaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const view: View = (["day", "week", "month", "list"] as const).includes(sp.view as View) ? (sp.view as View) : "week";
  const today = todayLocal();
  const d = sp.d && isLocalDate(sp.d) ? sp.d : today;
  const db = getDb();

  let from = d;
  let to = d;
  let prev = addDays(d, -1);
  let next = addDays(d, 1);
  if (view === "week") {
    from = startOfWeek(d);
    to = addDays(from, 6);
    prev = addDays(from, -7);
    next = addDays(from, 7);
  } else if (view === "month") {
    from = startOfMonth(d);
    to = addDays(from, daysInMonth(d) - 1);
    prev = startOfMonth(addDays(from, -1));
    next = addDays(to, 1);
  }
  const items = view === "list" ? await listUpcoming(db, new Date(), 100) : await listRange(db, from, to);
  const overrides = view === "list" ? [] : await loadOverrides(db, from, to);
  const byDay = new Map<string, typeof items>();
  for (const it of items) {
    if (!it.appt.startAt) continue;
    const k = toLocalParts(it.appt.startAt).date;
    byDay.set(k, [...(byDay.get(k) ?? []), it]);
  }
  const days = view === "list" ? [] : Array.from({ length: Math.round((localToUtc(to, 720).getTime() - localToUtc(from, 720).getTime()) / 864e5) + 1 }, (_, i) => addDays(from, i));
  const title =
    view === "day"
      ? dayLabel(localToUtc(d, 720))
      : view === "week"
        ? `Week van ${formatLocal(localToUtc(from, 720), "nl", { day: "numeric", month: "long" })}`
        : view === "month"
          ? formatLocal(localToUtc(from, 720), "nl", { month: "long", year: "numeric" })
          : "Komende afspraken";
  const link = (v: View, date: string) => `/agenda/kalender?view=${v}&d=${date}`;

  return (
    <>
      <PageHeader title="Agenda" subtitle={title} actions={<LinkButton href={`/agenda/afspraak/nieuw?d=${d}`} variant="primary">＋ Nieuwe afspraak</LinkButton>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Weergave" className="inline-flex rounded-full bg-white p-1 shadow-sm">
          {VIEWS.map((x) => (
            <Link key={x.v} href={link(x.v, d)} aria-current={view === x.v ? "page" : undefined} className={`min-h-10 rounded-full px-4 py-2 text-sm ${view === x.v ? "bg-ink text-paper" : "text-ink"}`}>
              {x.label}
            </Link>
          ))}
        </nav>
        {view !== "list" && (
          <div className="flex items-center gap-2">
            <Link href={link(view, prev)} aria-label="Vorige" className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">‹</Link>
            <Link href={link(view, today)} className="min-h-11 rounded-full bg-white px-4 py-2.5 text-sm shadow-sm">Vandaag</Link>
            <Link href={link(view, next)} aria-label="Volgende" className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">›</Link>
            <form action="/agenda/kalender" className="hidden sm:block">
              <input type="hidden" name="view" value={view} />
              <input type="date" name="d" defaultValue={d} aria-label="Ga naar datum" className="min-h-11 rounded-full border border-line bg-white px-3 text-sm" />
              <button className="sr-only">Ga</button>
            </form>
          </div>
        )}
      </div>

      {view === "month" ? (
        <Card>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
            {["ma", "di", "wo", "do", "vr", "za", "zo"].map((w) => (
              <div key={w} className="py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: isoWeekday(from) - 1 }).map((_, i) => (
              <div key={`pad${i}`} />
            ))}
            {days.map((day) => {
              const list = byDay.get(day) ?? [];
              const ov = overrides.find((o) => o.day === day);
              const open = list.filter((i) => ["confirmed", "proposed"].includes(i.appt.status)).length;
              return (
                <Link key={day} href={link("day", day)} className={`min-h-16 rounded-xl border p-1.5 text-left text-xs sm:min-h-24 ${day === today ? "border-ink" : "border-line"} ${ov?.closed ? "bg-sand" : "bg-white"}`}>
                  <span className="font-semibold">{Number(day.slice(8))}</span>
                  {open > 0 && <span className="mt-1 block rounded-full bg-[#e3efe1] px-1.5 text-[0.7rem] text-[#2f4b2d]">{open}×</span>}
                  {ov?.closed && <span className="mt-1 block text-[0.65rem] text-muted">gesloten</span>}
                  <span className="hidden sm:block">{list.slice(0, 3).map((i) => <span key={i.appt.id} className="block truncate text-[0.7rem] text-ink-soft">{time(i.appt.startAt)} {i.customer.firstName}</span>)}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : view === "list" ? (
        <Card title={`Komende bevestigde afspraken (${items.length})`}>
          {items.length ? <ul className="space-y-2">{items.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate /></li>)}</ul> : <p className="text-muted">Geen komende afspraken.</p>}
        </Card>
      ) : (
        <div className={view === "week" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 [&>*]:min-w-0" : ""}>
          {days.map((day) => {
            const list = byDay.get(day) ?? [];
            const ov = overrides.find((o) => o.day === day);
            return (
              <section key={day} aria-label={day} className={`rounded-2xl border bg-white p-3 ${day === today ? "border-ink" : "border-line"}`}>
                <Link href={link("day", day)} className="mb-2 flex items-baseline justify-between">
                  <h2 className="font-medium capitalize text-ink">{formatLocal(localToUtc(day, 720), "nl", { weekday: view === "week" ? "short" : "long", day: "numeric", month: "short" })}</h2>
                  {ov?.closed && <span className="text-xs text-muted">gesloten</span>}
                </Link>
                {ov?.note && <p className="mb-2 text-xs text-muted">{ov.note}</p>}
                {list.length ? (
                  <ul className="space-y-2">{list.map((i) => <li key={i.appt.id}><AppointmentCard item={i} compact={view === "week"} /></li>)}</ul>
                ) : (
                  <p className="text-sm text-muted">—</p>
                )}
                <Link href={`/agenda/afspraak/nieuw?d=${day}`} className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted hover:border-ink/40">
                  ＋ afspraak
                </Link>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
