import "server-only";
import { asc } from "drizzle-orm";
import type { DB } from "../db/client";
import { serviceGroups, serviceSections, treatments } from "../db/schema";
import { BUILTIN_ITEMS } from "./builtin";

export type OwnerTreatment = {
  id: string;
  name: string;
  /** Display group: the waxing zone, or the service section. */
  category: string;
  duration: number | null;
  buffer: number;
  priceCents: number | null;
  status: string;
};

/**
 * Treatments the owner can pick in the agenda (new appointment, change):
 * everything except archived items, grouped by zone/section in catalogue
 * order. Drafts are marked "(concept)" so a trial booking is possible.
 */
export async function ownerTreatments(db: DB): Promise<OwnerTreatment[]> {
  const [sections, groups, rows] = await Promise.all([
    db.select().from(serviceSections).orderBy(asc(serviceSections.sort)),
    db.select().from(serviceGroups).orderBy(asc(serviceGroups.sort)),
    db.select().from(treatments).orderBy(asc(treatments.sort)),
  ]);
  const order = (id: string) => sections.findIndex((s) => s.id === id);
  return rows
    .filter((r) => r.active && r.status !== "archived")
    .map((r) => {
      const b = BUILTIN_ITEMS.find((x) => x.id === r.id);
      const sectionId = r.sectionId ?? b?.sectionId ?? "waxing";
      const groupId = r.groupId ?? b?.groupId ?? (sectionId === "waxing" && groups.some((g) => g.id === r.category) ? r.category : null);
      const group = groupId ? groups.find((g) => g.id === groupId) : undefined;
      const section = sections.find((s) => s.id === sectionId);
      const category = sectionId === "waxing" && group ? group.nameNl : (section?.nameNl ?? sectionId) + (group ? ` · ${group.nameNl}` : "");
      const key = [order(sectionId), group ? groups.indexOf(group) : -1, r.sort];
      return {
        key,
        item: {
          id: r.id,
          name: r.status === "draft" ? `${r.nameNl} (concept)` : r.nameNl,
          category,
          duration: r.durationMinutes,
          buffer: r.bufferMinutes,
          priceCents: r.pricingMode === "on_request" ? null : r.priceCents,
          status: r.status,
        },
      };
    })
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2])
    .map((x) => x.item);
}
