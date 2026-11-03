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

/** Answer column headings per language. */
export const ANSWERS: Record<"nl" | "en" | "tr", string[]> = { nl: ["Ja", "Nee", "Weet niet"], en: ["Yes", "No", "Not sure"], tr: ["Evet", "Hayır", "Emin değilim"] };

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

/** Version 1 (November 2026 handover): kept so existing signed copies stay traceable. */
export const LEGACY_VERSION = "GBD-INTAKE-2026-11-v1";
export const LEGACY_INTAKE_V1: Record<"nl" | "en", string> = {
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


/**
 * Version 2: the master consultation & intake form from the v13 package,
 * in Dutch, English and Turkish. One form for every treatment, with
 * conditional modules (waxing, facial/steam, massage) that only apply to the
 * booked treatment. A beauty consultation, not a medical assessment; owner
 * and privacy review required before use.
 */
export const INITIAL_VERSION = "GBD-INTAKE-2026-11-v2";

export const BUILTIN_INTAKE: Record<"nl" | "en" | "tr", string> = {
  nl: `= Persoonlijk intake- en adviesformulier
> We stellen enkele vragen om je wensen te begrijpen en de behandeling zorgvuldig af te stemmen. Dit formulier is geen medische beoordeling.
@answers Ja | Nee | Bespreek ik liever persoonlijk
# 1  Gegevens en afspraak
- Voor- en achternaam
- E-mailadres / Telefoonnummer
- Datum van de afspraak
- Klantnummer (alleen intern)
- Formulierversie en documentnummer: {version} / ________
> Gewenste behandeling(en):
[] Massage
[] Waxbehandeling
[] Gezichtsbehandeling (met stoom)
[] Anders:
_ Zijn er wensen of aandachtspunten die je wilt bespreken?
# 2  Een kort gesprek over veiligheid en comfort
> Beantwoord alleen wat relevant is voor je behandeling. Je kunt altijd kiezen om iets liever persoonlijk te bespreken.
? Heb je huidgevoeligheden of allergieën die voor deze behandeling relevant kunnen zijn?
? Zijn er huidplekjes, wondjes, irritaties of andere plekken die we beter kunnen vermijden?
? Is er een behandeling, medicijn of gezondheidsomstandigheid waarvan jij denkt dat wij er rekening mee moeten houden?
? Ben je zwanger of geef je borstvoeding, voor zover relevant voor de gekozen behandeling?
_ Welke gebieden mogen wel of liever niet worden behandeld?
_ Heb je voorkeuren voor druk, tempo, temperatuur, privacy of communicatie?
_ Toelichting (optioneel)
---
# 3  Alleen bij de gekozen behandeling
> Vul alleen het onderdeel in dat bij jouw behandeling hoort; de rest mag leeg blijven.
?? Waxbehandeling
? Gebruik je op de te behandelen huid momenteel producten of behandelingen die de huid gevoeliger kunnen maken, zoals bepaalde exfoliërende middelen of retinoïden?
? Heeft de huid op de te behandelen plek onlangs een andere behandeling gehad, of is er irritatie waar we rekening mee moeten houden?
?? Gezichtsbehandeling / stoom
? Is je gezichtshuid op dit moment extra gevoelig, geïrriteerd of recent behandeld?
? Zijn er producten, ingrediënten of temperatuurverschillen waar je gevoelig op reageert?
> Dilek bespreekt vooraf of stoom voor jouw verzorging geschikt is.
?? Massage
? Zijn er pijnlijke, gevoelige of geblesseerde gebieden die niet gemasseerd mogen worden?
? Zijn er omstandigheden waardoor je liever eerst overlegt of de massage passend is?
> Je kunt tijdens de behandeling altijd aangeven of je meer of minder druk wilt, wilt pauzeren of wilt stoppen.
# 4  Verklaring, privacy en bewaren
> Ik heb mijn wensen en relevante aandachtspunten zo goed mogelijk gedeeld. Ik begrijp dat ik tijdens de behandeling vragen kan stellen of kan aangeven dat ik wil stoppen. Dilek kan de behandeling uitstellen of aanpassen als dat zorgvuldiger is. Ik heb informatie ontvangen over hoe mijn persoonsgegevens en eventuele intakegegevens worden verwerkt en bewaard, en waar ik privacyvragen kan stellen (glowbydilek.nl/privacy). Deze intake is geen medische beoordeling.
* Ik bevestig de verklaring hierboven.
* Ik geef toestemming om dit ondertekende formulier veilig bij mijn klantgegevens te bewaren. (Zonder dit vakje wordt het formulier niet bewaard; de veiligheid wordt dan mondeling besproken.)
* Ik wil af en toe nieuws of aanbiedingen ontvangen. (optioneel, geen voorwaarde voor de afspraak)
~ Naam | Datum | Handtekening / digitale bevestiging
# 5  Alleen door Glow by Dilek in te vullen
_ Besproken voorzorg of aanpassing
~ Naam behandelaar | Datum | Versie: {version}`,
  en: `= Personal consultation and intake form
> We ask a few questions to understand your preferences and tailor the session with care. This form is not a medical assessment.
@answers Yes | No | Prefer to discuss privately
# 1  Details and appointment
- First and last name
- Email address / Phone number
- Appointment date
- Customer ID (internal only)
- Form version and document number: {version} / ________
> Requested treatment(s):
[] Massage
[] Waxing
[] Facial treatment (with steam)
[] Other:
_ Do you have preferences or anything you would like to discuss?
# 2  A short safety and comfort conversation
> Answer only what is relevant to your treatment. You can always choose to discuss something privately instead.
? Do you have any skin sensitivities or allergies relevant to this treatment?
? Are there any cuts, irritation or other areas we should avoid?
? Is there a treatment, medication or health consideration you feel we should take into account?
? Are you pregnant or breastfeeding, if relevant to the chosen treatment?
_ Which areas may be treated, and which would you prefer to avoid?
_ Do you have preferences for pressure, pace, temperature, privacy or communication?
_ Details (optional)
---
# 3  Only for the chosen treatment
> Fill in only the part that belongs to your treatment; the rest may stay blank.
?? Waxing
? Are you currently using skincare products or treatments on the area that may increase skin sensitivity, such as certain exfoliants or retinoids?
? Has the area recently received another treatment, or is there irritation we should consider?
?? Facial treatment / steam
? Is your facial skin currently especially sensitive, irritated or recently treated?
? Are there products, ingredients or temperature changes to which you are sensitive?
> Dilek will discuss whether steam is suitable for your facial session before use.
?? Massage
? Are there painful, sensitive or injured areas that should not be massaged?
? Is there anything that makes you want to discuss whether massage is appropriate first?
> You can ask for a change in pressure, a break or an end to the session at any time.
# 4  Acknowledgment, privacy and record-keeping
> I have shared my preferences and relevant considerations as accurately as I can. I understand that I may ask questions or ask to stop the session at any time. Dilek may postpone or adjust a treatment when appropriate for safe, careful service. I have received information on how my personal and any intake details are processed and retained, and where to ask privacy questions (glowbydilek.nl/privacy). This intake is not a medical assessment.
* I confirm the acknowledgment above.
* I consent to this signed form being stored securely with my customer record. (Without this box the form is not kept; safety is then discussed verbally.)
* I would like occasional news or offers. (optional, not a condition for the appointment)
~ Name | Date | Signature / electronic acknowledgment
# 5  For Glow by Dilek only
_ Precautions or adjustments discussed
~ Practitioner name | Date | Version: {version}`,
  tr: `= Kişisel ön görüşme ve bakım formu
> Tercihlerini anlamak ve bakımı özenle planlamak için birkaç soru soruyoruz. Bu form tıbbi değerlendirme değildir.
@answers Evet | Hayır | Yüz yüze konuşmayı tercih ederim
# 1  Bilgiler ve randevu
- Ad ve soyad
- E-posta / Telefon numarası
- Randevu tarihi
- Müşteri numarası (yalnızca kurum içi)
- Form sürümü ve belge numarası: {version} / ________
> İstenen bakım(lar):
[] Masaj
[] Ağda
[] Yüz bakımı (buharlı)
[] Diğer:
_ Paylaşmak istediğin tercihler veya önemli noktalar var mı?
# 2  Güvenlik ve rahatlık üzerine kısa bir görüşme
> Yalnızca bakımınla ilgili olanları yanıtla. Bir konuyu yüz yüze konuşmayı her zaman tercih edebilirsin.
? Bu bakımla ilgili olabilecek cilt hassasiyetlerin veya alerjilerin var mı?
? Kaçınmamız gereken yara, tahriş veya başka hassas bölgelerin var mı?
? Dikkate almamızı istediğin bir tedavi, ilaç veya sağlık durumun var mı?
? Seçtiğin bakımla ilgiliyse hamile misin veya emziriyor musun?
_ Hangi bölgelere işlem yapılabilir, hangilerinden kaçınılmasını istersin?
_ Baskı, tempo, sıcaklık, mahremiyet veya iletişim konusunda tercihin var mı?
_ Açıklama (isteğe bağlı)
---
# 3  Yalnızca seçilen bakım için
> Yalnızca bakımına ait bölümü doldur; diğerleri boş kalabilir.
?? Ağda
? İşlem yapılacak bölgede cildi hassaslaştırabilecek peeling ürünleri veya retinoid gibi ürün/uygulamalar kullanıyor musun?
? İşlem yapılacak bölgeye yakın zamanda başka bir uygulama yapıldı mı veya dikkat edilmesi gereken tahriş var mı?
?? Yüz bakımı / buhar
? Yüz cildin şu anda çok hassas, tahriş olmuş veya yakın zamanda işlem görmüş durumda mı?
? Hassasiyet gösterdiğin ürünler, içerikler veya sıcaklık değişimleri var mı?
> Dilek, buharın yüz bakımına uygun olup olmadığını önceden seninle değerlendirir.
?? Masaj
? Masaj yapılmaması gereken ağrılı, hassas veya yaralı bölgelerin var mı?
? Masajın uygunluğunu önce konuşmak istediğin herhangi bir durum var mı?
> Uygulama sırasında baskının değişmesini, ara verilmesini veya işlemin durdurulmasını istediğin zaman söyleyebilirsin.
# 4  Beyan, gizlilik ve saklama
> Tercihlerimi ve bakımla ilgili önemli gördüğüm bilgileri mümkün olduğunca doğru paylaştım. Uygulama sırasında soru sorabileceğimi veya işlemin durdurulmasını isteyebileceğimi biliyorum. Dilek, özenli ve güvenli hizmet için gerekli gördüğünde bakımı erteleyebilir veya değiştirebilir. Kişisel bilgilerimin ve varsa ön görüşme bilgilerimin nasıl işlendiği ve saklandığı ile gizlilik konusunda nereye başvurabileceğim hakkında bilgilendirildim (glowbydilek.nl/privacy). Bu form tıbbi değerlendirme değildir.
* Yukarıdaki beyanı onaylıyorum.
* İmzalı bu formun müşteri kaydımla birlikte güvenli şekilde saklanmasına onay veriyorum. (Bu kutu işaretlenmezse form saklanmaz; güvenlik konuları sözlü olarak konuşulur.)
* Ara sıra haber veya kampanya bilgisi almak istiyorum. (isteğe bağlı, randevu için koşul değildir)
~ Ad soyad | Tarih | İmza / dijital onay
# 5  Yalnızca Glow by Dilek tarafından doldurulur
_ Konuşulan önlem veya uyarlama
~ Uygulayıcının adı | Tarih | Sürüm: {version}`,
};
