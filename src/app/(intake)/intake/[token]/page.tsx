import { databaseConfigured, getDb } from "@/lib/db/client";
import { CONSENT_TEXT, openRequest } from "@/lib/intake/digital";
import { IntakeFill } from "@/components/intake/IntakeFill";

export const dynamic = "force-dynamic";

const GONE = {
  nl: { t: "Deze link werkt niet meer", b: "De link is al gebruikt, verlopen of vervangen door een nieuwe. Vraag Dilek gerust om een nieuwe link: 020 550 0400." },
  en: { t: "This link no longer works", b: "The link has been used, has expired or was replaced. Please ask Dilek for a new link: 020 550 0400." },
};

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const req = databaseConfigured() ? await openRequest(getDb(), token) : null;
  if (!req) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <p className="font-serif text-3xl text-ink">{GONE.nl.t}</p>
        <p className="mt-3 text-ink-soft">{GONE.nl.b}</p>
        <p className="mt-8 font-serif text-2xl text-ink">{GONE.en.t}</p>
        <p className="mt-2 text-ink-soft">{GONE.en.b}</p>
      </main>
    );
  }
  return (
    <main lang={req.locale} className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <IntakeFill token={token} locale={req.locale} name={`${req.firstName} ${req.lastName}`.trim()} parsed={req.parsed} consentText={CONSENT_TEXT[req.locale]} version={req.version} />
    </main>
  );
}
