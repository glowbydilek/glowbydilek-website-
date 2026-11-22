import { formatLocal, formatTime } from "@/lib/time";
import type { PanelLang } from "@/lib/private/panelLang";

export const STATUS: Record<string, { label: string; tone: "pending" | "confirmed" | "cancelled" | "done" | "warning" | "neutral" }> = {
  requested: { label: "Aanvraag", tone: "pending" },
  proposed: { label: "Voorstel verstuurd", tone: "warning" },
  confirmed: { label: "Bevestigd", tone: "confirmed" },
  declined: { label: "Afgewezen", tone: "cancelled" },
  cancelled: { label: "Geannuleerd", tone: "cancelled" },
  completed: { label: "Afgerond", tone: "done" },
  no_show: { label: "Niet verschenen", tone: "cancelled" },
};

const STATUS_TR: Record<string, string> = {
  requested: "Talep",
  proposed: "Öneri gönderildi",
  confirmed: "Onaylandı",
  declined: "Reddedildi",
  cancelled: "İptal edildi",
  completed: "Tamamlandı",
  no_show: "Gelmedi",
};

/** Status label and colour tone in the panel language. */
export function statusOf(status: string, lang: PanelLang = "nl") {
  const base = STATUS[status] ?? { label: status, tone: "neutral" as const };
  return { tone: base.tone, label: lang === "tr" ? (STATUS_TR[status] ?? base.label) : base.label };
}

export const TIME_RANGE_NL: Record<string, string> = { morning: "ochtend", afternoon: "middag", evening: "avond", flexible: "flexibel" };
const TIME_RANGE_TR: Record<string, string> = { morning: "sabah", afternoon: "öğleden sonra", evening: "akşam", flexible: "esnek" };
export const timeRange = (v: string | null | undefined, lang: PanelLang = "nl") => (lang === "tr" ? TIME_RANGE_TR : TIME_RANGE_NL)[v ?? ""] ?? "";

// Dates and times are always shown in Europe/Amsterdam (formatLocal/formatTime); only the wording follows the language.
export const dayLabel = (d: Date, lang: PanelLang = "nl") => formatLocal(d, lang, { weekday: "long", day: "numeric", month: "long" });
export const dayShort = (d: Date, lang: PanelLang = "nl") => formatLocal(d, lang, { weekday: "short", day: "numeric", month: "short" });
export const time = (d: Date | null | undefined, lang: PanelLang = "nl") => (d ? formatTime(d, lang) : "—");
