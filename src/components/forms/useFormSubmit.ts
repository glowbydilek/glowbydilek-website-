"use client";

import { useEffect, useRef, useState } from "react";

export type SubmitState =
  | { status: "idle" | "sending" }
  | { status: "success"; acknowledged: boolean }
  | { status: "error"; error: string; fields?: Record<string, string> };

/** Posts JSON to a form endpoint; adds the anti-spam timestamp + honeypot. */
export function useFormSubmit(endpoint: string) {
  const startedAt = useRef<number>(0);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  // Record when the form became interactive (used for the anti-bot timing check).
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(values: Record<string, unknown>, honeypot: string) {
    setState({ status: "sending" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company: honeypot, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        acknowledged?: boolean;
        error?: string;
        fields?: Record<string, string>;
      };
      if (res.ok && data.ok) {
        setState({ status: "success", acknowledged: data.acknowledged !== false });
        return true;
      }
      setState({ status: "error", error: data.error ?? "generic", fields: data.fields });
    } catch {
      setState({ status: "error", error: "generic" });
    }
    return false;
  }

  function reset() {
    startedAt.current = Date.now();
    setState({ status: "idle" });
  }

  return { state, submit, reset, setState };
}
