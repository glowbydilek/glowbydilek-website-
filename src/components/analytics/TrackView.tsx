"use client";

import { useEffect } from "react";
import { track, type TrackEvent } from "@/lib/analytics/track";

/** Sends one non-personal event when the page is shown (no-op without consent). */
export function TrackView({ event, treatmentId, categoryId }: { event: TrackEvent; treatmentId?: string; categoryId?: string }) {
  useEffect(() => {
    // Small delay so the measurement loader (after consent) has registered.
    const t = window.setTimeout(() => track(event, { treatment_id: treatmentId, category_id: categoryId }), 400);
    return () => window.clearTimeout(t);
  }, [event, treatmentId, categoryId]);
  return null;
}
