"use client";

import { useRef, useState, useTransition, type RefObject } from "react";
import type { InvoiceSettings } from "@/lib/db/settings";
import type { KvkLookup } from "@/lib/finance/kvk";
import { kvkLookupAction, saveInvoiceSettingsAction } from "@/lib/private/financeActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";
import { useT } from "@/components/private/PanelLangProvider";

const KVK_MSG: Record<string, string> = {
  invalid: "Een KVK-nummer heeft precies 8 cijfers.",
  not_configured: "Automatisch ophalen is nog niet gekoppeld (KVK-abonnement nodig). Vul de gegevens hieronder zelf in.",
  not_found: "Dit KVK-nummer is niet gevonden in het Handelsregister. Controleer het nummer.",
  unavailable: "De KVK is nu niet bereikbaar. Probeer het later opnieuw of vul de gegevens zelf in.",
  rate_limited: "Te veel aanvragen achter elkaar. Probeer het over een minuut opnieuw.",
};

/**
 * "Gegevens ophalen": looks the KVK number up in the Handelsregister and shows
 * what was found. Nothing changes in the form until the owner taps
 * "Overnemen"; nothing is saved until Opslaan. Shielded addresses, BTW-id and
 * IBAN are never filled in.
 */
function KvkLookupBox({ formRef, kvk }: { formRef: RefObject<HTMLDivElement | null>; kvk: string }) {
  const t = useT();
  const [res, setRes] = useState<KvkLookup | null>(null);
  const [applied, setApplied] = useState(false);
  const [current, setCurrent] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const field = (name: string) => formRef.current?.closest("form")?.elements.namedItem(name) as HTMLInputElement | null;
  const lookup = () => {
    const n = (field("kvk")?.value ?? kvk).replace(/\s/g, "");
    setApplied(false);
    if (!/^\d{8}$/.test(n)) return setRes({ ok: false, reason: "invalid" });
    const now: Record<string, string> = {};
    for (const k of ["legalName", "tradeName", "kvk", "street", "postcode", "city", "country"]) now[k] = field(k)?.value ?? "";
    setCurrent(now);
    start(async () => setRes(await kvkLookupAction(n)));
  };
  const d = res?.ok ? res.data : null;
  const addr = d?.main?.address;
  const proposals: [string, string, string][] = d
    ? ([
        ["legalName", "Naam (Handelsregister)", d.legalName],
        ["tradeName", "Handelsnaam", d.tradeNames[0] ?? d.main?.name ?? ""],
        ["kvk", "KVK-nummer", d.kvk],
        ...(addr && !addr.shielded
          ? ([
              ["street", "Straat en huisnummer", addr.street],
              ["postcode", "Postcode", addr.postcode],
              ["city", "Plaats", addr.city],
              ["country", "Land", addr.country],
            ] as [string, string, string][])
          : []),
      ] as [string, string, string][]).filter(([, , val]) => val)
    : [];
  const apply = () => {
    for (const [name, , val] of proposals) {
      const el = field(name);
      if (el) el.value = val;
    }
    setApplied(true);
  };
  return (
    <div className="sm:col-span-2 space-y-3">
      <button type="button" onClick={lookup} disabled={pending} className="min-h-11 rounded-full border border-ink/25 px-4 text-sm font-medium hover:bg-ink/6 disabled:opacity-60">
        {pending ? "Bezig met ophalen…" : "Gegevens ophalen bij KVK"}
      </button>
      <div aria-live="polite">
        {res && !res.ok && <p className="text-sm text-[#74261d]">{KVK_MSG[res.reason]}</p>}
        {d && (
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
            <p className="mb-2 font-medium">{t("Gevonden in het Handelsregister — controleer en neem over:")}</p>
            <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-3 gap-y-1">
              {proposals.map(([name, label, val]) => {
                const cur = current[name] ?? "";
                return (
                  <div key={name} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd className="break-words">
                      {val}
                      {cur && cur !== val && <span className="block text-xs text-muted">nu ingevuld: {cur}</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {addr?.shielded && <p className="mt-2 text-xs text-muted">{t("Het adres is afgeschermd in het Handelsregister en wordt niet ingevuld. Vul het factuuradres zelf in.")}</p>}
            {d.tradeNames.length > 1 && <p className="mt-2 text-xs text-muted">Andere handelsnamen: {d.tradeNames.slice(1).join(", ")}</p>}
            {d.establishments.length > 1 && <p className="mt-2 text-xs text-muted">Vestigingen: {d.establishments.map((e) => `${e.name || "—"} (${e.number})`).join(" · ")}. Het adres van de hoofdvestiging wordt voorgesteld.</p>}
            <p className="mt-2 text-xs text-muted">{t("Btw-identificatienummer en IBAN komen niet uit het Handelsregister en blijven zoals ze zijn.")}</p>
            <button type="button" onClick={apply} className="mt-3 min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-white">
              {applied ? "✓ Overgenomen — tik onderaan op Opslaan" : "Overnemen in het formulier"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function BusinessForm({ v }: { v: InvoiceSettings }) {
  const t = useT();
  const [mode, setMode] = useState(v.vatMode);
  const anchor = useRef<HTMLDivElement>(null);
  return (
    <ActionForm action={saveInvoiceSettingsAction} className="space-y-6">
      <div ref={anchor} hidden />
      <fieldset className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-xl">{t("Onderneming")}</legend>
        <Field label="Naam zoals ingeschreven bij de KVK">
          <Input name="legalName" defaultValue={v.legalName} />
        </Field>
        <Field label="Handelsnaam">
          <Input name="tradeName" defaultValue={v.tradeName} />
        </Field>
        <Field label="KVK-nummer" hint="8 cijfers, zie je uittreksel.">
          <Input name="kvk" inputMode="numeric" maxLength={10} defaultValue={v.kvk} />
        </Field>
        <KvkLookupBox formRef={anchor} kvk={v.kvk} />
        <Field label="Factuurvoorvoegsel" hint="Bijv. GBD → GBD-2026-0001">
          <Input name="prefix" defaultValue={v.prefix} />
        </Field>
      </fieldset>
      <fieldset className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-xl">{t("Adres op de factuur")}</legend>
        <p className="text-sm text-muted sm:col-span-2">{t("Een factuur moet het adres van de onderneming vermelden. Dit adres staat alleen op facturen, nooit op de website.")}</p>
        <Field label="Straat en huisnummer">
          <Input name="street" defaultValue={v.street} autoComplete="off" />
        </Field>
        <Field label="Postcode">
          <Input name="postcode" defaultValue={v.postcode} autoComplete="off" />
        </Field>
        <Field label="Plaats">
          <Input name="city" defaultValue={v.city} autoComplete="off" />
        </Field>
        <Field label="Land">
          <Input name="country" defaultValue={v.country} />
        </Field>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-2 font-serif text-xl">{t("Btw")}</legend>
        <p className="text-sm text-muted">{t("Kies wat je boekhouder of de Belastingdienst voor jouw situatie heeft bevestigd. Het systeem kiest hier niets voor je en vult geen tarief in.")}</p>
        <Field label="Btw-situatie">
          <Select name="vatMode" value={mode} onChange={(e) => setMode(e.target.value as InvoiceSettings["vatMode"])}>
            <option value="">{t("— nog niet gekozen —")}</option>
            <option value="standard">{t("Ik reken btw")}</option>
            <option value="kor">{t("Kleineondernemersregeling (KOR) — geen btw")}</option>
            <option value="exempt">{t("Vrijgesteld van btw (andere vrijstelling)")}</option>
          </Select>
        </Field>
        {mode === "standard" && (
          <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
            <Field label="Btw-identificatienummer" hint="NL…B.., zie je brief van de Belastingdienst.">
              <Input name="vatNumber" defaultValue={v.vatNumber} />
            </Field>
            <Field label="Standaard btw-tarief (%)" hint="Het algemene tarief, zoals je boekhouder het opgaf.">
              <Input name="vatRate" inputMode="decimal" defaultValue={v.vatRateBp ? String(v.vatRateBp / 100).replace(".", ",") : ""} />
            </Field>
            <Field label="Verlaagd btw-tarief (%) — optioneel" hint="Alleen invullen als je boekhouder bevestigt dat bepaalde behandelingen hieronder vallen. Een huidbehandeling of diploma maakt een behandeling niet automatisch ‘verlaagd’ of ‘vrijgesteld’.">
              <Input name="reducedRate" inputMode="decimal" defaultValue={v.reducedRateBp ? String(v.reducedRateBp / 100).replace(".", ",") : ""} />
            </Field>
          </div>
        )}
        {(mode === "exempt" || mode === "kor") && (
          <Field label="Tekst op de factuur" hint={mode === "kor" ? "Bijv. de KOR-vermelding zoals je boekhouder die heeft bevestigd." : "De exacte vermelding die je boekhouder heeft bevestigd."}>
            <Textarea name="exemptionText" rows={2} defaultValue={v.exemptionText} />
          </Field>
        )}
      </fieldset>
      <fieldset className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-xl">{t("Betalen en contact")}</legend>
        <Field label="IBAN (optioneel)">
          <Input name="iban" defaultValue={v.iban} autoComplete="off" />
        </Field>
        <Field label="Ten name van">
          <Input name="accountHolder" defaultValue={v.accountHolder} />
        </Field>
        <Field label="Betaaltermijn (dagen)">
          <Input name="paymentTermDays" type="number" min={0} max={60} defaultValue={v.paymentTermDays} />
        </Field>
        <Field label="E-mail op de factuur">
          <Input name="email" type="email" defaultValue={v.email} />
        </Field>
        <Field label="Telefoon op de factuur (optioneel)">
          <Input name="phone" defaultValue={v.phone} />
        </Field>
        <Field label="Extra regel onderaan (optioneel)">
          <Input name="footer" defaultValue={v.footer} maxLength={200} />
        </Field>
      </fieldset>
      <SubmitButton pending="Bezig met opslaan…">{t("Opslaan")}</SubmitButton>
    </ActionForm>
  );
}
