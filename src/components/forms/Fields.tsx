"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const control =
  "mt-2 block w-full rounded-2xl border bg-ivory-50 px-5 py-4 text-base text-charcoal placeholder:text-muted/70 transition-[border-color,box-shadow] duration-300 focus:outline-none focus:ring-4 focus:ring-gold/20";

function cls(error?: string) {
  return `${control} ${error ? "border-[#9b3b2f] focus:border-[#9b3b2f]" : "border-charcoal/15 hover:border-charcoal/30 focus:border-charcoal"}`;
}

type Base = { id: string; label: string; error?: string; hint?: string; optionalLabel?: string; required?: boolean };

function Label({ id, label, optionalLabel, required }: Base) {
  return (
    <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal">
      <span>
        {label}
        {required && <span aria-hidden="true" className="text-gold-deep"> *</span>}
      </span>
      {optionalLabel && <span className="text-[0.68rem] normal-case tracking-normal text-muted">{optionalLabel}</span>}
    </label>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-2 text-sm text-[#9b3b2f]">
      {error}
    </p>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  return [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

export function TextField(props: Base & InputHTMLAttributes<HTMLInputElement>) {
  const { id, label, error, hint, optionalLabel, required, ...rest } = props;
  return (
    <div>
      <Label id={id} label={label} optionalLabel={optionalLabel} required={required} />
      <input
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cls(error)}
        {...rest}
      />
      {hint && <p id={`${id}-hint`} className="mt-2 text-sm text-muted">{hint}</p>}
      <FieldError id={id} error={error} />
    </div>
  );
}

export function TextArea(props: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, label, error, hint, optionalLabel, required, ...rest } = props;
  return (
    <div>
      <Label id={id} label={label} optionalLabel={optionalLabel} required={required} />
      <textarea
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${cls(error)} min-h-[9rem] resize-y`}
        {...rest}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

export function SelectField(props: Base & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const { id, label, error, hint, optionalLabel, required, children, ...rest } = props;
  return (
    <div>
      <Label id={id} label={label} optionalLabel={optionalLabel} required={required} />
      <select
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${cls(error)} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2320382f' stroke-width='1.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-[length:1.1rem] bg-[right_1.25rem_center] bg-no-repeat pr-12`}
        {...rest}
      >
        {children}
      </select>
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Off-screen honeypot: real visitors never see or fill it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
      <label>
        Company
        <input tabIndex={-1} autoComplete="off" name="company" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function omit<T extends Record<string, unknown>>(obj: T, key: string): T {
  const next = { ...obj };
  delete next[key];
  return next;
}
