# Consultation form (health information) — assessment and operation

**Status: built, OFF by default.** It only works after the owner (1) sets `CONSULTATION_KEY` in Hostinger, (2) confirms the three legal conditions in Admin → Privacy & consultatie, and (3) has two-step verification enabled. This is an assessment to support the owner and a legal reviewer — **not legal advice and no guarantee of compliance**.

## Purpose and data minimisation

Only to wax safely: knowing whether there is a reason not to wax, or to wax differently. Five yes/no questions with a short note (allergy to wax/colophony/latex/products; skin-thinning medication or products such as isotretinoin, retinol, acids or peels; blood thinners; wounds/inflammation/sunburn/eczema/psoriasis or recent laser/peel in the area; a condition affecting skin healing or circulation) plus agreed precautions. No full medical history, diagnoses or medication lists.

## Legal basis

- **Art. 6(1)(b) GDPR** — necessary to perform the treatment the customer asked for.
- Health data is a special category (**art. 9**). A beauty therapist is not a healthcare provider, so the practical exception is **explicit consent (art. 9(2)(a))**: freely given, specific, informed, documented per customer (date, method, text version), withdrawable at any time. A customer who declines is not treated differently except where safety requires (the owner asks verbally on the day without recording).
- **DPIA**: mandatory for large-scale processing of health data. A one-person studio with a minimal form is generally not large-scale (recital 91). The owner confirms having made this assessment (or had it reviewed) before switching the form on.
- Still to do outside the software: add the processing to the owner's register of processing activities; have a privacy lawyer review if in doubt.

## Safeguards (implemented and tested)

| Safeguard | Implementation |
| --- | --- |
| Encryption at rest | AES-256-GCM per record, key `CONSULTATION_KEY` (32 random bytes, base64), separate from `AUTH_SECRET` |
| Access | Owner only, MFA required, server-side checks on page, actions and export |
| Audit | Every view, change, export and deletion in the audit log |
| Separation | Not in the general customer export, emails, invoices, PDFs, finance reports or analytics; not in free-text notes (the UI warns) |
| Review | `next_review_at` one year after the last check; shown on the form |
| Retention | Deleted automatically by the cron job when not reviewed within the configured period (default 24 months) |
| Withdrawal / erasure | "Gegevens verwijderen" (consent withdrawn) and customer anonymisation delete the record immediately |
| Export | Separate, audited JSON export for a justified access request |
| Merging profiles | Refused while both profiles hold a consultation record |

## Key management

- Generate locally: `openssl rand -base64 32`; store in Hostinger → Environment variables as `CONSULTATION_KEY`; keep a copy in a password manager. **Without the key the answers cannot be read** (by design).
- Never put the key in chat, email, GitHub or a development database.
- Changing the key makes existing answers unreadable; key rotation is not automated (ask a developer to re-encrypt if ever needed).
