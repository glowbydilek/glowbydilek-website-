import Link from "next/link";
import { desc } from "drizzle-orm";
import { ProfileForm } from "@/components/private/cms/ProfileForm";
import { Card, Notice, PageHeader } from "@/components/private/ui";
import { getPublishedEntry } from "@/lib/cms/store";
import { getDb } from "@/lib/db/client";
import { media } from "@/lib/db/schema";
import { parseProfile } from "@/lib/profile";

export const metadata = { title: "Over Dilek" };

export default async function ProfileAdmin() {
  const [row, mediaRows] = await Promise.all([
    getPublishedEntry("profile", "all"),
    getDb().select({ id: media.id, name: media.filename }).from(media).orderBy(desc(media.createdAt)).limit(100),
  ]);
  const p = parseProfile(row?.data);
  return (
    <>
      <PageHeader title="Over Dilek: opleiding & achtergrond" subtitle="Je diploma, certificaten, achtergrond en (optioneel) een echte portretfoto." />
      <div className="mb-5 space-y-3">
        <Notice tone="info">
          De website noemt je opleiding pas als je de exacte gegevens hebt ingevuld én gecontroleerd. Er wordt nooit iets afgeleid: geen registraties, bevoegdheden of btw-vrijstellingen. De verhalende teksten van de pagina bewerk je onder <Link href="/admin/paginas/about" className="underline">Pagina&apos;s → Over Dilek</Link>.
        </Notice>
      </div>
      <Card>
        <ProfileForm p={p} media={mediaRows} />
        {row && <p className="mt-4 text-xs text-muted">Versie {row.version} · eerdere versies terugzetten kan via het CMS-logboek.</p>}
      </Card>
    </>
  );
}
