"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-paper">
      Afdrukken
    </button>
  );
}
