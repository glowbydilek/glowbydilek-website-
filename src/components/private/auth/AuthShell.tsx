import type { ReactNode } from "react";
import { LogoSymbol } from "@/components/brand/Logo";

export function AuthShell({ area, title, children }: { area: "admin" | "ajanda"; title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoSymbol className="h-14 w-auto" />
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-gold-deep">{area === "admin" ? "Admin Glow by Dilek" : "Glow by Dilek — Ajanda"}</p>
          <h1 className="mt-2 font-serif text-3xl text-charcoal">{title}</h1>
        </div>
        <div className="rounded-2xl border border-stone bg-white p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
