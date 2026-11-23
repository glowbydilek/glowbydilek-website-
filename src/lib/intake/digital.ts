import "server-only";
import { createHash, randomBytes } from "node:crypto";
import PDFDocument from "pdfkit";
import { and, desc, eq, gt } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { customers, intakeDocuments, intakeRequests, intakeTemplates } from "../db/schema";
import { enqueue } from "../notifications/outbox";
import { paragraphsToHtml } from "../notifications/templates";
import { PDF_FONT, registerPdfFonts } from "../pdf/fonts";
import { logoData } from "../../components/brand/logoData";
import { activeTemplate, encryptFile, ensureIntakeTemplates, IntakeError, intakeStorageStatus } from "./service";
import { ANSWERS, parseIntake, type IntakeBlock, type ParsedIntake } from "./template";

/**
 * Digital intake: the owner sends a one-time link; the customer fills in the
 * active intake form, gives explicit consent and signs on screen. The filled
 * form becomes a PDF that is stored encrypted, exactly like a scanned paper
 * form. The signature is a simple electronic signature (drawn on screen),
 * not a qualified electronic signature.
 */

type Locale = "nl" | "en" | "tr";
const LINK_DAYS = 7;
const SIG_MAX = 250_000;
const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
const asLoc = (l: string): Locale => (l === "en" || l === "tr" ? l : "nl");

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://glowbydilek.nl").replace(/\/$/, "");
}

/** Owner: create a link and email it to the customer (in her language). */
export async function sendIntakeRequest(db: DB, customerId: number, who: { userId: number; mfa: boolean }) {
  const st = await intakeStorageStatus(db, who.mfa);
  if (!st.enabled) throw new IntakeError(st.reasons[0]);
  const [c] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!c || c.anonymizedAt) throw new IntakeError("Klant niet gevonden.");
  if (!c.email) throw new IntakeError("Deze klant heeft geen e-mailadres. Vul het eerst in bij Gegevens.");
  const locale = asLoc(c.locale);
  await ensureIntakeTemplates(db);
  const tpl = await activeTemplate(db, locale);
  if (!tpl) throw new IntakeError("Er is nog geen actief intakeformulier in deze taal.");
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_DAYS * 86_400_000);
  // One open link per customer: older open links stop working.
  await db.update(intakeRequests).set({ status: "cancelled" }).where(and(eq(intakeRequests.customerId, customerId), eq(intakeRequests.status, "sent")));
  const [r] = await db.insert(intakeRequests).values({ customerId, tokenHash: sha(token), locale, templateVersion: tpl.version, expiresAt, createdBy: who.userId }).$returningId();
  const link = `${siteUrl()}/intake/${token}`;
  const first = c.firstName;
  const t = {
    nl: { s: "Je intakeformulier — Glow by Dilek", p: [`Beste ${first},`, "Voor je behandeling vraag ik je een kort intakeformulier in te vullen. Zo weet ik of de behandeling veilig voor je is.", `Vul het hier in (de link werkt ${LINK_DAYS} dagen en één keer):\n${link}`, "Je antwoorden worden versleuteld bewaard en alleen door mij gelezen.", "Hartelijke groet,\nDilek — Glow by Dilek"] },
    en: { s: "Your intake form — Glow by Dilek", p: [`Dear ${first},`, "Before your treatment I'd like you to fill in a short intake form, so I know the treatment is safe for you.", `Please fill it in here (the link works for ${LINK_DAYS} days and once):\n${link}`, "Your answers are stored encrypted and read only by me.", "Kind regards,\nDilek — Glow by Dilek"] },
    tr: { s: "Ön bilgi formun — Glow by Dilek", p: [`Merhaba ${first},`, "Bakımından önce kısa bir ön bilgi formu doldurmanı rica ediyorum. Böylece bakımın senin için güvenli olup olmadığını bilirim.", `Formu buradan doldurabilirsin (bağlantı ${LINK_DAYS} gün ve bir kez geçerlidir):\n${link}`, "Cevapların şifreli olarak saklanır ve sadece ben okurum.", "Sevgiler,\nDilek — Glow by Dilek"] },
  }[locale];
  await enqueue(db, {
    dedupeKey: `intake-request:${r.id}`,
    kind: "intake_request",
    customerId,
    to: c.email,
    replyTo: process.env.MAIL_TO || process.env.SMTP_USER || null,
    subject: t.s,
    text: t.p.join("\n\n"),
    html: paragraphsToHtml(t.p),
  });
  await audit(db, { userId: who.userId, action: "intake.request.sent", entity: "customer", entityId: customerId, details: { requestId: r.id, version: tpl.version } });
  return r.id;
}

export type OpenRequest = { id: number; customerId: number; firstName: string; lastName: string; locale: Locale; version: string; parsed: ParsedIntake };

/** Public: the open request behind a token, or null (unknown, used, cancelled or expired). */
export async function openRequest(db: DB, token: string): Promise<OpenRequest | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [r] = await db
    .select()
    .from(intakeRequests)
    .where(and(eq(intakeRequests.tokenHash, sha(token)), eq(intakeRequests.status, "sent"), gt(intakeRequests.expiresAt, new Date())));
  if (!r) return null;
  const [c] = await db.select({ firstName: customers.firstName, lastName: customers.lastName, anonymizedAt: customers.anonymizedAt }).from(customers).where(eq(customers.id, r.customerId));
  if (!c || c.anonymizedAt) return null;
  const [tpl] = await db.select().from(intakeTemplates).where(and(eq(intakeTemplates.locale, r.locale), eq(intakeTemplates.version, r.templateVersion)));
  if (!tpl) return null;
  const locale = asLoc(r.locale);
  return { id: r.id, customerId: r.customerId, firstName: c.firstName, lastName: c.lastName, locale, version: r.templateVersion, parsed: parseIntake(tpl.source, r.templateVersion, ANSWERS[locale]) };
}

export type IntakeSubmission = { answers: Record<string, string>; name: string; consent: boolean; signature: string };

/** Keys the form uses: q.{block}.{item}, s.{block}.{item}, o.{block}.{item}, ot.{block}.{item}, f.{block}.{item}, l.{block}. */
export function validateSubmission(parsed: ParsedIntake, s: IntakeSubmission): { ok: true; png: Buffer } | { ok: false; error: string } {
  if (!s || typeof s !== "object") return { ok: false, error: "invalid" };
  if (s.consent !== true) return { ok: false, error: "consent" };
  const name = String(s.name ?? "").trim();
  if (name.length < 2 || name.length > 120) return { ok: false, error: "name" };
  const a = s.answers && typeof s.answers === "object" ? s.answers : {};
  for (const [k, v] of Object.entries(a)) if (typeof v !== "string" || v.length > 500 || k.length > 20) return { ok: false, error: "invalid" };
  for (const [bi, b] of parsed.blocks.entries()) {
    if (b.type === "questions") for (const [ii] of b.items.entries()) if (!parsed.answers.includes(a[`q.${bi}.${ii}`] ?? "")) return { ok: false, error: "questions" };
    if (b.type === "statements") for (const [ii] of b.items.entries()) if (a[`s.${bi}.${ii}`] !== "yes") return { ok: false, error: "statements" };
  }
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(s.signature ?? ""));
  if (!m) return { ok: false, error: "signature" };
  const png = Buffer.from(m[1], "base64");
  if (png.length < 200 || png.length > SIG_MAX || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return { ok: false, error: "signature" };
  return { ok: true, png };
}

/** Public: stores the filled, signed form (encrypted) and closes the link. Returns the PDF for the customer's own copy. */
export async function submitIntake(db: DB, token: string, s: IntakeSubmission): Promise<{ ok: true; pdf: Buffer } | { ok: false; error: string }> {
  const req = await openRequest(db, token);
  if (!req) return { ok: false, error: "expired" };
  const v = validateSubmission(req.parsed, s);
  if (!v.ok) return v;
  const st = await intakeStorageStatus(db, true);
  if (!st.enabled) return { ok: false, error: "unavailable" };
  const key = Buffer.from(process.env.INTAKE_DOCUMENT_KEY ?? "", "base64");
  const signedOn = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
  const pdf = await filledIntakePdf(req, s, v.png, signedOn);
  const now = new Date();
  const docId = await db.transaction(async (tx) => {
    // The token can only be used once, also under concurrent submits.
    const [res] = (await tx
      .update(intakeRequests)
      .set({ status: "completed", completedAt: now })
      .where(and(eq(intakeRequests.id, req.id), eq(intakeRequests.status, "sent")))) as unknown as [{ affectedRows: number }];
    if (res.affectedRows !== 1) return null;
    await tx.update(intakeDocuments).set({ status: "superseded", supersededAt: now }).where(and(eq(intakeDocuments.customerId, req.customerId), eq(intakeDocuments.status, "current")));
    const [r] = await tx
      .insert(intakeDocuments)
      .values({
        customerId: req.customerId,
        templateVersion: req.version,
        locale: req.locale,
        signedOn,
        status: "current",
        mime: "application/pdf",
        size: pdf.length,
        sha256: sha(pdf),
        originalSha256: sha(pdf),
        metadataStripped: false,
        dataEnc: encryptFile(pdf, key),
        source: "digital",
        note: null,
        uploadedBy: null,
      })
      .$returningId();
    await tx.update(intakeRequests).set({ documentId: r.id }).where(eq(intakeRequests.id, req.id));
    return r.id;
  });
  if (!docId) return { ok: false, error: "expired" };
  await audit(db, { userId: null, action: "intake.document.digital", entity: "customer", entityId: req.customerId, details: { documentId: docId, version: req.version } });
  return { ok: true, pdf };
}

/** Owner: mark a stored form as checked. */
export async function reviewIntakeDocument(db: DB, customerId: number, id: number, who: { userId: number }) {
  const [d] = await db.select({ id: intakeDocuments.id }).from(intakeDocuments).where(and(eq(intakeDocuments.id, id), eq(intakeDocuments.customerId, customerId)));
  if (!d) throw new IntakeError("Document niet gevonden.");
  await db.update(intakeDocuments).set({ reviewedAt: new Date(), reviewedBy: who.userId }).where(eq(intakeDocuments.id, id));
  await audit(db, { userId: who.userId, action: "intake.document.reviewed", entity: "customer", entityId: customerId, details: { documentId: id } });
}

export async function openRequestsFor(db: DB, customerId: number) {
  return db
    .select({ id: intakeRequests.id, status: intakeRequests.status, expiresAt: intakeRequests.expiresAt, createdAt: intakeRequests.createdAt, completedAt: intakeRequests.completedAt })
    .from(intakeRequests)
    .where(eq(intakeRequests.customerId, customerId))
    .orderBy(desc(intakeRequests.id))
    .limit(5);
}

// ───────────────────────────────────────────────────────── PDF of the filled form

const INK = "#2B202B";
const MUTED = "#6B5867";
const LINE = "#BFA9B1";
const ACCENT = "#8E4759";
const LEFT = 56;
const WIDTH = 483;
const BOTTOM = 790;

const LABELS = {
  nl: { name: "Naam", version: "Versie", date: "Datum", digital: "Digitaal ingevuld en ondertekend", consent: "Toestemming", consentText: "Ik geef uitdrukkelijk toestemming om mijn antwoorden over mijn gezondheid te bewaren, alleen om de behandeling veilig uit te voeren.", signature: "Handtekening", sigNote: "Eenvoudige elektronische handtekening (op het scherm getekend). Geen gekwalificeerde elektronische handtekening.", yes: "Akkoord" },
  en: { name: "Name", version: "Version", date: "Date", digital: "Filled in and signed online", consent: "Consent", consentText: "I explicitly consent to my answers about my health being stored, solely to carry out the treatment safely.", signature: "Signature", sigNote: "Simple electronic signature (drawn on screen). Not a qualified electronic signature.", yes: "Agreed" },
  tr: { name: "Ad", version: "Sürüm", date: "Tarih", digital: "Online dolduruldu ve imzalandı", consent: "Onay", consentText: "Sağlığımla ilgili cevaplarımın sadece bakımın güvenli yapılması amacıyla saklanmasına açıkça onay veriyorum.", signature: "İmza", sigNote: "Basit elektronik imza (ekranda çizildi). Nitelikli elektronik imza değildir.", yes: "Kabul" },
} as const;

export const CONSENT_TEXT = { nl: LABELS.nl.consentText, en: LABELS.en.consentText, tr: LABELS.tr.consentText };

async function filledIntakePdf(req: OpenRequest, s: IntakeSubmission, png: Buffer, signedOn: string): Promise<Buffer> {
  const L = LABELS[req.locale];
  const a = s.answers ?? {};
  const doc = new PDFDocument({ size: "A4", bufferPages: true, margins: { top: 56, bottom: 56, left: LEFT, right: 56 }, info: { Title: `${req.parsed.title} (${req.version})`, Author: "Glow by Dilek", Creator: "Glow by Dilek", Producer: "Glow by Dilek" }, compress: true });
  registerPdfFonts(doc);
  const done = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  let y = 56;
  const header = () => {
    const scale = 0.24;
    doc.save().translate(LEFT, 56 + 70 * scale).scale(scale);
    doc.path(logoData.word).fill(INK);
    doc.path(logoData.glint).fill(ACCENT);
    doc.translate(logoData.inline.x, 0).path(logoData.inline.by).fill(INK);
    doc.restore();
    doc.fillColor(MUTED).font(PDF_FONT.body).fontSize(8).text(`${req.version} · ${L.digital}`, LEFT, 60, { width: WIDTH, align: "right" });
    y = 96;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      header();
    }
  };
  const text = (str: string, o: { size?: number; font?: string; color?: string; gap?: number; x?: number; width?: number } = {}) => {
    doc.font(o.font ?? PDF_FONT.body).fontSize(o.size ?? 9.5).fillColor(o.color ?? INK);
    const w = o.width ?? WIDTH - ((o.x ?? LEFT) - LEFT);
    const h = doc.heightOfString(str, { width: w, lineGap: 1.5 });
    ensure(h + (o.gap ?? 4));
    doc.text(str, o.x ?? LEFT, y, { width: w, lineGap: 1.5 });
    y += h + (o.gap ?? 4);
  };
  const pair = (label: string, value: string) => {
    doc.font(PDF_FONT.body).fontSize(9.5);
    const h = Math.max(doc.heightOfString(value || "—", { width: WIDTH - 170 }), 12);
    ensure(h + 6);
    doc.fillColor(MUTED).text(label, LEFT, y, { width: 160 });
    doc.fillColor(INK).text(value || "—", LEFT + 170, y, { width: WIDTH - 170 });
    y += h + 6;
  };
  const rule = () => {
    doc.moveTo(LEFT, y).lineTo(LEFT + WIDTH, y).lineWidth(0.6).strokeColor(LINE).stroke();
    y += 6;
  };

  header();
  pair(L.name, s.name.trim());
  pair(L.date, signedOn.split("-").reverse().join("-"));
  pair(L.version, req.version);
  y += 4;
  req.parsed.blocks.forEach((b: IntakeBlock, bi: number) => {
    switch (b.type) {
      case "title":
        text(b.text, { size: 17, font: PDF_FONT.heading, gap: 6 });
        break;
      case "heading":
        y += 4;
        text(b.text, { size: 11, font: PDF_FONT.bold, color: ACCENT, gap: 2 });
        rule();
        break;
      case "intro":
      case "note":
        text(b.text, { size: 8.5, color: MUTED, gap: 5 });
        break;
      case "fields":
        b.labels.forEach((label, ii) => pair(label, (a[`f.${bi}.${ii}`] ?? "").trim()));
        break;
      case "options":
        b.items.forEach((it, ii) => {
          const on = a[`o.${bi}.${ii}`] === "yes";
          const extra = (a[`ot.${bi}.${ii}`] ?? "").trim();
          text(`${on ? "☑" : "☐"} ${it.label}${on && extra ? `: ${extra}` : ""}`, { size: 9.5, gap: 3 });
        });
        y += 3;
        break;
      case "questions":
        if (b.title) text(b.title, { font: PDF_FONT.bold, size: 9.5, gap: 3 });
        b.items.forEach((q, ii) => pair(q, a[`q.${bi}.${ii}`] ?? "—"));
        break;
      case "line":
        pair(b.label, (a[`l.${bi}`] ?? "").trim());
        break;
      case "statements":
        b.items.forEach((st, ii) => text(`${a[`s.${bi}.${ii}`] === "yes" ? "☑" : "☐"} ${st}`, { size: 9, gap: 3 }));
        y += 3;
        break;
      case "signature":
      case "pagebreak":
        break;
    }
  });
  y += 6;
  text(L.consent, { size: 11, font: PDF_FONT.bold, color: ACCENT, gap: 2 });
  rule();
  text(`☑ ${L.consentText}`, { size: 9, gap: 8 });
  text(L.signature, { size: 11, font: PDF_FONT.bold, color: ACCENT, gap: 2 });
  rule();
  ensure(110);
  doc.image(png, LEFT, y, { fit: [240, 90] });
  y += 96;
  text(`${s.name.trim()} · ${signedOn.split("-").reverse().join("-")}`, { size: 9.5, gap: 2 });
  text(L.sigNote, { size: 7.5, color: MUTED, gap: 2 });
  doc.end();
  return done;
}
