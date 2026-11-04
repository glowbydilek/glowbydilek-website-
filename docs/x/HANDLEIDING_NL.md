# Handleiding voor Dilek

Je beheert alles via twee beveiligde adressen:

- **glowbydilek.nl/agenda**: afspraken, klanten, werktijden, facturen.
- **glowbydilek.nl/admin**: de website (teksten, behandelingen, prijzen, foto's).

Log in met je e-mailadres en wachtwoord. Zet bij **Beveiliging** tweestapsverificatie aan; dat duurt 2 minuten en beschermt je klantgegevens.

---

## Prijs van een behandeling wijzigen

1. Ga naar **Admin → Behandelingen & prijzen**.
2. Klik op de behandeling.
3. Vul de nieuwe prijs in. Kies **Vaste prijs**, **Vanaf €…** of **Op aanvraag**.
4. Klik **Opslaan**.

De prijs staat meteen goed op de prijzenpagina en in het afspraakformulier. Facturen die je al hebt gemaakt houden hun oude bedrag.

## Een nieuwe behandeling toevoegen

1. **Admin → Behandelingen & prijzen → Nieuwe behandeling**.
2. Vul in:
   - naam (Nederlands en Engels)
   - categorie
   - duur
   - prijs
   - korte beschrijving
3. Kies of klanten hem online kunnen boeken.
4. Vink aan dat je de behandeling echt aanbiedt en dat de tekst klopt.
5. Klik **Publiceren**.

De behandeling verschijnt dan vanzelf:

- in de lijst met behandelingen;
- op de prijzenpagina;
- in het afspraakformulier;
- in de sitemap voor Google.

Je hoeft niets in GitHub te doen. Wil je de behandeling tijdelijk niet tonen? Klik **Offline halen**.

## Werktijden aanpassen

1. **Agenda → Werktijden**.
2. Zet per dag **Open** aan of uit.
3. Vul de tijden in. Gebruik **＋ tijdvak** voor een tweede blok en **＋ pauze** voor een pauze.
4. Klik **Werktijden opslaan**.

De online agenda laat daarna alleen die tijden zien. Bestaande afspraken worden **nooit** automatisch verplaatst of geannuleerd.

## Vrije dag of vakantie

Kies de manier die bij je situatie past:

- **Eén dag anders of gesloten:** Agenda → Werktijden → **Uitzondering**. Kies de datum en **Hele dag gesloten**, en sla op.
- **Meerdere dagen (vakantie):** **Blokkade toevoegen**, met een begin- en einddatum.

Klanten kunnen op die dagen niets meer aanvragen. Wil je het ongedaan maken? Klik bij de blokkade op **Verwijderen**.

## Afspraken en klanten

- **Vandaag** en **Kalender**: je afspraken.
- **Aanvragen**: nieuwe aanvragen. Daar kun je de aanvraag **bevestigen**, een ander moment voorstellen of **afwijzen**. De klant krijgt automatisch een e-mail.
- **Klanten**: zoek op naam of telefoonnummer. Hier zie je ook de afspraken, betalingen en intakeformulieren van de klant.

## Een medewerker toegang geven

Deel nooit je eigen wachtwoord; geef iedereen een eigen account.

1. **Admin → Medewerkers & rechten → Iemand uitnodigen**.
2. Vul naam en e-mailadres in en kies een rol:
   - **Medewerker:** alleen agenda en afspraken.
   - **Manager:** ook klantgegevens bewerken. Extra rechten zet je zelf aan.
   - **Tekstschrijver:** alleen websiteteksten als concept. Jij publiceert.
3. De medewerker krijgt een e-mail met een link (48 uur geldig) om een wachtwoord te kiezen.
4. Stopt iemand? Klik **Account uitzetten**. Diegene is dan meteen overal uitgelogd.

Financiën, intakeformulieren en exports zijn alleen zichtbaar voor iemand aan wie jij dat recht geeft. Ook dan pas nadat die persoon tweestapsverificatie heeft aangezet.

## Cookies en statistieken

- Bezoekers zien bij hun eerste bezoek: **Alles accepteren**, **Alles weigeren** of **Voorkeuren instellen**.
- Zonder ‘ja’ wordt Google Analytics niet geladen.
- Afspraak maken en contact opnemen werken altijd, ook als iemand weigert.
- Onderaan elke pagina staat **Cookie-instellingen**; daar kan een bezoeker de keuze altijd wijzigen.

**Statistieken aanzetten:**

1. **Admin → Analytics & cookies**.
2. Kies **Google Analytics direct**. De Measurement ID `G-77V0DM6Y7B` staat al ingevuld.
3. Zet **Statistieken aanzetten** aan.
4. Klik **Publiceren**.

Kies **Via Google Tag Manager** pas als je Tag Manager hebt laten inrichten.

## Teksten van de website

1. **Admin → Pagina's** → kies een pagina.
2. Kies bovenaan de taal: **Nederlands**, **Engels** of **Turks**. Turks is wel zichtbaar voor bezoekers, maar niet in Google.
3. Pas de tekst aan.
4. Kies:
   - **Opslaan**: een concept, nog niet zichtbaar;
   - **Voorbeeld**: bekijken hoe het wordt;
   - **Publiceren**: zichtbaar op de website.

## Als er iets misgaat

- **Inloggen lukt niet:** gebruik **Wachtwoord vergeten?**. Werkt e-mail nog niet, kijk dan op glowbydilek.nl/login/status.
- **Een wijziging was niet goed:** open de pagina in Admin → Pagina's; bij de geschiedenis kun je een eerdere versie terugzetten.
- **Back-up:** Admin → Systeem → **Back-up downloaden**. Bewaar het bestand op een veilige plek.
