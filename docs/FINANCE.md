# Finance, invoices and PDF documents

All amounts are **integer cents** (`src/lib/finance/money.ts`); no floating-point money arithmetic anywhere.

## Four separate notions (never mixed)

| Notion | Where | Changes when list prices change? |
| --- | --- | --- |
| List price | `treatments.price_cents` (Admin → Behandelingen) | — |
| Agreed price | `appointments.price_cents` + `appointment_treatments.price_cents` (snapshot at booking) | **No** |
| Invoiced | issued `invoices` (credit invoices negative) | **No** (frozen) |
| Received | `payments` (refunds negative) — the only basis of "revenue" | **No** |

Nothing is estimated: an appointment without an agreed price never counts as revenue; a completed appointment with an agreed price but no payment appears under "nog geen betaling vastgelegd".

## Financiën (Agenda → Financiën)

Day, week, month, year and custom periods (Europe/Amsterdam calendar days): received, refunded, net, paying customers, average per paying customer, per payment method, per treatment, per day, invoiced, open invoices, unpaid completed appointments, completed/cancelled/no-show counts, new and returning customers. PDF report via the "PDF-rapport" button.

**Per treatment** is exact: a payment linked to an appointment with one treatment counts for that treatment; multi-treatment appointments are shown as "Combinatie: …"; payments not linked to an appointment are shown separately. Nothing is split proportionally or guessed.

Payments are never deleted. A mistake is **voided** with a reason; it stays visible (struck through) and in the audit log.

## Invoices (Agenda → Facturen & PDF)

1. **Business details first.** Admin → Bedrijf & facturen: legal name, address, KVK number, VAT situation (charge VAT with your VAT-ID and rate, or exempt with the exact wording your accountant confirmed), optional IBAN. **Issuing is blocked** until these are complete; nothing is pre-filled or guessed. Have your accountant check them once.
2. **Draft** from an appointment or customer profile: lines are pre-filled from the agreed price snapshot (or left empty to fill in). Amounts are **including VAT** (consumer prices); VAT is derived per line with round-half-up.
3. **Preview** the PDF (marked "CONCEPT").
4. **Issue**: the next number in a gapless yearly sequence (`GBD-2026-0001`), allocated under a database row lock (tested with parallel issuing). Seller and buyer details, lines and totals are frozen together with the PDF and its SHA-256 hash. Optionally "already paid": the payment is recorded and the PDF says "Voldaan".
5. **Email**: the PDF is attached at send time from the frozen record and only sent to the email address on the invoice, and only while it still matches the customer's current address. Status per attempt (pending / sent / failed) is shown; "sent" means the mail server accepted it.
6. **Corrections**: issued invoices are never edited. Make a **credit invoice** (negative lines, same numbering) and, if needed, a new invoice.

Issued invoices and the payment records must be kept for **7 years** (Dutch tax retention). Anonymising a customer does not delete invoices: their frozen buyer details stay as legally required.

## Other PDFs

| PDF | Where |
| --- | --- |
| Treatment summary of one appointment | Appointment → "Behandeloverzicht (PDF)" |
| Treatment history of a customer in a date range | Customer profile → "Behandeloverzicht (PDF)" |
| Business activity (by status, treatment, day) | Overzichten → "Activiteiten (PDF)" |
| Financial report | Financiën → "PDF-rapport" |
| Price list (only treatments with a confirmed price) | Facturen & PDF, or `/admin/behandelingen/prijslijst` |

PDFs are generated on the server with **pdfkit** (pure JavaScript, works on Hostinger without native modules). No PDF ever contains consultation (health) data or internal notes. Every PDF download is written to the audit log.

## Verification status

Tested automatically (unit + MariaDB + browser): cents parsing, VAT, readiness gate, sequential numbering under concurrency, frozen snapshots, credit invoices, paid-on-issue, PDF validity and hash, email with PDF attachment (local SMTP sink), finance report figures. **Not yet tested:** delivery through the real Hostinger mailbox, and review of the invoice layout and VAT treatment by the owner's accountant.
