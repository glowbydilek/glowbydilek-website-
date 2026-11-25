"use client";

import { useEffect, useMemo, useState } from "react";
import { contentAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Textarea } from "../ui";
import { Buttons } from "./ContentEditor";
import { useT } from "@/components/private/PanelLangProvider";
import { contentChecks, extractContent, overall, snippetChecks, suggestKeyword, type CheckStatus, type ContentInput, type SeoCheck } from "@/lib/seo-analysis";

export type Seo = { focusKeyword?: string; title?: string; description?: string; noindex?: boolean; ogTitle?: string; ogDescription?: string; ogImage?: number | null };

export function SeoForm({ seoKey, locale, initial, defaults, path, media }: { seoKey: string; locale: "nl" | "en" | "tr"; initial: Seo; defaults: { title: string; description: string }; path: string; media: { id: number; name: string }[] }) {
  const t = useT();
  const [v, setV] = useState<Seo>(initial);
  const title = v.title || defaults.title;
  const desc = v.description || defaults.description;
  const suggestion = suggestKeyword(defaults.title);
  const keyword = v.focusKeyword?.trim() || suggestion;
  // Content of the live page (published version), for the Yoast-style content checks.
  const [content, setContent] = useState<ContentInput | null>(null);
  useEffect(() => {
    let off = false;
    fetch(path, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : ""))
      .then((html) => { if (!off && html) setContent(extractContent(html, window.location.origin)); })
      .catch(() => {});
    return () => { off = true; };
  }, [path]);
  const snippet = useMemo(() => snippetChecks({ keyword, title, description: desc, path, noindex: v.noindex }), [keyword, title, desc, path, v.noindex]);
  const body = useMemo(() => (content ? contentChecks(content, keyword) : []), [content, keyword]);
  const score = overall([...snippet, ...body]);
  return (
    <ActionForm action={contentAction}>
      <input type="hidden" name="docKey" value={`seo:${seoKey}`} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="data" value={JSON.stringify(v)} />
      <Field label="Focus-zoekwoord" hint="Waarop moet deze pagina gevonden worden? Bijvoorbeeld ‘wenkbrauwen waxen amsterdam’. Wordt niet op de site getoond.">
        <Input value={v.focusKeyword ?? ""} placeholder={suggestion ? t(`Voorstel: ${suggestion}`) : ""} maxLength={80} onChange={(e) => setV({ ...v, focusKeyword: e.target.value })} />
      </Field>
      <Field label="SEO-titel" hint={`Leeg = standaard: “${defaults.title}”. Ideaal: tot 60 tekens (${title.length}).`}>
        <Input value={v.title ?? ""} maxLength={70} onChange={(e) => setV({ ...v, title: e.target.value })} />
      </Field>
      <Field label="Meta-omschrijving" hint={`Leeg = standaard. Ideaal: 120–160 tekens (${desc.length}).`}>
        <Textarea rows={3} value={v.description ?? ""} maxLength={200} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </Field>
      <div className="rounded-xl bg-white p-3 text-sm shadow-sm">
        <p className="text-[0.7rem] uppercase tracking-wide text-muted">{t("Voorbeeld in Google")}</p>
        <p className="mt-1 text-xs text-[#1a7f37]">glowbydilek.nl{path.split("/").filter(Boolean).map((x) => ` › ${x}`).join("")}</p>
        <p className="text-lg leading-snug text-[#1a0dab]">{cut(`${title} | Glow by Dilek`, 62)}</p>
        <p className="text-[#4d5156]">{cut(desc, 158)}</p>
      </div>
      <SeoAnalysis score={score} groups={[{ title: "Titel, omschrijving en adres", checks: snippet }, { title: content ? "Tekst op de pagina" : "Tekst op de pagina (laden…)", checks: body }]} />
      <details className="rounded-xl border border-line p-3">
        <summary className="cursor-pointer text-sm">{t("Delen op sociale media (Open Graph)")}</summary>
        <div className="mt-3 space-y-3">
          <Field label="Titel bij delen"><Input value={v.ogTitle ?? ""} onChange={(e) => setV({ ...v, ogTitle: e.target.value })} /></Field>
          <Field label="Omschrijving bij delen"><Textarea rows={2} value={v.ogDescription ?? ""} onChange={(e) => setV({ ...v, ogDescription: e.target.value })} /></Field>
          <Field label="Afbeelding bij delen">
            <select className="block w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5" value={v.ogImage ?? ""} onChange={(e) => setV({ ...v, ogImage: e.target.value ? Number(e.target.value) : null })}>
              <option value="">{t("Standaard Glow by Dilek-afbeelding")}</option>
              {media.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
        </div>
      </details>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={Boolean(v.noindex)} onChange={(e) => setV({ ...v, noindex: e.target.checked })} className="h-5 w-5" />
        {t("Niet laten vinden in Google (noindex) — de pagina verdwijnt ook uit de sitemap")}
      </label>
      <div className="flex flex-wrap gap-2">
        <Buttons op="publish">{t("Publiceren")}</Buttons>
        <Buttons op="reset" variant="ghost" confirm="Standaardwaarden terugzetten?">{t("Standaard")}</Buttons>
      </div>
    </ActionForm>
  );
}

function cut(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()} …` : s;
}

const DOT: Record<CheckStatus, string> = { good: "bg-[#1a7f37]", ok: "bg-[#d4a017]", bad: "bg-[#c0392b]" };
const SCORE: Record<CheckStatus, string> = { good: "Goed", ok: "Kan beter", bad: "Moet beter" };

export function SeoDot({ status, label }: { status: CheckStatus; label?: string }) {
  return <span role="img" aria-label={label ?? SCORE[status]} title={label ?? SCORE[status]} className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT[status]}`} />;
}

function SeoAnalysis({ score, groups }: { score: CheckStatus; groups: { title: string; checks: SeoCheck[] }[] }) {
  const t = useT();
  const order: Record<CheckStatus, number> = { bad: 0, ok: 1, good: 2 };
  return (
    <section className="rounded-xl border border-line p-3" aria-label={t("SEO-analyse")}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <SeoDot status={score} /> {t("SEO-analyse")}: {t(SCORE[score])}
      </p>
      {groups.map((g) =>
        g.checks.length ? (
          <div key={g.title} className="mt-3">
            <p className="text-xs uppercase tracking-wide text-muted">{t(g.title)}</p>
            <ul className="mt-1.5 space-y-1.5 text-sm">
              {[...g.checks].sort((a, b) => order[a.status] - order[b.status]).map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <span className="mt-1.5"><SeoDot status={c.status} /></span>
                  <span>{t(c.text)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}
