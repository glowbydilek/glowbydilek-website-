import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, PageHeader, SubmitButton } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { inquiries } from "@/lib/db/schema";
import { inquiryAction } from "@/lib/private/agendaActions";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Bericht" };
const TOPIC: Record<string, string> = { question: "Algemene vraag", treatment: "Vraag over een behandeling", appointment: "Afspraak", other: "Iets anders" };

export default async function Message({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const db = getDb();
  const [m] = await db.select().from(inquiries).where(eq(inquiries.id, id));
  if (!m) notFound();
  if (m.status === "new") await db.update(inquiries).set({ status: "read", readAt: new Date() }).where(eq(inquiries.id, id));
  const subject = encodeURIComponent(m.locale === "en" ? "Re: your question — Glow by Dilek" : "Re: je vraag — Glow by Dilek");
  const btn = "inline-flex min-h-11 items-center rounded-full border border-ink/25 px-4 text-sm";
  return (
    <>
      <PageHeader title={m.name} subtitle={`${TOPIC[m.topic] ?? m.topic} · ${formatLocal(m.createdAt, "nl", { dateStyle: "long", timeStyle: "short" })}`} />
      <Card>
        <dl className="mb-4 grid grid-cols-[6rem_1fr] gap-2 text-sm">
          <dt className="text-muted">E-mail</dt>
          <dd className="break-all">{m.email}</dd>
          <dt className="text-muted">Telefoon</dt>
          <dd>{m.phone ?? "—"}</dd>
          <dt className="text-muted">Taal</dt>
          <dd>{m.locale === "en" ? "Engels" : "Nederlands"}</dd>
        </dl>
        <p className="whitespace-pre-wrap rounded-xl bg-surface p-4 leading-relaxed">{m.message}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={`mailto:${m.email}?subject=${subject}`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-paper">Beantwoorden per e-mail</a>
          {[["replied", "Markeer als beantwoord"], ["closed", "Afgehandeld"], ["new", "Markeer als ongelezen"]].map(([s, l]) => (
            <form key={s} action={inquiryAction}>
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="status" value={s} />
              <button className={btn}>{l}</button>
            </form>
          ))}
          <form action={inquiryAction}>
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="status" value="delete" />
            <SubmitButton variant="danger" confirm="Dit bericht definitief verwijderen?">Verwijderen</SubmitButton>
          </form>
        </div>
      </Card>
    </>
  );
}
