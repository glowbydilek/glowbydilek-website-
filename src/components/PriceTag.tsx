import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { itemDuration, priceLabel, type Item } from "@/lib/catalogue";

/**
 * The one way a treatment's price is shown on the public site: the amount
 * (or "from" amount) in a clear, bold style with the duration beside it, or
 * the same "price on request" wording everywhere when the owner has not set
 * a price yet. Used by cards, list rows, zone lists and the detail page so a
 * treatment never shows a price on one page and nothing on another.
 */
export function PriceTag({ locale, item, size = "md", align = "left" }: { locale: Locale; item: Item; size?: "sm" | "md" | "lg"; align?: "left" | "right" }) {
  const dict = getDictionary(locale);
  const onRequest = item.pricing.mode === "on_request" || item.pricing.cents == null;
  const label = priceLabel(item, locale, { from: dict.prices.from, onRequest: dict.service.priceOnRequest });
  const minutes = itemDuration(item);
  const amountClass = size === "lg" ? "text-[1.9rem] sm:text-[2.2rem]" : size === "sm" ? "text-[1.05rem]" : "text-[1.3rem]";
  return (
    <span className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${align === "right" ? "justify-end text-right" : ""}`} data-price-tag="">
      {onRequest ? (
        <span className="text-sm font-medium text-ink-soft">{label}</span>
      ) : (
        <span className={`price-amount font-serif tabular-nums leading-none text-ink ${amountClass}`}>{label}</span>
      )}
      {minutes ? (
        <span className="whitespace-nowrap text-xs text-muted">
          · {minutes} {dict.prices.minutes}
        </span>
      ) : null}
    </span>
  );
}
