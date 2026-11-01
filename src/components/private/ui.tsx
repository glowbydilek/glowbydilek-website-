"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cloneElement, isValidElement, useId } from "react";
import { useFormStatus } from "react-dom";

/** Small UI kit for the private areas (admin and agenda): clear, calm, large touch targets. */

const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const btnVariants = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  gold: "bg-accent text-ink hover:bg-glow",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink/5",
  danger: "bg-[#8e2f24] text-white hover:bg-[#74261d]",
  ghost: "text-ink hover:bg-ink/6",
};
export type BtnVariant = keyof typeof btnVariants;

export function btnClass(variant: BtnVariant = "primary", extra = "") {
  return `${btnBase} ${btnVariants[variant]} ${extra}`;
}

export function Button({ variant = "primary", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return <button {...rest} className={btnClass(variant, className)} />;
}

export function SubmitButton({ children, pending, variant = "primary", className = "", confirm, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: string; variant?: BtnVariant; confirm?: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <button
      type="submit"
      {...rest}
      disabled={busy || rest.disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
        rest.onClick?.(e);
      }}
      className={btnClass(variant, className)}
    >
      {busy ? (pending ?? "Bezig…") : children}
    </button>
  );
}

export function LinkButton({ href, variant = "outline", children, className = "" }: { href: string; variant?: BtnVariant; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={btnClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  // Links the label to its control automatically (accessible name), unless the caller passes htmlFor.
  const auto = useId();
  let id = htmlFor;
  let control = children;
  if (!id && isValidElement<{ id?: string }>(children)) {
    id = children.props.id ?? auto;
    if (!children.props.id) control = cloneElement(children, { id });
  }
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {control}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-sm text-[#8e2f24]">{error}</p>}
    </div>
  );
}

const inputCls =
  "block w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition focus:border-accent-deep focus:ring-2 focus:ring-accent/40 disabled:bg-sand";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Card({ children, className = "", title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-serif text-2xl text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warning"; children: ReactNode }) {
  const tones = {
    info: "border-line bg-surface text-ink",
    success: "border-[#5c7f5a]/40 bg-[#eef4ec] text-[#2f4b2d]",
    error: "border-[#8e2f24]/30 bg-[#fbeeec] text-[#74261d]",
    warning: "border-accent/60 bg-[#fbf3e4] text-[#5a4320]",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "pending" | "confirmed" | "cancelled" | "done" | "warning" }) {
  const tones = {
    neutral: "bg-sand text-ink",
    pending: "bg-[#fbf0d9] text-[#6b4b12]",
    confirmed: "bg-[#e3efe1] text-[#2f4b2d]",
    cancelled: "bg-[#f6e1de] text-[#74261d]",
    done: "bg-[#e6e9f2] text-[#2f3a5a]",
    warning: "bg-[#fbe8d3] text-[#6b3a12]",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Key figure (finance, CRM metrics). */
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-white p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 break-words font-serif text-[1.7rem] leading-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
