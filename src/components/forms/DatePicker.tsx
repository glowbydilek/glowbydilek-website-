"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { isClosedDay, isSelectable, monthGrid, monthKey, shiftDays, shiftMonths, type RequestCalendar } from "@/lib/booking/calendar";
import { Icon } from "../ui/Icon";

export type DatePickerLabels = {
  choose: string;
  prev: string;
  next: string;
  close: string;
  closed: string;
  today: string;
  hint: string;
};

/**
 * Accessible date picker that replaces the native date input (whose iOS
 * overlay was clipped and blue). Monday-first, NL/EN month and day names,
 * "today" in Europe/Amsterdam (passed in as `min`), closed days disabled.
 *
 * Phones: a bottom sheet above Safari's toolbar (safe-area aware).
 * Larger screens: a popover under the field.
 * Keyboard: arrows (day/week), Home/End (week), PageUp/PageDown (month),
 * Enter/Space to choose, Escape to close; focus returns to the field.
 */
export function DatePicker({
  id,
  label,
  required,
  value,
  onChange,
  min,
  max,
  calendar,
  locale,
  error,
  labels,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (day: string) => void;
  min: string;
  max: string;
  calendar: RequestCalendar;
  locale: "nl" | "en";
  error?: string;
  labels: DatePickerLabels;
}) {
  const tag = locale === "nl" ? "nl-NL" : "en-GB";
  const [open, setOpen] = useState(false);
  const [focusDay, setFocusDay] = useState(value || min);
  const [glint, setGlint] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const titleId = useId();
  const hintId = useId();

  const fmt = useMemo(() => {
    const at = (d: string) => new Date(`${d}T12:00:00Z`);
    const full = new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const month = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "UTC" });
    const wdShort = new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: "UTC" });
    const wdLong = new Intl.DateTimeFormat(tag, { weekday: "long", timeZone: "UTC" });
    // 2024-01-01 is a Monday.
    const week = Array.from({ length: 7 }, (_, i) => shiftDays("2024-01-01", i));
    return {
      full: (d: string) => full.format(at(d)),
      month: (d: string) => month.format(at(d)),
      heads: week.map((d) => ({ short: wdShort.format(at(d)).replace(".", ""), long: wdLong.format(at(d)) })),
    };
  }, [tag]);

  const selectable = useCallback((d: string) => isSelectable(calendar, d, min, max), [calendar, min, max]);
  const clamp = (d: string) => (d < min ? min : d > max ? max : d);

  const openPicker = () => {
    let start = clamp(value || min);
    // Start on the first open day so keyboard users land on something choosable.
    for (let i = 0; i < 60 && !selectable(start) && start < max; i++) start = shiftDays(start, 1);
    setFocusDay(start);
    setOpen(true);
  };
  const close = useCallback((restore = true) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }, []);

  // Move DOM focus to the active day whenever it changes while open.
  useLayoutEffect(() => {
    if (!open) return;
    // Larger screens: keep the whole popover in view.
    if (window.matchMedia("(min-width: 640px)").matches) panel.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus({ preventScroll: true });
  }, [open, focusDay]);

  // Close on outside click; lock page scroll behind the phone sheet.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    const phone = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const choose = (d: string) => {
    if (!selectable(d)) return;
    onChange(d);
    setGlint(d);
    window.setTimeout(() => setGlint(null), 450);
    window.setTimeout(() => close(), 180);
  };

  const onGridKey = (e: KeyboardEvent) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => shiftDays(focusDay, -1),
      ArrowRight: () => shiftDays(focusDay, 1),
      ArrowUp: () => shiftDays(focusDay, -7),
      ArrowDown: () => shiftDays(focusDay, 7),
      Home: () => shiftDays(focusDay, -(((new Date(`${focusDay}T12:00:00Z`).getUTCDay() + 6) % 7))),
      End: () => shiftDays(focusDay, 6 - ((new Date(`${focusDay}T12:00:00Z`).getUTCDay() + 6) % 7)),
      PageUp: () => shiftMonths(focusDay, -1),
      PageDown: () => shiftMonths(focusDay, 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      setFocusDay(clamp(moves[e.key]()));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(focusDay);
    }
  };
  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
    // Keep Tab inside the dialog.
    if (e.key === "Tab" && panel.current) {
      const f = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]):not([tabindex='-1'])")];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault();
        f[0].focus();
      }
    }
  };

  const weeks = monthGrid(focusDay);
  const canPrev = monthKey(focusDay) > monthKey(min);
  const canNext = monthKey(focusDay) < monthKey(max);
  const errId = `${id}-error`;

  return (
    <div className="relative">
      <span id={`${id}-label`} className="flex items-baseline justify-between gap-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink">
        <span>
          {label}
          {required && <span aria-hidden="true" className="text-accent-deep"> *</span>}
        </span>
      </span>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={error ? errId : undefined}
        onClick={() => (open ? close() : openPicker())}
        className={`mt-2 flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-2xl border bg-surface px-5 py-4 text-left text-base transition-[border-color,box-shadow] duration-300 focus:outline-none focus:ring-4 focus:ring-accent/20 ${
          error ? "border-[#9b3b2f]" : open ? "border-ink" : "border-ink/15 hover:border-ink/30"
        }`}
      >
        <span className={`first-letter:uppercase ${value ? "text-ink" : "text-muted"}`}>{value ? fmt.full(value) : labels.choose}</span>
        <Icon name="calendar" className="h-5 w-5 shrink-0 text-accent-deep" />
      </button>
      <input type="hidden" name={id} value={value} />
      {error && (
        <p id={errId} className="mt-2 text-sm text-[#9b3b2f]">
          {error}
        </p>
      )}

      {open && (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-[70] bg-ink/30 sm:hidden" />
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={onPanelKey}
            className="date-sheet fixed inset-x-0 bottom-0 z-[71] rounded-t-[1.75rem] border border-line bg-paper px-1.5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-soft)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[22rem] sm:rounded-[1.5rem] sm:px-3 sm:pb-3"
          >
            <div aria-hidden="true" className="mx-auto mb-2 h-1 w-10 rounded-full bg-line sm:hidden" />
            <div className="flex items-center justify-between gap-2 px-2.5">
              <button type="button" onClick={() => setFocusDay(clamp(shiftMonths(focusDay, -1)))} disabled={!canPrev} aria-label={labels.prev} className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface disabled:opacity-30">
                <Icon name="chevron" className="h-4 w-4 rotate-180" />
              </button>
              <h2 id={titleId} aria-live="polite" className="font-serif text-xl capitalize text-ink">
                {fmt.month(focusDay)}
              </h2>
              <button type="button" onClick={() => setFocusDay(clamp(shiftMonths(focusDay, 1)))} disabled={!canNext} aria-label={labels.next} className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface disabled:opacity-30">
                <Icon name="chevron" className="h-4 w-4" />
              </button>
            </div>
            <p id={hintId} className="sr-only">{labels.hint}</p>
            <table ref={gridRef} role="grid" aria-labelledby={titleId} aria-describedby={hintId} className="mt-1 w-full table-fixed border-collapse" onKeyDown={onGridKey}>
              <thead>
                <tr>
                  {fmt.heads.map((h) => (
                    <th key={h.long} scope="col" abbr={h.long} className="pb-1 text-center text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">
                      {h.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((w, i) => (
                  <tr key={i}>
                    {w.map((d, j) => {
                      if (!d) return <td key={j} />;
                      const ok = selectable(d);
                      const chosen = d === value;
                      const isToday = d === min;
                      const closedDay = isClosedDay(calendar, d) && d >= min && d <= max;
                      const name = `${fmt.full(d)}${isToday ? `, ${labels.today}` : ""}${closedDay ? `, ${labels.closed}` : ""}`;
                      return (
                        <td key={j} className="p-0 text-center" aria-selected={chosen || undefined} role="gridcell">
                          <button
                            type="button"
                            data-day={d}
                            tabIndex={d === focusDay ? 0 : -1}
                            aria-label={name}
                            aria-disabled={!ok || undefined}
                            aria-pressed={chosen}
                            data-selected={glint === d ? "true" : undefined}
                            onClick={() => choose(d)}
                            className={`sheen relative mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[0.95rem] tabular-nums transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                              chosen
                                ? "bg-ink text-paper"
                                : ok
                                  ? "text-ink hover:bg-sand"
                                  : "cursor-not-allowed text-muted/60 line-through decoration-muted/40"
                            } ${isToday && !chosen ? "ring-1 ring-inset ring-champagne" : ""}`}
                          >
                            {Number(d.slice(8))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 flex justify-end px-2.5 sm:hidden">
              <button type="button" onClick={() => close()} className="min-h-11 rounded-full px-4 text-sm font-medium text-ink">
                {labels.close}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
