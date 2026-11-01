import type { ReactNode } from "react";
import { LogoSymbol } from "@/components/brand/Logo";

export function AuthShell({ area, title, children, label }: { area: "admin" | "agenda"; title: string; children: ReactNode; label?: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoSymbol className="h-14 w-auto" />
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-accent-deep">{label ?? (area === "admin" ? "Glow by Dilek — Websitebeheer" : "Glow by Dilek — Agenda")}</p>
          <h1 className="mt-2 font-serif text-3xl text-ink">{title}</h1>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
