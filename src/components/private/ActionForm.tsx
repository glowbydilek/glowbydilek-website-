"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { FormState } from "@/lib/private/authActions";
import { Notice } from "./ui";

/** Form bound to a server action, with a visible saved/error message. */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (state: FormState, f: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, run] = useActionState<FormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
    if (state.ok || state.error) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={run} className={className}>
      <div ref={msgRef} aria-live="polite">
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && state.message && <Notice tone="success">✓ {state.message}</Notice>}
      </div>
      {children}
    </form>
  );
}
