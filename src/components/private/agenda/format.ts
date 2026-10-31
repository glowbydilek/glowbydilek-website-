import { formatLocal, formatTime } from "@/lib/time";

export const STATUS: Record<string, { label: string; tone: "pending" | "confirmed" | "cancelled" | "done" | "warning" | "neutral" }> = {
  requested: { label: "Aanvraag", tone: "pending" },
  proposed: { label: "Voorstel verstuurd", tone: "warning" },
  confirmed: { label: "Bevestigd", tone: "confirmed" },
  declined: { label: "Afgewezen", tone: "cancelled" },
  cancelled: { label: "Geannuleerd", tone: "cancelled" },
  completed: { label: "Afgerond", tone: "done" },
  no_show: { label: "Niet verschenen", tone: "cancelled" },
};

export const TIME_RANGE_NL: Record<string, string> = { morning: "ochtend", afternoon: "middag", evening: "avond", flexible: "flexibel" };

export const dayLabel = (d: Date) => formatLocal(d, "nl", { weekday: "long", day: "numeric", month: "long" });
export const dayShort = (d: Date) => formatLocal(d, "nl", { weekday: "short", day: "numeric", month: "short" });
export const time = (d: Date | null | undefined) => (d ? formatTime(d, "nl") : "—");
