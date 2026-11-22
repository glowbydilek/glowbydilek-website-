import { requireCan } from "@/lib/auth/session";
import { asc, gte } from "drizzle-orm";
import { BlockForm, OverrideForm, WeeklyHoursForm, type DayHours } from "@/components/private/agenda/HoursForms";
import { Card, Notice, PageHeader, SubmitButton } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { blocks, dateOverrides, overrideIntervals, weeklyHours } from "@/lib/db/schema";
import { deleteBlockAction, deleteOverrideAction } from "@/lib/private/agendaActions";
import { dayBoundsUtc, formatLocal, localToUtc, minutesToHHMM, todayLocal } from "@/lib/time";
import { panelT } from "@/lib/private/panelLangServer";

export const metadata = { title: "Openingstijden & beschikbaarheid" };

export default async function Hours() {
  const t = await panelT();
  await requireCan("agenda", "hours.manage");
  const db = getDb();
  const today = todayLocal();
  const [weekly, ovs, ivs, bl] = await Promise.all([
    db.select().from(weeklyHours),
    db.select().from(dateOverrides).where(gte(dateOverrides.day, today)).orderBy(asc(dateOverrides.day)),
    db.select().from(overrideIntervals).where(gte(overrideIntervals.day, today)),
    db.select().from(blocks).where(gte(blocks.endAt, dayBoundsUtc(today).start)).orderBy(asc(blocks.startAt)),
  ]);
  const initial: DayHours[] = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
    weekday: d,
    open: weekly.filter((w) => w.weekday === d && w.kind === "open").sort((a, b) => a.startMinute - b.startMinute).map((w) => ({ start: minutesToHHMM(w.startMinute), end: minutesToHHMM(w.endMinute) })),
    breaks: weekly.filter((w) => w.weekday === d && w.kind === "break").map((w) => ({ start: minutesToHHMM(w.startMinute), end: minutesToHHMM(w.endMinute) })),
  }));
  const fmtDay = (d: string) => formatLocal(localToUtc(d, 720), "nl", { weekday: "long", day: "numeric", month: "long" });
  return (
    <>
      <PageHeader title={t("Openingstijden & beschikbaarheid")} subtitle="Je vaste weekrooster (de tijden waarop klanten op afspraak kunnen komen), uitzonderingen op een datum en vakantie of vrije periodes. Alle tijden in Nederlandse tijd. Bestaande afspraken veranderen nooit automatisch." />
      <div className="space-y-5">
        {!weekly.length && <Notice tone="warning">{t("Er zijn nog geen werktijden ingesteld. Zolang dit leeg is, kunnen klanten online geen tijdstip kiezen.")}</Notice>}
        <Card title={t("Vast weekrooster")}>
          <WeeklyHoursForm initial={initial} />
        </Card>
        <Card title={t("Uitzondering op een datum")}>
          <p className="mb-3 text-sm text-muted">{t("Bijvoorbeeld: een normaal gesloten dag openen, een dag sluiten, of op één datum 09:00–13:00 werken. Het vaste rooster blijft voor andere weken gelijk.")}</p>
          <OverrideForm defaultDay={today} />
          {ovs.length > 0 && (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {ovs.map((o) => {
                const list = ivs.filter((i) => i.day === o.day);
                const desc = o.closed
                  ? "gesloten"
                  : [o.customHours ? `open ${list.filter((i) => i.kind === "open").map((i) => `${minutesToHHMM(i.startMinute)}–${minutesToHHMM(i.endMinute)}`).join(", ")}` : "normale tijden", ...list.filter((i) => i.kind === "break").map((i) => `pauze ${minutesToHHMM(i.startMinute)}–${minutesToHHMM(i.endMinute)}`)].join(" · ");
                return (
                  <li key={o.day} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <span className="block font-medium capitalize">{fmtDay(o.day)}</span>
                      <span className="text-sm text-muted">{desc}{o.note ? ` — ${o.note}` : ""}</span>
                    </span>
                    <form action={deleteOverrideAction}>
                      <input type="hidden" name="day" value={o.day} />
                      <SubmitButton variant="ghost" confirm="Deze uitzondering verwijderen?">{t("Verwijderen")}</SubmitButton>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title={t("Geblokkeerde periodes")}>
          <p className="mb-3 text-sm text-muted">{t("Vakantie, een persoonlijke afspraak of tijdelijk niet beschikbaar.")}</p>
          <BlockForm defaultDay={today} />
          {bl.length > 0 && (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {bl.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    <span className="block font-medium">{formatLocal(b.startAt, "nl", { dateStyle: "medium", timeStyle: "short" })} – {formatLocal(b.endAt, "nl", { dateStyle: "medium", timeStyle: "short" })}</span>
                    {b.reason && <span className="text-sm text-muted">{b.reason}</span>}
                  </span>
                  <form action={deleteBlockAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <SubmitButton variant="ghost" confirm="Deze blokkade verwijderen?">{t("Verwijderen")}</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
