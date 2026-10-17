# Invoicing and payments — `@voila.dev/invoicing`, `@voila.dev/payments`

The starting point is tries.care's invoicing, which is already close to generic and has
issued real invoices in France and Luxembourg. Its migration onto this package gets its
own plan; this one describes the package.

## Invoicing

**The document.** One aggregate for invoices and credit notes (`kind`), later quotes, pro
formas and receipts.

- Parties are snapshots taken at issue time: name, address, contacts and **typed
  identifiers** (`{ scheme, value }`: SIREN/SIRET, VAT number, US EIN, LEI, Peppol ID…,
  EN 16931 BT-29/30/46/47). References in other systems (an accounting tool's customer id)
  go in a separate map, not in the party.
- Lines: label, details, quantity and unit, unit price, discount, `TaxOutcome[]`
  ([`tax.md`](./tax.md)). The document adds allowances, charges and document-level taxes.
- Totals are **always derived** from lines, never stored.
- An opaque `source` (`{ type, id }`) ties the document to what it bills; the consumer
  owns the types. Issuance is idempotent per source.
- Self-billing (the buyer issues the invoice for the seller) is a flag, as in EN 16931.

**Immutability.** An issued document never changes its amounts, parties' legal
identifiers or number. A mistake is fixed by a **credit note**, which references the
invoice, reuses its series and parties, and is capped by what remains creditable (full,
partial or pro rata).

**Gap-free numbering.**
- A **series** per issuer (and per kind or purpose when the consumer wants), with a
  sequence per year or a running count.
- A **format** with placeholders (`{{YEAR}}`, `{{SEQUENCE}}`, `{{COUNT}}`, a prefix…);
  numbers are stored as parts with their format, so a later format change never alters a
  printed number.
- Allocation takes the `cache-lock` lock on the series **around the whole transaction**;
  a rollback gives the number back. The issue date is set under the lock so dates follow
  number order.
- A repair tool that reports gaps and out-of-order dates, for audits.

**Jurisdiction profiles.** A registry the consumer fills; the core reads it, never a
country code. A profile states:

- the identifiers each party must carry (FR: SIREN/SIRET; DE: Steuernummer or VAT
  number…);
- the legal mentions and their wording per language (late payment penalties, exemption
  grounds, franchise mention…);
- numbering constraints, the retention period (10 years in France), the languages
  allowed;
- its e-invoicing mandate and network ([`e-invoicing.md`](./e-invoicing.md)).

Shipped first: `/fr` and `/lu`. A consumer extends a profile (adds its own mentions)
rather than forking it. The US profile is nearly empty, which is the point.

**Rendering.** A renderer-agnostic block model (header, parties, lines table, tax
breakdown, totals, mentions, payment instructions) built from the document and the
profile, with every string supplied by the consumer. Turning it into a PDF goes through
the `PdfService` contract; Factur-X embedding is in `e-invoicing`.

**Storage and retention.** The rendered file goes through a `StorageService` with the
profile's retention period attached, so a consumer can map it to a write-once bucket.

**Events.** `InvoiceIssued`, `CreditNoteIssued` through `outbox`, so accounting exports,
e-invoicing transmission and emails subscribe instead of being called from issuance.

## Payments

New: tries.care only prints a payment statement on its documents today.

- **Record a payment**: amount, currency, date, method, payer, external reference.
- **Allocate** it to one or more invoices (and credit notes as negative balances); an
  unallocated remainder stays as a credit.
- **Derive each invoice's status**: unpaid, partially paid, paid, overpaid, written off.
- **Refunds** linked to the payment and, when a credit note exists, to it.
- **Receivables**: what is due, by age, per customer.
- **Dunning schedule**: when to remind, as data; the wording and channel stay with the
  consumer.
- `PaymentRecorded` event, which e-reporting of payments needs in France (services are
  taxed when paid).

## Done when

The example issues invoices under three profiles with one numbering lock per series,
credits one, records and allocates a part payment, and the boundary test finds no
product vocabulary in either package.
