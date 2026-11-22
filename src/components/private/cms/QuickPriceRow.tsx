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
  labels,
}: {
  id: string;
  name: string;
  mode: Mode;
  priceCents: number | null;
  status: string;
  visible: boolean;
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
        <div aria-live="polite" className="col-span-2 sm:col-span-4">
          {showMsg && state.ok && <p className="text-sm text-[#2f4b2d]">✓ {state.message}</p>}
          {showMsg && state.error && <p className="text-sm text-[#74261d]">{state.error}</p>}
        </div>
      </form>
    </li>
  );
}
