import { desc } from "drizzle-orm";
import { MediaItem, SlotForm, UploadForm } from "@/components/private/cms/MediaForms";
import { Card, PageHeader } from "@/components/private/ui";
import { photos, type PhotoId } from "@/content/media";
import { editorValue } from "@/lib/cms/service";
import { getDb } from "@/lib/db/client";
import { media } from "@/lib/db/schema";
import { mediaUsage } from "@/lib/private/mediaActions";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  const db = getDb();
  const [items, slotsEv] = await Promise.all([db.select().from(media).orderBy(desc(media.createdAt)), editorValue(db, "photos", "all", {})]);
  const slots = (slotsEv.value ?? {}) as Record<string, number>;
  const usage = await Promise.all(items.map((m) => mediaUsage(m.id)));
  const options = items.map((m) => ({ id: m.id, name: `${m.filename}${m.altNl ? ` — ${m.altNl.slice(0, 40)}` : ""}` }));
  return (
    <>
      <PageHeader title="Media" subtitle="Upload foto's, vul omschrijvingen in, kies de uitsnede en bepaal welke foto waar op de website staat. Foto's worden veilig in de database bewaard en blijven staan bij updates van de website." />
      <div className="space-y-5">
        <Card title="Foto uploaden"><UploadForm /></Card>
        <Card title={`Bibliotheek (${items.length})`}>
          {items.length ? (
            <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m, i) => <MediaItem key={m.id} m={{ ...m, version: m.updatedAt.getTime() }} usage={usage[i]} />)}
            </div>
          ) : (
            <p className="text-sm text-muted">Nog geen eigen foto&apos;s. De website gebruikt de bestaande gelicenseerde foto&apos;s.</p>
          )}
        </Card>
        <Card title="Foto's op de website">
          <p className="mb-3 text-sm text-muted">Elke plek gebruikt standaard de bestaande gelicenseerde foto. Kies een eigen foto om die te vervangen; &lsquo;Oorspronkelijke foto&rsquo; zet de originele terug.</p>
          <div className="space-y-2">
            {(Object.keys(photos) as PhotoId[]).map((id) => {
              const cur = slots[id] ?? null;
              const p = photos[id];
              const preview = cur ? `/media/${cur}/640` : `/images/photos/${p.file}-640.webp`;
              return <SlotForm key={id} slot={id} label={p.brief} current={cur} options={options} preview={preview} />;
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
