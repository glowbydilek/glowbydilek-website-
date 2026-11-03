"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { preselectedTreatment } from "@/i18n/config";
import { Icon } from "../ui/Icon";

type Mode = "slot" | "request";

/**
 * One booking page, two ways in: choose a time straight away (treatments
 * with a fixed duration that are bookable online) or send a request (every
 * published treatment, including massages and anything on request). Both
 * panels stay mounted, so neither list can disappear. A treatment
 * preselected in the URL opens the panel that can actually take it.
 */
export function BookingModes({
  bookableIds,
  labels,
  slot,
  request,
}: {
  bookableIds: string[];
  labels: { label: string; slotTitle: string; slotBody: string; requestTitle: string; requestBody: string; notListed: string };
  slot: ReactNode;
  request: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("slot");
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const wanted = preselectedTreatment(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after hydration
    if (wanted && !bookableIds.includes(wanted)) setMode("request");
  }, [bookableIds]);

  const order: Mode[] = ["slot", "request"];
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = order.indexOf(mode);
    const next = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key) ? (i + 1) % 2 : e.key === "Home" ? 0 : e.key === "End" ? 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setMode(order[next]!);
    tabs.current[next]?.focus();
  };

  const tab = (m: Mode, i: number, title: string, body: string, icon: "calendar" | "mail") => {
    const on = mode === m;
    return (
      <button
        key={m}
        ref={(el) => {
          tabs.current[i] = el;
        }}
        type="button"
        role="tab"
        id={`${base}-${m}-tab`}
        aria-selected={on}
        aria-controls={`${base}-${m}`}
        tabIndex={on ? 0 : -1}
        onClick={() => setMode(m)}
        onKeyDown={onKey}
        data-selected={on ? "true" : undefined}
        className={`sheen mode-tab relative flex min-h-11 flex-1 items-start gap-3 rounded-2xl border p-4 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep ${
          on ? "border-ink bg-ink text-paper" : "border-ink/15 bg-surface text-ink hover:border-ink/40"
        }`}
      >
        <Icon name={icon} className={`mt-0.5 h-5 w-5 shrink-0 ${on ? "text-glow" : "text-accent-deep"}`} />
        <span>
          <span className="block font-medium">{title}</span>
          <span className={`mt-1 block text-sm leading-snug ${on ? "text-paper/75" : "text-muted"}`}>{body}</span>
        </span>
        {on && <span aria-hidden="true" className="pick-star absolute right-3 top-3" />}
      </button>
    );
  };

  return (
    <div>
      <div role="tablist" aria-label={labels.label} className="flex flex-col gap-3 sm:flex-row">
        {tab("slot", 0, labels.slotTitle, labels.slotBody, "calendar")}
        {tab("request", 1, labels.requestTitle, labels.requestBody, "mail")}
      </div>
      <div role="tabpanel" id={`${base}-slot`} aria-labelledby={`${base}-slot-tab`} hidden={mode !== "slot"} className="mt-8">
        {slot}
        <p className="mt-8 border-t border-line pt-5 text-sm">
          <button type="button" onClick={() => {
              setMode("request");
              tabs.current[1]?.focus();
            }}
            className="inline-flex min-h-11 items-center gap-2 font-medium text-accent-deep underline-offset-4 hover:underline">
            {labels.notListed}
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </button>
        </p>
      </div>
      <div role="tabpanel" id={`${base}-request`} aria-labelledby={`${base}-request-tab`} hidden={mode !== "request"} className="mt-8">
        {request}
      </div>
    </div>
  );
}
