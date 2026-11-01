import Link from "next/link";
import type { ListItem } from "@/lib/booking/service";
import { Badge } from "../ui";
import { STATUS, TIME_RANGE_NL, dayShort, time } from "./format";

const bar: Record<string, string> = {
  requested: "bg-[#d9a441]",
  proposed: "bg-[#d98a41]",
  confirmed: "bg-[#5c7f5a]",
  completed: "bg-[#5b6c9a]",
  cancelled: "bg-[#b0584c]",
  declined: "bg-[#b0584c]",
  no_show: "bg-[#b0584c]",
};

const edge: Record<string, string> = {
  requested: "border-l-[#d9a441]",
  proposed: "border-l-[#d98a41]",
  confirmed: "border-l-[#5c7f5a]",
  completed: "border-l-[#5b6c9a]",
  cancelled: "border-l-[#b0584c]",
  declined: "border-l-[#b0584c]",
  no_show: "border-l-[#b0584c]",
};

/** Large, tappable appointment card (agenda lists). */
export function AppointmentCard({ item, showDate = false, compact = false }: { item: ListItem; showDate?: boolean; compact?: boolean }) {
  const { appt, customer, treatments } = item;
  const st = STATUS[appt.status] ?? { label: appt.status, tone: "neutral" as const };
  if (compact) {
    // Narrow week columns: everything stacked, nothing wider than the column.
    return (
      <Link
        href={`/ajanda/afspraak/${appt.id}`}
        className={`block min-w-0 rounded-xl border border-stone border-l-4 bg-white p-2.5 text-sm shadow-sm transition hover:border-charcoal/30 ${edge[appt.status] ?? "border-l-stone"}`}
      >
        <p className="font-semibold text-charcoal">
          {appt.startAt ? `${time(appt.startAt)}–${time(appt.endAt)}` : (appt.requestedDate ?? "—")}
        </p>
        <p className="break-words font-medium text-charcoal">
          {customer.firstName} {customer.lastName}
        </p>
        <p className="break-words text-xs text-charcoal-soft">{treatments.join(", ") || "—"}</p>
        <span className="mt-1.5 inline-block">
          <Badge tone={st.tone}>{st.label}</Badge>
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={`/ajanda/afspraak/${appt.id}`}
      className="group flex items-stretch gap-3 rounded-2xl border border-stone bg-white p-3 shadow-sm transition hover:border-charcoal/30 active:scale-[0.99]"
    >
      <span aria-hidden="true" className={`w-1.5 shrink-0 rounded-full ${bar[appt.status] ?? "bg-stone"}`} />
      <div className="w-16 shrink-0 text-center">
        {appt.startAt ? (
          <>
            <p className="text-lg font-semibold leading-tight text-charcoal">{time(appt.startAt)}</p>
            <p className="text-xs text-muted">{time(appt.endAt)}</p>
          </>
        ) : (
          <p className="text-xs leading-tight text-muted">
            {appt.requestedDate ?? "—"}
            <br />
            {TIME_RANGE_NL[appt.requestedTimeRange ?? ""] ?? ""}
          </p>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-charcoal">
            {customer.firstName} {customer.lastName}
          </p>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-charcoal-soft">{treatments.join(", ") || "—"}</p>
        {showDate && appt.startAt && <p className="mt-0.5 text-xs text-muted">{dayShort(appt.startAt)}</p>}
      </div>
      <span aria-hidden="true" className="self-center text-muted transition group-hover:translate-x-0.5">
        ›
      </span>
    </Link>
  );
}
