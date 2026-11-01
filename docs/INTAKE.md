# Intake & consent form (Intake & toestemming)

One printable master form per language (NL, EN) for every treatment, plus a
private place in each customer record for the signed copy.

> **Status: draft wording.** The v1 text (`GBD-INTAKE-2026-11-v1`) is the
> owner-supplied draft from the November 2026 handover. It has **not** been
> legally reviewed. Have the text, the legal basis and the retention period
> checked (GDPR art. 9 — health data) before storing signed forms.

## Workflow

1. **Agenda → Intakeformulier**: print the active version (A4) or download the PDF.
2. The client fills it in and signs on paper.
3. **Agenda → Klanten → (client) → Intake & toestemming**: take a photo or upload a
   scan/PDF, enter the signing date and the version printed on the form, and
   confirm that the client ticked the consent-to-storage box.
4. A new upload becomes *Huidig*; the previous one stays as *Eerdere versie*.
5. If the client withdraws consent (or retention ends): *Bestand verwijderen*.
   The file is wiped; a record without health data remains for the audit trail.
   Anonymising a client wipes all of their signed forms.

If the client ticks **"no consent to storage"**: discuss safety verbally and do
**not** upload the form (the upload is refused without the consent confirmation).

## Revisions (controlled)

- *Nieuwe revisie maken* copies the active text into a **draft** with the next
  version number (`GBD-INTAKE-YYYY-MM-vN`).
- Edit the text in the simple line format (help is shown next to the editor).
  Title, consent boxes, signature line and `{version}` are required.
- *Opslaan en activeren* needs a short change note. The previous active version
  becomes *Vorige versie* and is never edited again, so every signed copy can be
  traced to the exact wording that was signed.

## Security and privacy

| Control | Implementation |
| --- | --- |
| Who | Owner only, signed in with two-step verification (MFA) |
| Legal gate | Upload/view only after the AVG confirmations in Admin → Privacy & consultatie |
| Encryption at rest | AES-256-GCM with `INTAKE_DOCUMENT_KEY` (32 bytes, base64), separate from `AUTH_SECRET` and `CONSULTATION_KEY` |
| Storage | In the database (`intake_documents.data_enc`), never on disk, never under `/media` or `public/` |
| Allowed files | PDF, JPEG, PNG, WebP — detected from the file content, max 10 MB, max 40 megapixels |
| Content checks | Disguised files refused; PDFs with JavaScript, actions, attachments, XFA or encryption refused |
| Metadata | Photos are re-encoded: EXIF, GPS, camera data removed (pure-JS fallback when the image library is unavailable) |
| Quarantine | Files are checked in memory and only stored after every check passes; rejected files are never written |
| Integrity | SHA-256 of the stored file is checked on every download; original hash kept |
| Download | Private route, `Cache-Control: no-store`, always as attachment, sandboxed CSP |
| Audit | Upload, view/download, delete and template changes are logged (no file contents) |
| Exclusions | Not in customer exports, emails, invoices, reports or analytics |
| Backups | Part of the database backup — the backup is encrypted data; the key is **not** in the backup. Store the key separately (password manager). Without the key the files cannot be read. |

**Known limits:** there is no virus scanner on the hosting plan (files are only
ever downloaded by the owner, never rendered on the site); PDF checks cannot
look inside compressed object streams. A photo of the paper form is the safest
upload.

## Owner actions before use

1. Legal review of the form text and retention period (AVG / health data).
2. Create `INTAKE_DOCUMENT_KEY` (`openssl rand -base64 32`) in Hostinger → Environment
   variables; keep a copy in a password manager. Never paste it in chat or GitHub.
3. Turn on two-step verification for the owner account.
4. Confirm the conditions in Admin → Privacy & consultatie.
5. Update the privacy page with the retention period for signed forms.
