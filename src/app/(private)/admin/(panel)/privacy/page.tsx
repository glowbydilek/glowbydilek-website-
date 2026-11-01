import { ConsultationSettingsForm } from "@/components/private/cms/ConsultationSettingsForm";
import { Card, Notice, PageHeader } from "@/components/private/ui";
import { requireOwner } from "@/lib/auth/session";
import { consultationEnabled, QUESTIONS } from "@/lib/consultation/service";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Privacy & consultatie" };

export default async function PrivacySettings() {
  const s = await requireOwner("admin");
  const st = await consultationEnabled(getDb());
  return (
    <>
      <PageHeader title="Privacy & consultatie" subtitle="Het consultatieformulier legt gezondheidsinformatie vast. Dat mag alleen onder strikte voorwaarden; daarom staat het standaard uit." />
      <div className="mb-5 space-y-2">
        {st.enabled && s.user.mfaEnabled ? (
          <Notice tone="success">✓ Het consultatieformulier is beschikbaar in elk klantprofiel.</Notice>
        ) : (
          <Notice tone="warning">
            Het consultatieformulier staat uit. {st.reasons.join(" ")} {!s.user.mfaEnabled && "Tweestapsverificatie staat nog niet aan (Admin → Beveiliging)."}
          </Notice>
        )}
      </div>
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Afweging (AVG)">
          <div className="space-y-3 text-sm leading-relaxed text-charcoal-soft">
            <p><strong>Doel.</strong> Alleen om een waxbehandeling veilig uit te voeren: weten of er een reden is om niet, of anders, te waxen. Niet voor marketing, statistiek of iets anders.</p>
            <p><strong>Welke gegevens.</strong> Uitsluitend deze {QUESTIONS.length} vragen (ja/nee met korte toelichting) en de afgesproken voorzorg. Geen volledige medische geschiedenis, geen diagnoses, geen medicijnlijsten.</p>
            <p><strong>Grondslag.</strong> Het uitvoeren van de afspraak (art. 6 lid 1 sub b AVG). Omdat het gezondheidsgegevens zijn (bijzondere persoonsgegevens, art. 9), is daarnaast een uitzondering nodig. Voor een schoonheidsspecialist die geen zorgverlener is, is dat in de praktijk de <strong>uitdrukkelijke toestemming</strong> van de klant (art. 9 lid 2 sub a). Die toestemming moet vrij gegeven zijn, kan altijd worden ingetrokken en wordt per klant vastgelegd.</p>
            <p><strong>DPIA.</strong> Een gegevensbeschermingseffectbeoordeling is verplicht bij grootschalige verwerking van gezondheidsgegevens. Een eenmanspraktijk met een beperkt formulier is volgens de AVG-overwegingen (o.a. overweging 91) doorgaans niet grootschalig. Dit is een inschatting, geen juridisch advies: laat dit bij twijfel controleren.</p>
            <p><strong>Beveiliging.</strong> Versleuteld opgeslagen met een eigen sleutel (CONSULTATION_KEY), alleen toegankelijk met tweestapsverificatie, elke inzage en wijziging gelogd, versleuteld verstuurd (HTTPS), niet in exports, e-mails, facturen, rapporten of Analytics.</p>
            <p><strong>Bewaren.</strong> Tot de ingestelde termijn na de laatste controle; daarna automatisch verwijderd. Bij intrekken van toestemming of anonimiseren van de klant direct verwijderd.</p>
            <p><strong>Nog te doen buiten dit systeem.</strong> Neem deze verwerking op in je verwerkingsregister en vermeld haar in de privacyverklaring op de website. Laat bij twijfel een privacyjurist meekijken.</p>
          </div>
        </Card>
        <div className="space-y-5">
          <Card title="Bevestigen">
            <ConsultationSettingsForm s={st.settings} />
          </Card>
          <Card title="Sleutel instellen (eenmalig)">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Maak op je eigen computer een sleutel: <code className="break-all">openssl rand -base64 32</code></li>
              <li>Zet hem in Hostinger → Environment variables als <code>CONSULTATION_KEY</code> en bouw de site opnieuw.</li>
              <li>Bewaar een kopie veilig (bijv. in een wachtwoordmanager). Zonder deze sleutel zijn de antwoorden niet meer te lezen.</li>
            </ol>
            <p className="mt-3 text-xs text-muted">Plak de sleutel nooit in een chat, e-mail of GitHub.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
