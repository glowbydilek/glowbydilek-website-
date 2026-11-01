import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { Item } from "@/lib/catalogue";
import { formatCents } from "@/lib/finance/money";
import { offerFor } from "@/lib/promotions/web";
import { formatLongDate } from "@/lib/time";
import { Glint } from "./brand/Logo";

/** A visible promotion for one item: label, period, code and honest prices. */
export function OfferBadge({ item, locale, compact = false }: { item: Item; locale: Locale; compact?: boolean }) {
  const o = offerFor(item, locale);
  if (!o) return null;
  const t = getDictionary(locale).offer;
  const bits = [o.label, o.until ? t.until.replace("{date}", formatLongDate(o.until, locale)) : null, o.code ? t.code.replace("{code}", o.code) : null].filter(Boolean).join(" · ");
  return (
    <div className={compact ? "mt-2" : "mt-4"}>
      <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full bg-glow-soft px-3 py-1 text-xs text-ink">
        <Glint className="h-3 w-auto text-accent" />
        <strong className="font-semibold uppercase tracking-[0.12em] text-accent-deep">{t.badge}</strong>
        <span>{bits}</span>
      </p>
      {!compact && o.actionCents != null && (
        <p className="mt-2 text-sm text-ink">
          {t.actionPrice}: <strong>{formatCents(o.actionCents, locale)}</strong>
          {o.referenceCents != null && <span className="block text-xs text-muted">{t.reference.replace("{price}", formatCents(o.referenceCents, locale))}</span>}
        </p>
      )}
      {!compact && o.note && <p className="mt-1 text-xs text-muted">{o.note}</p>}
    </div>
  );
}
