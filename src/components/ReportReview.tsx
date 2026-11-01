"use client";

import { useState } from "react";

/** "Report this review" — sends the review id only. */
export function ReportReview({ id, label, done }: { id: number; label: string; done: string }) {
  const [sent, setSent] = useState(false);
  if (sent) return <p className="mt-3 text-xs text-muted">{done}</p>;
  return (
    <button
      type="button"
      className="mt-3 min-h-11 text-xs text-muted underline underline-offset-4 hover:text-ink"
      onClick={async () => {
        setSent(true);
        await fetch("/api/reviews/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => undefined);
      }}
    >
      {label}
    </button>
  );
}
