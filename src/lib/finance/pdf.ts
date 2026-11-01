import "server-only";
import PDFDocument from "pdfkit";
import type { InvoiceSettings } from "../db/settings";
import { formatCents } from "./money";
import { formatRate, type ComputedLine, type VatRow } from "./invoice-core";
import { logoData } from "../../components/brand/logoData";

/**
 * Server-side PDF generation (pdfkit, pure JavaScript, works on Hostinger
 * Node.js without native modules). Uses the built-in Helvetica family, so
 * no font files are needed at runtime.
 */

const INK = "#221A17";
const MUTED = "#6B5D52";
const LINE = "#D9CBBA";
const ACCENT = "#A0461E";

function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function newDoc(title: string) {
  return new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: 56, bottom: 64, left: 56, right: 56 },
    info: { Title: title, Author: "Glow by Dilek", Creator: "Glow by Dilek", Producer: "Glow by Dilek" },
    // Fixed dates keep a re-rendered PDF byte-identical for the same snapshot.
    compress: true,
  });
}

/** The 2026 logo (vector paths, same data as the website) + optional right-hand block. */
function brandHeader(doc: PDFKit.PDFDocument, right?: string) {
  const scale = 0.3;
  const baseline = 56 + 70 * scale; // cap height 70 at size 100
  doc.save().translate(56, baseline).scale(scale);
  doc.path(logoData.word).fill(INK);
  doc.path(logoData.glint).fill(ACCENT);
  doc.translate(logoData.inline.x, 0).path(logoData.inline.by).fill(INK);
  doc.restore();
  let bottom = baseline + 12;
  if (right) {
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(right, 300, 52, { width: 239, align: "right" });
    bottom = Math.max(bottom, doc.y + 6);
  }
  doc.moveTo(56, bottom).lineTo(539, bottom).lineWidth(0.6).strokeColor(LINE).stroke();
  doc.y = bottom + 18;
  return bottom;
}

function footer(doc: PDFKit.PDFDocument, text: string) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(`${text}   ·   ${i + 1}/${range.count}`, 56, 800, { width: 483, align: "center" });
    doc.page.margins.bottom = bottom;
  }
}

// ───────────────────────────────────────────────────────── Invoice

export type InvoiceSnapshot = {
  number: string;
  kind: "invoice" | "credit";
  correctsNumber?: string | null;
  issueDate: string;
  supplyDate?: string | null;
  dueDate?: string | null;
  seller: InvoiceSettings;
  buyer: { name: string; email?: string | null; address?: string | null };
  lines: ComputedLine[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  vatRateBp: number;
  vatMode: InvoiceSettings["vatMode"];
  /** VAT per rate (multi-rate invoices). Absent on snapshots made before multi-rate support. */
  breakdown?: VatRow[];
  note?: string | null;
  paid?: { cents: number; date?: string | null; method?: string | null } | null;
};

const dateNl = (iso?: string | null) => (iso ? iso.split("-").reverse().join("-") : "—");

export async function renderInvoicePdf(inv: InvoiceSnapshot): Promise<Buffer> {
  const title = inv.kind === "credit" ? `Creditfactuur ${inv.number}` : `Factuur ${inv.number}`;
  const doc = newDoc(title);
  doc.info.CreationDate = new Date(`${inv.issueDate}T12:00:00Z`);
  doc.info.ModDate = doc.info.CreationDate;
  const s = inv.seller;
  const top = brandHeader(doc, [s.legalName, s.street, `${s.postcode} ${s.city}`.trim(), s.country !== "Nederland" ? s.country : "", s.email, s.phone].filter(Boolean).join("\n"));

  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(20).text(inv.kind === "credit" ? "Creditfactuur" : "Factuur", 56, top + 28);
  const metaTop = top + 64;
  const meta: [string, string][] = [
    [inv.kind === "credit" ? "Creditfactuurnummer" : "Factuurnummer", inv.number],
    ["Factuurdatum", dateNl(inv.issueDate)],
  ];
  if (inv.supplyDate) meta.push(["Datum behandeling", dateNl(inv.supplyDate)]);
  if (inv.dueDate && inv.kind === "invoice") meta.push(["Te betalen vóór", dateNl(inv.dueDate)]);
  if (inv.correctsNumber) meta.push(["Correctie op factuur", inv.correctsNumber]);
  meta.forEach(([k, v], i) => {
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(k, 56, metaTop + i * 15, { width: 130 });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(v, 186, metaTop + i * 15, { width: 140 });
  });
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text("Factuur aan", 340, metaTop, { width: 199 });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(inv.buyer.name, 340, metaTop + 15, { width: 199 });
  doc.font("Helvetica").fontSize(9).text([inv.buyer.address, inv.buyer.email].filter(Boolean).join("\n"), 340, doc.y + 2, { width: 199 });

  // Lines
  let y = Math.max(doc.y, metaTop + meta.length * 15) + 28;
  const cols = { desc: 56, qty: 330, unit: 380, vat: 450, total: 480 };
  doc.fillColor(MUTED).font("Helvetica").fontSize(8.5);
  doc.text("Omschrijving", cols.desc, y);
  doc.text("Aantal", cols.qty, y, { width: 40, align: "right" });
  doc.text("Prijs", cols.unit, y, { width: 60, align: "right" });
  if (inv.vatMode === "standard") doc.text("Btw", cols.vat - 20, y, { width: 40, align: "right" });
  doc.text("Bedrag", cols.total, y, { width: 59, align: "right" });
  y += 14;
  doc.moveTo(56, y).lineTo(539, y).lineWidth(0.6).strokeColor(LINE).stroke();
  y += 8;
  for (const l of inv.lines) {
    doc.fillColor(INK).font("Helvetica").fontSize(9.5);
    const h = doc.heightOfString(l.description, { width: 260 });
    if (y + h > 700) {
      doc.addPage();
      y = 72;
    }
    doc.text(l.description, cols.desc, y, { width: 260 });
    doc.text(String(l.quantity), cols.qty, y, { width: 40, align: "right" });
    doc.text(formatCents(l.unitCents), cols.unit, y, { width: 60, align: "right" });
    if (inv.vatMode === "standard") doc.text(l.vatLabel ?? formatRate(l.vatRateBp), cols.vat - 20, y, { width: 40, align: "right" });
    doc.text(formatCents(l.totalCents), cols.total, y, { width: 59, align: "right" });
    y += Math.max(h, 12) + 8;
  }
  doc.moveTo(56, y).lineTo(539, y).lineWidth(0.6).strokeColor(LINE).stroke();
  y += 12;

  const totals: [string, string, boolean][] =
    inv.vatMode === "standard"
      ? [
          ["Subtotaal excl. btw", formatCents(inv.subtotalCents), false],
          ...(inv.breakdown?.length
            ? inv.breakdown.map((r): [string, string, boolean] => [r.label === "Vrijgesteld" ? `Vrijgesteld van btw (grondslag ${formatCents(r.baseCents)})` : `${r.label} over ${formatCents(r.baseCents)}`, r.label === "Vrijgesteld" ? formatCents(0) : formatCents(r.vatCents), false])
            : [[`Btw ${formatRate(inv.vatRateBp)}`, formatCents(inv.vatCents), false] as [string, string, boolean]]),
          ["Totaal incl. btw", formatCents(inv.totalCents), true],
        ]
      : [["Totaal", formatCents(inv.totalCents), true]];
  for (const [k, v, strong] of totals) {
    doc.fillColor(strong ? INK : MUTED).font(strong ? "Helvetica-Bold" : "Helvetica").fontSize(strong ? 11 : 9.5);
    doc.text(k, 230, y, { width: 240, align: "right" });
    doc.text(v, 480, y, { width: 59, align: "right" });
    y += strong ? 18 : 15;
  }
  y += 10;
  doc.fillColor(INK).font("Helvetica").fontSize(9);
  const notes: string[] = [];
  if ((inv.vatMode === "exempt" || inv.vatMode === "kor") && s.exemptionText) notes.push(s.exemptionText);
  if (inv.paid && inv.paid.cents > 0) {
    const full = inv.paid.cents >= inv.totalCents;
    notes.push(`${full ? "Voldaan" : `Betaald: ${formatCents(inv.paid.cents)}`}${inv.paid.date ? ` op ${dateNl(inv.paid.date)}` : ""}${inv.paid.method ? ` (${inv.paid.method})` : ""}.`);
  } else if (inv.kind === "invoice" && s.iban) {
    notes.push(`Graag overmaken vóór ${dateNl(inv.dueDate)} op ${s.iban.replace(/(.{4})/g, "$1 ").trim()}${s.accountHolder ? ` t.n.v. ${s.accountHolder}` : ""}, onder vermelding van ${inv.number}.`);
  }
  if (inv.note) notes.push(inv.note);
  for (const n of notes) {
    doc.text(n, 56, y, { width: 483 });
    y = doc.y + 6;
  }
  const id = [s.kvk ? `KVK ${s.kvk}` : "", inv.vatMode === "standard" && s.vatNumber ? `Btw-id ${s.vatNumber}` : "", s.iban ? `IBAN ${s.iban}` : ""].filter(Boolean).join("   ·   ");
  footer(doc, [s.tradeName || s.legalName, id, s.footer].filter(Boolean).join("   ·   "));
  return toBuffer(doc);
}

// ───────────────────────────────────────────────────────── Reports

export type ReportBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "pairs"; rows: [string, string][] }
  | { type: "table"; columns: { label: string; width: number; align?: "left" | "right" }[]; rows: string[][]; total?: string[] };

/** Generic, branded A4 report (financial summaries, customer history, activity, price list). */
export async function renderReportPdf(title: string, subtitle: string, blocks: ReportBlock[]): Promise<Buffer> {
  const doc = newDoc(title);
  const top = brandHeader(doc, subtitle);
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(18).text(title, 56, top + 20, { width: 483 });
  doc.moveDown(0.6);
  const ensure = (h: number) => {
    if (doc.y + h > 740) doc.addPage();
  };
  for (const b of blocks) {
    if (b.type === "heading") {
      ensure(40);
      doc.moveDown(0.8).fillColor(INK).font("Helvetica-Bold").fontSize(11.5).text(b.text, 56, doc.y, { width: 483 });
      doc.moveDown(0.3);
    } else if (b.type === "text") {
      ensure(24);
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(b.text, 56, doc.y, { width: 483 });
      doc.moveDown(0.4);
    } else if (b.type === "pairs") {
      for (const [k, v] of b.rows) {
        ensure(16);
        const y = doc.y;
        doc.fillColor(MUTED).font("Helvetica").fontSize(9.5).text(k, 56, y, { width: 260 });
        doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5).text(v, 316, y, { width: 223, align: "right" });
        doc.y = Math.max(doc.y, y + 15);
      }
    } else {
      const total = b.columns.reduce((s, c) => s + c.width, 0);
      const xs: number[] = [];
      let x = 56;
      for (const c of b.columns) {
        xs.push(x);
        x += (c.width / total) * 483;
      }
      const widthOf = (i: number) => (b.columns[i].width / total) * 483 - 6;
      const row = (cells: string[], bold = false, color = INK) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
        const h = Math.max(...cells.map((c, i) => doc.heightOfString(c || " ", { width: widthOf(i) })), 11);
        ensure(h + 8);
        const y = doc.y;
        cells.forEach((c, i) => doc.fillColor(color).text(c, xs[i], y, { width: widthOf(i), align: b.columns[i].align ?? "left" }));
        doc.y = y + h + 5;
      };
      ensure(30);
      row(b.columns.map((c) => c.label), false, MUTED);
      doc.moveTo(56, doc.y - 2).lineTo(539, doc.y - 2).lineWidth(0.5).strokeColor(LINE).stroke();
      doc.y += 3;
      if (!b.rows.length) row(["Geen gegevens in deze periode."], false, MUTED);
      for (const r of b.rows) row(r);
      if (b.total) {
        doc.moveTo(56, doc.y).lineTo(539, doc.y).lineWidth(0.5).strokeColor(LINE).stroke();
        doc.y += 4;
        row(b.total, true);
      }
    }
  }
  footer(doc, `Glow by Dilek   ·   ${title}   ·   vertrouwelijk`);
  return toBuffer(doc);
}
