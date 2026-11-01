/**
 * Intake & consent master form (pure: no database, no I/O).
 *
 * The form is kept as a small line-based text so Dilek can make a revision
 * without a designer, and so the A4 print view and the PDF render the
 * exact same wording. Each line starts with a marker:
 *
 *   = Title                    form title (first line)
 *   # Heading                  section heading
 *   > Text                     explanatory paragraph
 *   ! Text                     highlighted note
 *   - Label                    short field with a writing line (two per row)
 *   [] Option                  tick box, shown on one row with its neighbours;
 *                              ending in ":" adds a short writing line
 *   ?? Group                   title above a group of questions
 *   ? Question                 question with the answer columns below
 *   _ Label                    full-width writing line
 *   * Statement                tick box with a full sentence (one per row)
 *   ~ Label | Label            signature row: each part gets a writing line
 *   ---                        page break (A4)
 *   @answers Yes | No | Not sure   answer column headings
 *
 * `{version}` is replaced by the template version wherever it appears.
 * Supplied as draft wording by the owner (GBD-INTAKE-2026-11-v1); it is
 * not legally approved — see docs/INTAKE.md.
 */

export type IntakeBlock =
  | { type: "title"; text: string }
  | { type: "heading"; text: string }
  | { type: "intro"; text: string }
  | { type: "note"; text: string }
  | { type: "fields"; labels: string[] }
  | { type: "options"; items: { label: string; line: boolean }[] }
  | { type: "questions"; title: string | null; items: string[] }
  | { type: "line"; label: string }
  | { type: "statements"; items: string[] }
  | { type: "signature"; parts: string[] }
  | { type: "pagebreak" };

export type ParsedIntake = { title: string; answers: string[]; blocks: IntakeBlock[] };

export const VERSION_PATTERN = /^GBD-INTAKE-\d{4}-\d{2}-v\d{1,3}$/;
const MAX_SOURCE = 20_000;

export function parseIntake(source: string, version: string, fallbackAnswers: string[] = ["Ja", "Nee", "Weet niet"]): ParsedIntake {
  const blocks: IntakeBlock[] = [];
  let title = "";
  let answers = fallbackAnswers;
  const last = () => blocks[blocks.length - 1];
  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim().replaceAll("{version}", version);
    if (!line) continue;
    if (line === "---") {
      blocks.push({ type: "pagebreak" });
      continue;
    }
    const m = /^(=|##?|>|!|-|\[\]|\?\?|\?|_|\*|~|@answers)\s*(.*)$/.exec(line);
    if (!m) {
      // Plain text without a marker is a paragraph.
      blocks.push({ type: "intro", text: line });
      continue;
    }
    const [, mark, rest] = m;
    const text = rest.trim();
    switch (mark) {
      case "=":
        title = text;
        blocks.push({ type: "title", text });
        break;
      case "#":
      case "##":
        blocks.push({ type: "heading", text });
        break;
      case ">":
        blocks.push({ type: "intro", text });
        break;
      case "!":
        blocks.push({ type: "note", text });
        break;
      case "-": {
        const b = last();
        if (b?.type === "fields") b.labels.push(text);
        else blocks.push({ type: "fields", labels: [text] });
        break;
      }
      case "[]": {
        const item = { label: text.replace(/:\s*$/, ""), line: /:\s*$/.test(text) };
        const b = last();
        if (b?.type === "options") b.items.push(item);
        else blocks.push({ type: "options", items: [item] });
        break;
      }
      case "??":
        blocks.push({ type: "questions", title: text, items: [] });
        break;
      case "?": {
        const b = last();
        if (b?.type === "questions") b.items.push(text);
        else blocks.push({ type: "questions", title: null, items: [text] });
        break;
      }
      case "_":
        blocks.push({ type: "line", label: text });
        break;
      case "*": {
        const b = last();
        if (b?.type === "statements") b.items.push(text);
        else blocks.push({ type: "statements", items: [text] });
        break;
      }
      case "~":
        blocks.push({ type: "signature", parts: text.split("|").map((s) => s.trim()).filter(Boolean) });
        break;
      case "@answers": {
        const a = text.split("|").map((s) => s.trim()).filter(Boolean);
        if (a.length >= 2 && a.length <= 4) answers = a;
        break;
      }
    }
  }
  return { title, answers, blocks };
}

export type TemplateCheck = { ok: true } | { ok: false; error: string };

/** Checks an owner revision before it is saved. */
export function checkIntakeSource(source: string, version: string): TemplateCheck {
  if (!VERSION_PATTERN.test(version)) return { ok: false, error: "Versie moet de vorm GBD-INTAKE-JJJJ-MM-vN hebben." };
  if (source.length > MAX_SOURCE) return { ok: false, error: "Het formulier is te lang." };
  const p = parseIntake(source, version);
  if (!p.title) return { ok: false, error: "De eerste regel moet de titel zijn (begint met =)." };
  if (!p.blocks.some((b) => b.type === "signature")) return { ok: false, error: "Er ontbreekt een handtekeningregel (begint met ~)." };
  if (!p.blocks.some((b) => b.type === "statements")) return { ok: false, error: "Er ontbreken de toestemmingsvakjes (beginnen met *)." };
  if (!source.includes("{version}")) return { ok: false, error: "Zet {version} op het formulier, zodat elke afdruk de versie toont." };
  if (/<\s*script|javascript:/i.test(source)) return { ok: false, error: "Het formulier bevat ongeldige tekst." };
  return { ok: true };
}

/** Next version for a new revision: same month → v+1, new month → v1. */
export function nextVersion(current: string, now: Date = new Date()): string {
  const ym = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit" }).format(now);
  const [y, m] = ym.split("-");
  const cur = /^GBD-INTAKE-(\d{4})-(\d{2})-v(\d+)$/.exec(current);
  if (cur && cur[1] === y && cur[2] === m) return `GBD-INTAKE-${y}-${m}-v${Number(cur[3]) + 1}`;
  return `GBD-INTAKE-${y}-${m}-v1`;
}

export const INITIAL_VERSION = "GBD-INTAKE-2026-11-v1";

/** The supplied v1 forms (owner's draft wording, November 2026). */
export const BUILTIN_INTAKE: Record<"nl" | "en", string> = {
  nl: `= Intake en toestemmingsformulier
> Voor beautybehandelingen en ontspannende massages bij Glow by Dilek. Eén formulier voor alle behandelingen; aanvullende vragen zijn alleen van toepassing op de gekozen behandeling.
@answers Ja | Nee | Weet niet
# 1  Persoonlijke en afspraakgegevens
- Naam
- Klantnummer (studio)
- E-mail
- Telefoon
- Datum ingevuld
- Datum afspraak
> Gekozen behandeling(en), meerdere mogelijk:
[] Massage
[] Waxbehandeling
[] Gezichtsbehandeling
[] Lichaamsverzorging
[] Arrangement
[] Anders:
# 2  Algemene veiligheidsvragen
> Kruis per vraag één antwoord aan. Bespreek alleen de informatie die nodig is voor deze behandeling. Noem geen uitgebreide diagnose of medicatielijst op dit formulier.
? Heb je een bekende allergie of gevoeligheid voor cosmetica, wax, olie, geurstoffen of latex?
? Zijn er wondjes, huidinfecties, ernstige irritatie of zonnebrand op de te behandelen plek?
? Gebruik je producten of middelen die de huid kwetsbaarder maken (bijv. retinoïden of peelings)?
? Heb je kortgeleden een laserbehandeling, peeling of andere intensieve huidbehandeling gehad?
? Zijn er omstandigheden waardoor je snel blauwe plekken krijgt of je huid minder goed herstelt?
? Heb je recent letsel, een operatie of een andere beperking die bij aanraking relevant kan zijn?
_ Toelichting alleen indien nodig voor veilige uitvoering (optioneel)
! Let op: Dit formulier vervangt geen medisch advies. Bij twijfel bespreken we vooraf of de behandeling passend is; zo nodig wordt deze aangepast of uitgesteld.
---
# 3  Alleen voor de gekozen behandeling
> De onderstaande vragen zijn alleen relevant wanneer die behandeling is geselecteerd. Overige antwoorden mogen leeg blijven.
?? Waxbehandeling
? Is de huid in het te waxen gebied zeer gevoelig of beschadigd?
? Heb je recent een andere ontharingsbehandeling gehad die de huid kan beïnvloeden?
?? Massage
? Zijn er pijnlijke, gekwetste of gevoelige plekken die we moeten vermijden?
? Is er een omstandigheid zoals zwangerschap waarvoor de massage aangepast moet worden?
?? Gezichts- of lichaamsverzorging
? Reageert jouw huid vaak gevoelig op nieuwe verzorgingsproducten?
? Zijn er recent actieve huidklachten of behandelingen op de betreffende plek geweest?
# 4  Wensen en aandachtspunten
_ Te vermijden zones / voorkeuren
_ Aanvullende opmerking (optioneel)
# 5  Privacy en uitdrukkelijke toestemming
> Glow by Dilek gebruikt deze antwoorden uitsluitend voor voorzorg bij jouw gekozen beauty- of ontspanningsbehandeling. Gezondheidsinformatie wordt alleen met een geldige grondslag en waar nodig uitdrukkelijke toestemming afgeschermd bewaard. Je kunt toestemming intrekken. Bewaartermijn en rechten: glowbydilek.nl/privacy.
* Ik geef uitdrukkelijk toestemming om mijn relevante veiligheidsantwoorden en dit ondertekende formulier veilig te bewaren voor dit doel.
* Ik geef géén toestemming voor opslag van gezondheidsantwoorden. Bespreek de veiligheid mondeling en bewaar dit ingevulde gezondheidsdeel niet.
* Ik heb de behandeling kunnen bespreken, mag vragen stellen en kan aangeven als ik wil stoppen.
~ Handtekening klant | Datum
# 6  Alleen door Glow by Dilek in te vullen
_ Behandeling/voorzorg besproken
~ Naam behandelaar | Datum | Versie: {version}`,
  en: `= Client intake and consent form
> For beauty treatments and relaxing massages at Glow by Dilek. One master form for all treatments; additional questions apply only to the selected treatment.
@answers Yes | No | Not sure
# 1  Client and appointment details
- Name
- Client ID (studio)
- Email
- Phone
- Date completed
- Appointment date
> Selected treatment(s), tick all that apply:
[] Massage
[] Waxing
[] Facial care
[] Body care
[] Package
[] Other:
# 2  General safety questions
> Tick one answer for each question. Share only what is relevant to this treatment. Do not list detailed diagnoses or medications on this form.
? Do you have any known allergy or sensitivity to cosmetics, wax, oils, fragrances or latex?
? Do you have cuts, a skin infection, severe irritation or sunburn in the area to be treated?
? Do you use products that may make your skin more sensitive (such as retinoids or peels)?
? Have you recently had laser treatment, a peel or another intensive skin treatment?
? Is there anything that causes easy bruising or slower skin recovery?
? Have you had a recent injury, surgery or limitation relevant to touch or massage?
_ Additional information only if needed for safe treatment (optional)
! Please note: This form does not replace medical advice. If in doubt, we will discuss whether the treatment is suitable and may adapt or postpone it.
---
# 3  Only for your selected treatment
> Answer the questions below only for treatments you selected. Leave other sections blank.
?? Waxing
? Is the skin in the waxing area particularly sensitive or damaged?
? Have you recently had another hair removal treatment that could affect your skin?
?? Massage
? Are there any painful, injured or sensitive areas we should avoid?
? Are there circumstances, such as pregnancy, requiring an adapted massage?
?? Facial or body care
? Does your skin often react to new skincare products?
? Have you had a recent skin issue or treatment in the relevant area?
# 4  Preferences and considerations
_ Areas to avoid / preferences
_ Additional notes (optional)
# 5  Privacy and explicit consent
> Glow by Dilek uses these answers only for safety considerations related to the selected beauty or relaxation treatment. Health information is stored securely only on a valid legal basis and, where required, with explicit consent. Consent may be withdrawn. Retention and rights: glowbydilek.nl/privacy.
* I explicitly consent to secure storage of my relevant safety answers and this signed form for this purpose.
* I do NOT consent to storing health-related answers. Discuss safety verbally and do not retain this completed health section.
* I have had an opportunity to discuss the treatment, ask questions and request that it stop.
~ Client signature | Date
# 6  For the practitioner only
_ Treatment/safety discussed
~ Practitioner name | Date | Version: {version}`,
};
