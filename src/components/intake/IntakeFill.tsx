"use client";

import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import type { ParsedIntake } from "@/lib/intake/template";

type Loc = "nl" | "en" | "tr";

const UI: Record<Loc, Record<string, string>> = {
  nl: {
    hello: "Hallo", lead: "Vul dit formulier rustig in vóór je afspraak. Het duurt ongeveer 5 minuten. Je antwoorden gaan alleen naar Dilek en worden versleuteld bewaard.",
    agree: "Klopt", name: "Je volledige naam", sign: "Teken hieronder met je vinger of muis", clear: "Opnieuw tekenen",
    send: "Versturen en ondertekenen", sending: "Bezig met versturen…", doneT: "Dank je wel!", doneB: "Je intakeformulier is veilig ontvangen. Je kunt een kopie voor jezelf bewaren.",
    copy: "Mijn kopie downloaden (PDF)", basic: "Dit is een eenvoudige elektronische handtekening (op het scherm getekend).",
    missing: "Beantwoord alle vragen en bevestig alle punten.", needSig: "Zet nog je handtekening.", needConsent: "Geef toestemming om verder te gaan.", needName: "Vul je naam in.",
    expired: "Deze link werkt niet meer. Vraag Dilek om een nieuwe link: 020 550 0400.", error: "Versturen lukte niet. Probeer het zo nog eens of bel 020 550 0400.", rate: "Even te veel pogingen. Probeer het over een paar minuten opnieuw.",
    privacy: "Privacy: je antwoorden worden niet gedeeld met andere partijen en niet gebruikt voor reclame.",
  },
  en: {
    hello: "Hello", lead: "Please fill in this form calmly before your appointment. It takes about 5 minutes. Your answers go only to Dilek and are stored encrypted.",
    agree: "Agreed", name: "Your full name", sign: "Sign below with your finger or mouse", clear: "Draw again",
    send: "Submit and sign", sending: "Sending…", doneT: "Thank you!", doneB: "Your intake form has been received securely. You can keep a copy for yourself.",
    copy: "Download my copy (PDF)", basic: "This is a simple electronic signature (drawn on screen).",
    missing: "Please answer every question and confirm every statement.", needSig: "Please add your signature.", needConsent: "Please give consent to continue.", needName: "Please enter your name.",
    expired: "This link no longer works. Please ask Dilek for a new link: 020 550 0400.", error: "Sending failed. Please try again shortly or call 020 550 0400.", rate: "Too many attempts. Please try again in a few minutes.",
    privacy: "Privacy: your answers are not shared with other parties and never used for advertising.",
  },
  tr: {
    hello: "Merhaba", lead: "Randevundan önce bu formu sakince doldur. Yaklaşık 5 dakika sürer. Cevapların sadece Dilek'e gider ve şifreli olarak saklanır.",
    agree: "Onaylıyorum", name: "Adın ve soyadın", sign: "Aşağıya parmağınla veya fareyle imza at", clear: "Yeniden çiz",
    send: "Gönder ve imzala", sending: "Gönderiliyor…", doneT: "Teşekkürler!", doneB: "Intake formun güvenle alındı. Kendin için bir kopya saklayabilirsin.",
    copy: "Kopyamı indir (PDF)", basic: "Bu basit bir elektronik imzadır (ekranda çizildi).",
    missing: "Lütfen tüm soruları cevapla ve tüm maddeleri onayla.", needSig: "Lütfen imzanı ekle.", needConsent: "Devam etmek için onay ver.", needName: "Lütfen adını yaz.",
    expired: "Bu bağlantı artık çalışmıyor. Dilek'ten yeni bir bağlantı iste: 020 550 0400.", error: "Gönderilemedi. Birazdan tekrar dene veya 020 550 0400'ı ara.", rate: "Çok fazla deneme. Birkaç dakika sonra tekrar dene.",
    privacy: "Gizlilik: cevapların başka taraflarla paylaşılmaz ve reklam için kullanılmaz.",
  },
};

const field = "mt-1 w-full rounded-xl border border-[#d9cfc2] bg-white px-3.5 py-3 text-base text-ink outline-none focus:border-[#b08d57] focus:ring-2 focus:ring-[#b08d57]/25";

function SignaturePad({ onChange, clearLabel }: { onChange: (png: string) => void; clearLabel: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const drawn = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2b202b";
  }, []);

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    drawn.current = true;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (drawn.current && ref.current) onChange(ref.current.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    drawn.current = false;
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={ref}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="h-44 w-full touch-none rounded-xl border border-dashed border-[#b08d57] bg-white"
        aria-label="signature"
      />
      <button type="button" onClick={clear} className="mt-2 text-sm text-[#7a5c2e] underline underline-offset-4">
        {clearLabel}
      </button>
    </div>
  );
}

export function IntakeFill({ token, locale, name, parsed, consentText, version }: { token: string; locale: Loc; name: string; parsed: ParsedIntake; consentText: string; version: string }) {
  const T = UI[locale];
  const [a, setA] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(name);
  const [consent, setConsent] = useState(false);
  const [sig, setSig] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pdf, setPdf] = useState<string | null>(null);
  const set = (k: string, v: string) => setA((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    for (const [bi, b] of parsed.blocks.entries()) {
      if (b.type === "questions" && b.items.some((_, ii) => !a[`q.${bi}.${ii}`])) return setErr(T.missing);
      if (b.type === "statements" && b.items.some((_, ii) => a[`s.${bi}.${ii}`] !== "yes")) return setErr(T.missing);
    }
    if (fullName.trim().length < 2) return setErr(T.needName);
    if (!consent) return setErr(T.needConsent);
    if (!sig) return setErr(T.needSig);
    setBusy(true);
    try {
      const res = await fetch(`/api/intake/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: a, name: fullName.trim(), consent, signature: sig }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; pdf?: string; error?: string };
      if (res.ok && j.ok && j.pdf) {
        const bin = atob(j.pdf);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        setPdf(URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setErr(res.status === 410 ? T.expired : res.status === 429 ? T.rate : res.status === 422 ? T.missing : T.error);
    } catch {
      setErr(T.error);
    } finally {
      setBusy(false);
    }
  };

  const Brand = (
    <header className="mb-8 text-center">
      <p className="font-serif text-[1.65rem] tracking-wide text-ink">Glow by Dilek</p>
      <div className="mx-auto mt-2 h-[3px] w-14 rounded-full bg-[#b08d57]" />
    </header>
  );

  if (pdf)
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        {Brand}
        <h1 className="font-serif text-3xl text-ink">{T.doneT}</h1>
        <p className="mt-3 text-ink-soft">{T.doneB}</p>
        <a href={pdf} download={`intake-glow-by-dilek-${version}.pdf`} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#2b202b] px-6 font-medium text-white">
          {T.copy}
        </a>
      </div>
    );

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-sm sm:p-10" noValidate>
      {Brand}
      <h1 className="font-serif text-3xl text-ink">{parsed.title}</h1>
      <p className="mt-2 text-ink">
        {T.hello} {name.split(" ")[0]},
      </p>
      <p className="mt-1 text-ink-soft">{T.lead}</p>

      <div className="mt-8 space-y-7">
        {parsed.blocks.map((b, bi) => {
          switch (b.type) {
            case "title":
            case "pagebreak":
            case "signature":
              return null;
            case "heading":
              return (
                <h2 key={bi} className="border-b border-[#eee5d8] pb-2 pt-2 font-serif text-xl text-ink">
                  {b.text}
                </h2>
              );
            case "intro":
              return (
                <p key={bi} className="text-ink-soft">
                  {b.text}
                </p>
              );
            case "note":
              return (
                <p key={bi} className="rounded-xl bg-[#faf6ef] px-4 py-3 text-sm text-ink-soft">
                  {b.text}
                </p>
              );
            case "fields":
              return (
                <div key={bi} className="grid gap-4 sm:grid-cols-2">
                  {b.labels.map((label, ii) => (
                    <label key={ii} className="block text-sm font-medium text-ink">
                      {label}
                      <input className={field} maxLength={200} value={a[`f.${bi}.${ii}`] ?? ""} onChange={(e) => set(`f.${bi}.${ii}`, e.target.value)} />
                    </label>
                  ))}
                </div>
              );
            case "line":
              return (
                <label key={bi} className="block text-sm font-medium text-ink">
                  {b.label}
                  <textarea rows={2} className={field} maxLength={500} value={a[`l.${bi}`] ?? ""} onChange={(e) => set(`l.${bi}`, e.target.value)} />
                </label>
              );
            case "options":
              return (
                <div key={bi} className="space-y-2">
                  {b.items.map((it, ii) => {
                    const on = a[`o.${bi}.${ii}`] === "yes";
                    return (
                      <div key={ii} className="rounded-xl border border-[#eee5d8] px-4 py-3">
                        <label className="flex items-start gap-3 text-ink">
                          <input type="checkbox" className="mt-1 size-5 accent-[#2b202b]" checked={on} onChange={(e) => set(`o.${bi}.${ii}`, e.target.checked ? "yes" : "")} />
                          <span>{it.label}</span>
                        </label>
                        {it.line && on && <input className={field} maxLength={300} value={a[`ot.${bi}.${ii}`] ?? ""} onChange={(e) => set(`ot.${bi}.${ii}`, e.target.value)} />}
                      </div>
                    );
                  })}
                </div>
              );
            case "questions":
              return (
                <fieldset key={bi} className="space-y-3">
                  {b.title && <legend className="mb-2 font-medium text-ink">{b.title}</legend>}
                  {b.items.map((q, ii) => (
                    <div key={ii} className="rounded-xl border border-[#eee5d8] px-4 py-3">
                      <p className="text-ink">{q}</p>
                      <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
                        {parsed.answers.map((ans) => {
                          const on = a[`q.${bi}.${ii}`] === ans;
                          return (
                            <button
                              type="button"
                              role="radio"
                              aria-checked={on}
                              key={ans}
                              onClick={() => set(`q.${bi}.${ii}`, ans)}
                              className={`min-h-11 rounded-full border px-4 text-sm ${on ? "border-[#2b202b] bg-[#2b202b] text-white" : "border-[#d9cfc2] bg-white text-ink"}`}
                            >
                              {ans}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </fieldset>
              );
            case "statements":
              return (
                <div key={bi} className="space-y-2">
                  {b.items.map((s, ii) => (
                    <label key={ii} className="flex items-start gap-3 rounded-xl border border-[#eee5d8] px-4 py-3 text-ink">
                      <input type="checkbox" className="mt-1 size-5 accent-[#2b202b]" checked={a[`s.${bi}.${ii}`] === "yes"} onChange={(e) => set(`s.${bi}.${ii}`, e.target.checked ? "yes" : "")} />
                      <span>
                        {s} <span className="text-sm text-ink-soft">({T.agree})</span>
                      </span>
                    </label>
                  ))}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>

      <div className="mt-10 space-y-5 rounded-2xl bg-[#faf6ef] p-5">
        <label className="block text-sm font-medium text-ink">
          {T.name}
          <input className={field} autoComplete="name" maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="flex items-start gap-3 text-ink">
          <input type="checkbox" className="mt-1 size-5 accent-[#2b202b]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{consentText}</span>
        </label>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">{T.sign}</p>
          <SignaturePad onChange={setSig} clearLabel={T.clear} />
          <p className="mt-2 text-xs text-ink-soft">{T.basic}</p>
        </div>
      </div>

      {err && (
        <p role="alert" className="mt-5 rounded-xl bg-[#fbeceb] px-4 py-3 text-sm text-[#8a2a22]">
          {err}
        </p>
      )}
      <button type="submit" disabled={busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#2b202b] px-6 font-medium text-white disabled:opacity-60 sm:w-auto">
        {busy ? T.sending : T.send}
      </button>
      <p className="mt-4 text-xs text-ink-soft">{T.privacy}</p>
      <p className="mt-1 text-[11px] text-ink-soft/70">{version}</p>
    </form>
  );
}
