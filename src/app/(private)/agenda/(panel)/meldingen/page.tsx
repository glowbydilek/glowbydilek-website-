import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { Badge, Card, PageHeader } from "@/components/private/ui";
import { NotificationSetup } from "@/components/private/NotificationSetup";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { appointments, customers, inquiries } from "@/lib/db/schema";
import { badgeCount, listDevices, listNotifications, syncNotifications, unreadCount, type Category, type Filter } from "@/lib/notify/service";
import { dismissAction, markAllReadAction, removeDeviceAction } from "@/lib/private/notifyActions";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Meldingen" };

const FILTERS: { key: Filter; label: string }[] = [
  { key: "actie", label: "Actie nodig" },
  { key: "ongelezen", label: "Ongelezen" },
  { key: "afgehandeld", label: "Afgehandeld" },
  { key: "alle", label: "Alles" },
];
const CATS: { key: Category; label: string }[] = [
  { key: "afspraak", label: "Afspraken" },
  { key: "bericht", label: "Berichten" },
  { key: "intake", label: "Intake" },
  { key: "factuur", label: "Facturen" },
  { key: "systeem", label: "E-mail" },
];
const CAT_LABEL: Record<string, string> = { afspraak: "Afspraak", bericht: "Bericht", intake: "Intake", factuur: "Factuur", systeem: "E-mail" };

export default async function MeldingenPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireOwner("agenda", "/agenda/meldingen");
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.f)?.key ?? "actie") as Filter;
  const cat = CATS.find((c) => c.key === sp.c)?.key;
  const db = getDb();
  await syncNotifications(db);
  const [rows, pending, unread, devices] = await Promise.all([listNotifications(db, filter, cat), badgeCount(db), unreadCount(db), listDevices(db, session.user.id)]);

  // In-app details (signed-in only; never part of a push): who the item is about.
  const apptIds = rows.filter((r) => r.entityType === "appointment" && r.entityId).map((r) => r.entityId!);
  const inqIds = rows.filter((r) => r.entityType === "inquiry" && r.entityId).map((r) => r.entityId!);
  const appts: { id: number; first: string; last: string; startAt: Date | null }[] = apptIds.length
    ? await db.select({ id: appointments.id, first: customers.firstName, last: customers.lastName, startAt: appointments.startAt }).from(appointments).innerJoin(customers, eq(customers.id, appointments.customerId)).where(inArray(appointments.id, apptIds))
    : [];
  const inqs: { id: number; name: string }[] = inqIds.length ? await db.select({ id: inquiries.id, name: inquiries.name }).from(inquiries).where(inArray(inquiries.id, inqIds)) : [];
  const detail = (r: (typeof rows)[number]): string | null => {
    if (r.entityType === "appointment") {
      const a = appts.find((x) => x.id === r.entityId);
      return a ? [`${a.first} ${a.last}`.trim(), a.startAt ? formatLocal(a.startAt, "nl", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null].filter(Boolean).join(" · ") : null;
    }
    if (r.entityType === "inquiry") return inqs.find((x) => x.id === r.entityId)?.name ?? null;
    return null;
  };
  const href = (f: Filter, c?: Category) => `/agenda/meldingen?f=${f}${c ? `&c=${c}` : ""}`;
  const chip = (active: boolean) => `inline-flex min-h-10 items-center rounded-full px-4 text-sm ${active ? "bg-ink text-paper" : "border border-line text-ink hover:bg-ink/5"}`;

  return (
    <>
      <PageHeader
        title="Meldingen"
        subtitle={pending ? `${pending} ${pending === 1 ? "actie wacht" : "acties wachten"} op jou. Een actie verdwijnt pas als je hem hebt afgehandeld.` : "Er wacht niets op je. Nieuwe aanvragen, berichten en problemen verschijnen hier."}
        actions={
          unread > 0 ? (
            <form action={markAllReadAction}>
              <button className="text-sm text-accent-deep underline">Alles als gelezen markeren</button>
            </form>
          ) : undefined
        }
      />

      <nav aria-label="Filter" className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={href(f.key, cat)} aria-current={filter === f.key ? "page" : undefined} className={chip(filter === f.key)}>
            {f.label}
            {f.key === "actie" && pending ? ` (${pending})` : f.key === "ongelezen" && unread ? ` (${unread})` : ""}
          </Link>
        ))}
      </nav>
      <nav aria-label="Soort" className="mb-5 flex flex-wrap gap-2 text-sm">
        <Link href={href(filter)} className={chip(!cat)}>Alle soorten</Link>
        {CATS.map((c) => (
          <Link key={c.key} href={href(filter, c.key)} className={chip(cat === c.key)}>{c.label}</Link>
        ))}
      </nav>

      <Card>
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const d = detail(r);
              const open = r.state === "open";
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <a href={`/agenda/meldingen-open/${r.id}`} className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {!r.readAt && <span aria-label="Ongelezen" className="h-2 w-2 rounded-full bg-accent-deep" />}
                      <span className={r.readAt ? "" : "font-semibold"}>{r.title}</span>
                      <Badge tone="neutral">{CAT_LABEL[r.category] ?? r.category}</Badge>
                      {r.actionable && open && <Badge tone="pending">Actie nodig</Badge>}
                      {r.state === "resolved" && <Badge tone="confirmed">Afgehandeld</Badge>}
                      {r.state === "dismissed" && <Badge tone="done">Weggezet</Badge>}
                    </span>
                    {d && <span className="mt-0.5 block text-sm text-ink">{d}</span>}
                    <span className="mt-0.5 block text-xs text-muted">{formatLocal(r.createdAt, "nl", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </a>
                  <span className="flex items-center gap-2">
                    <a href={`/agenda/meldingen-open/${r.id}`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-paper">
                      {r.actionable && open ? "Openen en afhandelen" : "Openen"}
                    </a>
                    {!r.actionable && open && (
                      <form action={dismissAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted underline">Wegzetten</button>
                      </form>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted">{filter === "actie" ? "Geen openstaande acties." : "Geen meldingen in deze lijst."}</p>
        )}
      </Card>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title="Meldingen op je telefoon">
          <p className="mb-3 text-sm text-muted">
            Krijg direct een melding bij een nieuwe afspraakaanvraag, een bericht van een klant of een probleem met een factuur — ook als de Agenda dicht is. Het getal op het app-icoon is het aantal acties dat nog op je wacht. Op het vergrendelscherm staan nooit namen, gezondheidsgegevens of bedragen.
          </p>
          <NotificationSetup />
        </Card>
        <Card title="Aangemelde apparaten">
          {devices.length ? (
            <ul className="divide-y divide-line text-sm">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {d.device || "Apparaat"}
                    <span className="block text-xs text-muted">
                      {d.disabledAt ? "Werkt niet meer — zet de meldingen op dit apparaat opnieuw aan" : d.lastSuccessAt ? `Laatste melding: ${formatLocal(d.lastSuccessAt, "nl", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Nog geen melding ontvangen"}
                    </span>
                  </span>
                  <form action={removeDeviceAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="min-h-11 px-2 text-muted underline">Verwijderen</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nog geen apparaten. Zet bij „Meldingen op je telefoon” de meldingen aan op je iPhone, iPad of computer.</p>
          )}
        </Card>
      </div>
    </>
  );
}
