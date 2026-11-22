"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import type { FormState } from "@/lib/private/authActions";
import { quickPriceAction } from "@/lib/private/catalogueActions";

export type QuickPriceLabels = {
  onRequest: string;
  fixed: string;
  from: string;
  amount: string;
  ok: string;
  saving: string;
  draft: string;
  hidden: string;
  earlier: string;
  restore: string;
  restoreTitle: string;
  confirm: string;
  cancel: string;
  changedOn: string;
};

type Mode = "on_request" | "fixed" | "from";

const toInput = (c: number | null) => (c != null ? (c / 100).toFixed(2).replace(".", ",").replace(/,00$/, "") : "");

/**
 * One treatment = one compact row: name, ‘Op aanvraag’ / ‘Vaste prijs’,
 * the amount in euros, and OK. Saves only the price of this treatment.
 * ‘Vanaf’ is offered only for treatments that already use it, so an existing
 * value is never changed without the owner choosing to.
 */
export function QuickPriceRow({
  id,
  name,
  mode: initialMode,
  priceCents,
  status,
  visible,
  earlier = [],
  labels,
}: {
  id: string;
  name: string;
  mode: Mode;
  priceCents: number | null;
  status: string;
  visible: boolean;
  /** Earlier prices from the price history (newest first), to review and restore. */
  earlier?: { mode: Mode; priceCents: number | null; date: string }[];
  labels: QuickPriceLabels;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [price, setPrice] = useState(toInput(priceCents));
  const [state, run, pending] = useActionState<FormState, FormData>(quickPriceAction, {});
  const [dirty, setDirty] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setDirty(false);
    startTransition(() => run(fd));
  };
  const modes: { v: Mode; label: string }[] = [
    { v: "on_request", label: labels.onRequest },
    { v: "fixed", label: labels.fixed },
    ...(initialMode === "from" ? [{ v: "from" as Mode, label: labels.from }] : []),
  ];
  const showMsg = !dirty && !pending && (state.ok || state.error);
  // Restore flow: open the list, pick an earlier price, review, confirm. Nothing is saved before "Bevestigen".
  const [restoring, setRestoring] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const fmt = (e: { mode: Mode; priceCents: number | null }) =>
    e.mode === "on_request" || e.priceCents == null ? labels.onRequest : `${e.mode === "from" ? `${labels.from} ` : ""}€ ${toInput(e.priceCents)}`;
  const confirmRestore = () => {
    const e = pick != null ? earlier[pick] : null;
    if (!e) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("pricingMode", e.mode);
    fd.set("price", e.mode === "on_request" ? "" : toInput(e.priceCents));
    setMode(e.mode === "from" && initialMode !== "from" ? "fixed" : e.mode);
    if (e.mode !== "on_request") setPrice(toInput(e.priceCents));
    setDirty(false);
    setRestoring(false);
    setPick(null);
    startTransition(() => run(fd));
  };

  return (
    <li className="border-b border-line py-3 last:border-0">
      <form onSubmit={submit} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_8.5rem_auto]">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="pricingMode" value={mode} />
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <p className="font-medium leading-snug text-ink">{name}</p>
          {(status !== "published" || !visible) && (
            <p className="text-xs text-muted">{[status !== "published" ? labels.draft : null, !visible ? labels.hidden : null].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        <div role="radiogroup" aria-label={name} className="col-span-2 flex rounded-full border border-line bg-surface p-0.5 sm:col-span-1">
          {modes.map((m) => (
            <button
              key={m.v}
              type="button"
              role="radio"
              aria-checked={mode === m.v}
              onClick={() => {
                setMode(m.v);
                setDirty(true);
              }}
              className={`min-h-10 flex-1 whitespace-nowrap rounded-full px-3 text-sm transition ${mode === m.v ? "bg-ink text-white shadow-sm" : "text-ink hover:bg-ink/6"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <label className={`flex min-h-11 items-center rounded-xl border border-line bg-white px-3 ${mode === "on_request" ? "opacity-40" : ""}`}>
          <span className="mr-1 text-muted" aria-hidden>
            €
          </span>
          <span className="sr-only">{labels.amount}</span>
          <input
            name="price"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            pattern="^\d{1,5}([.,]\d{1,2})?$"
            title="Bijvoorbeeld 35 of 42,50"
            value={mode === "on_request" ? "" : price}
            disabled={mode === "on_request"}
            required={mode !== "on_request"}
            onChange={(e) => {
              setPrice(e.target.value);
              setDirty(true);
            }}
            className="w-full min-w-0 bg-transparent py-2 text-base tabular-nums outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 min-w-16 rounded-full bg-accent-deep px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-ink disabled:opacity-60"
        >
          {pending ? labels.saving : labels.ok}
        </button>
        {earlier.length > 0 && !restoring && (
          <p className="col-span-2 text-xs text-muted sm:col-span-4">
            {labels.earlier}: {fmt(earlier[0])} ({earlier[0].date}){earlier.length > 1 ? ` +${earlier.length - 1}` : ""}{" "}
            <button type="button" onClick={() => setRestoring(true)} disabled={pending} className="ml-1 min-h-8 rounded-full px-2 font-medium text-accent-deep underline disabled:opacity-60">
              {labels.restore}
            </button>
          </p>
        )}
        {restoring && (
          <fieldset className="col-span-2 rounded-2xl border border-line bg-surface p-3 text-sm sm:col-span-4">
            <legend className="px-1 font-medium">{labels.restoreTitle}</legend>
            <ul className="mt-1 space-y-1">
              {earlier.map((e, k) => (
                <li key={k}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-white">
                    <input type="radio" name={`restore-${id}`} checked={pick === k} onChange={() => setPick(k)} className="h-5 w-5" />
                    <span className="font-medium tabular-nums">{fmt(e)}</span>
                    <span className="text-xs text-muted">
                      {labels.changedOn} {e.date}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={confirmRestore} disabled={pick == null || pending} className="min-h-11 rounded-full bg-ink px-4 font-semibold text-white disabled:opacity-40">
                {labels.confirm}
                {pick != null ? `: ${fmt(earlier[pick])}` : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRestoring(false);
                  setPick(null);
                }}
                className="min-h-11 rounded-full border border-ink/25 px-4"
              >
                {labels.cancel}
              </button>
            </div>
          </fieldset>
        )}
        <div aria-live="polite" className="col-span-2 sm:col-span-4">
          {showMsg && state.ok && <p className="text-sm text-[#2f4b2d]">✓ {state.message}</p>}
          {showMsg && state.error && <p className="text-sm text-[#74261d]">{state.error}</p>}
        </div>
      </form>
    </li>
  );
}
