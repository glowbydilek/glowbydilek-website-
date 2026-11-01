import "server-only";
import PDFDocument from "pdfkit";
import { logoData } from "../../components/brand/logoData";
import { parseIntake, type IntakeBlock } from "./template";

/**
 * A4 PDF of the intake & consent master form (blank, to print and sign).
 * pdfkit with the built-in Helvetica family: no font files, no native
 * modules, works on Hostinger Node.js.
 */

const INK = "#2B202B";
const MUTED = "#6B5867";
const LINE = "#BFA9B1";
const ACCENT = "#8E4759";
const LEFT = 56;
const WIDTH = 483;
const BOTTOM = 792;

export async function intakePdf(source: string, version: string, locale: "nl" | "en"): Promise<Buffer> {
  const parsed = parseIntake(source, version, locale === "nl" ? ["Ja", "Nee", "Weet niet"] : ["Yes", "No", "Not sure"]);
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: 56, bottom: 56, left: LEFT, right: 56 },
    info: { Title: `${parsed.title} (${version})`, Author: "Glow by Dilek", Creator: "Glow by Dilek", Producer: "Glow by Dilek" },
    compress: true,
  });
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
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(version, LEFT, 60, { width: WIDTH, align: "right" });
    y = 96;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      header();
    }
  };
  const text = (s: string, opts: { size?: number; font?: string; color?: string; gap?: number; width?: number; x?: number } = {}) => {
    doc.font(opts.font ?? "Helvetica").fontSize(opts.size ?? 9.5).fillColor(opts.color ?? INK);
    const w = opts.width ?? WIDTH;
    const h = doc.heightOfString(s, { width: w, lineGap: 1.5 });
    ensure(h + (opts.gap ?? 4));
    doc.text(s, opts.x ?? LEFT, y, { width: w, lineGap: 1.5 });
    y += h + (opts.gap ?? 4);
  };
  const writeLine = (x: number, w: number, at: number) => {
    doc.moveTo(x, at).lineTo(x + w, at).lineWidth(0.6).strokeColor(LINE).stroke();
  };
  const box = (x: number, top: number) => {
    doc.rect(x, top, 9, 9).lineWidth(0.8).strokeColor(INK).stroke();
  };

  const draw = (b: IntakeBlock) => {
    switch (b.type) {
      case "title":
        text(b.text, { size: 18, font: "Helvetica-Bold", color: INK, gap: 6 });
        break;
      case "heading":
        y += 6;
        ensure(40);
        text(b.text, { size: 11.5, font: "Helvetica-Bold", color: ACCENT, gap: 2 });
        writeLine(LEFT, WIDTH, y);
        y += 6;
        break;
      case "intro":
        text(b.text, { size: 9, color: MUTED, gap: 6 });
        break;
      case "note": {
        doc.font("Helvetica-Oblique").fontSize(8.8);
        const h = doc.heightOfString(b.text, { width: WIDTH - 16, lineGap: 1.5 });
        ensure(h + 16);
        doc.rect(LEFT, y, WIDTH, h + 10).fill("#F5E6E7");
        doc.fillColor(INK).text(b.text, LEFT + 8, y + 5, { width: WIDTH - 16, lineGap: 1.5 });
        y += h + 16;
        break;
      }
      case "fields": {
        const col = (WIDTH - 24) / 2;
        for (let i = 0; i < b.labels.length; i += 2) {
          ensure(26);
          for (let j = 0; j < 2 && i + j < b.labels.length; j++) {
            const x = LEFT + j * (col + 24);
            doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(b.labels[i + j], x, y, { width: col });
            writeLine(x, col, y + 22);
          }
          y += 30;
        }
        break;
      }
      case "options": {
        ensure(20);
        let x = LEFT;
        doc.font("Helvetica").fontSize(9).fillColor(INK);
        for (const it of b.items) {
          const w = doc.widthOfString(it.label) + 18 + (it.line ? 90 : 0);
          if (x + w > LEFT + WIDTH) {
            x = LEFT;
            y += 18;
            ensure(18);
          }
          box(x, y);
          doc.fillColor(INK).text(it.label, x + 14, y, { lineBreak: false });
          if (it.line) writeLine(x + 16 + doc.widthOfString(it.label) + 4, 80, y + 9);
          x += w + 12;
        }
        y += 22;
        break;
      }
      case "questions": {
        const colW = 46;
        const qW = WIDTH - colW * parsed.answers.length;
        if (b.title) {
          ensure(40);
          text(b.title, { size: 9.5, font: "Helvetica-Bold", gap: 3 });
        }
        ensure(18);
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED);
        parsed.answers.forEach((a, i) => doc.text(a, LEFT + qW + i * colW, y, { width: colW, align: "center" }));
        y += 12;
        for (const q of b.items) {
          doc.font("Helvetica").fontSize(9);
          const h = Math.max(14, doc.heightOfString(q, { width: qW - 10, lineGap: 1 }));
          ensure(h + 8);
          doc.fillColor(INK).text(q, LEFT, y, { width: qW - 10, lineGap: 1 });
          parsed.answers.forEach((_, i) => box(LEFT + qW + i * colW + colW / 2 - 4.5, y + 1));
          y += h + 4;
          writeLine(LEFT, WIDTH, y);
          y += 4;
        }
        y += 4;
        break;
      }
      case "line":
        ensure(30);
        doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(b.label, LEFT, y, { width: WIDTH });
        writeLine(LEFT, WIDTH, y + 22);
        y += 28;
        break;
      case "statements":
        for (const s of b.items) {
          doc.font("Helvetica").fontSize(9);
          const h = doc.heightOfString(s, { width: WIDTH - 18, lineGap: 1.5 });
          ensure(h + 8);
          box(LEFT, y + 1);
          doc.fillColor(INK).text(s, LEFT + 18, y, { width: WIDTH - 18, lineGap: 1.5 });
          y += h + 8;
        }
        break;
      case "signature": {
        ensure(40);
        const n = b.parts.length;
        const widths = n === 2 ? [WIDTH * 0.62, WIDTH * 0.38 - 20] : b.parts.map(() => (WIDTH - 20 * (n - 1)) / n);
        let x = LEFT;
        b.parts.forEach((p, i) => {
          doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(p, x, y, { width: widths[i] });
          writeLine(x, widths[i], y + 28);
          x += widths[i] + 20;
        });
        y += 36;
        break;
      }
      case "pagebreak":
        doc.addPage();
        header();
        break;
    }
  };

  header();
  for (const b of parsed.blocks) draw(b);

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // the footer sits below the text area
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(`Glow by Dilek  ·  ${version}  ·  ${i + 1}/${range.count}`, LEFT, 800, { width: WIDTH, align: "center", lineBreak: false });
  }
  doc.end();
  return done;
}
