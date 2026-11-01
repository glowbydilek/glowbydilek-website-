"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import type { FormState } from "@/lib/private/authActions";
import { ActionPending } from "./pending";
import { Notice } from "./ui";

/**
 * Form bound to a server action, with a visible saved/error message.
 *
 * Submits through the action function inside a transition instead of the
 * native form action: React 19 resets every field after a form action, which
 * would wipe what the owner typed when the server answers with an error.
 */
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
  const [state, run, pending] = useActionState<FormState, FormData>(action, {});
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter && submitter.getAttribute("name") ? submitter : undefined);
    startTransition(() => run(fd));
  };
  const ref = useRef<HTMLFormElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
    if (state.ok || state.error) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} onSubmit={submit} className={className}>
      <div ref={msgRef} aria-live="polite">
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && state.message && <Notice tone="success">✓ {state.message}</Notice>}
      </div>
      <ActionPending.Provider value={pending}>{children}</ActionPending.Provider>
    </form>
  );
}
