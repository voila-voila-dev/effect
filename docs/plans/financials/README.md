# The `financials` domain

Everything about money going in and out of a business: amounts and currencies, taxes,
invoices and credit notes, payments, e-invoicing, and later the ledger and reports. It
is called *financials*, not *invoicing*, because the invoice is one document among the
things a business needs to get paid and stay compliant.

```
domains/financials/
  packages/       money, tax, invoicing, payments, e-invoicing (later: ledger, financial-reports)
  examples/       one seller invoicing in France, Germany and the US
domains/providers/packages/
                  one package per network or engine: a French plateforme agréée,
                  pennylane (accounting export), later a Peppol access point, SDI,
                  KSeF, stripe-tax
```

## Design rules

- **Every EU country and the US, by design.** The types carry what those countries need
  from day one; what ships is what a consumer uses (France and Luxembourg first). The US
  is the test that the core assumes nothing European.
- **Taxes, not VAT.** VAT is one kind of tax. See [`tax.md`](./tax.md).
- **Determining taxes is separate from computing them.** Which taxes apply is a
  pluggable decision; how much they come to is pure, shared arithmetic.
- **Countries are profiles, not branches.** Everything country-specific lives in a
  jurisdiction profile the consumer registers; the core has no `if (country === "FR")`.
  See [`invoicing.md`](./invoicing.md).
- **EN 16931 as the internal vocabulary.** It is the European semantic model, it maps to
  every European format, and the US needs only a subset of it.
- **Composition over configuration**: rule combinators, registries and named extension
  points, no boolean options.
- **No product vocabulary**, frozen by a boundary test, like every domain here.
- **Strings, permissions and storage come from the consumer**: no i18n library, no
  hard-coded gate, a storage contract.

## Packages

| Package | Contents |
|---|---|
| `@voila.dev/money` | `Money` in minor units, ISO 4217 currencies with their exponents, rounding modes, allocation without lost cents, exchange rates with their date and source |
| `@voila.dev/tax` | The tax model, the computation, the determination contract and rule combinators, dated rate catalogues (`/eu-vat`) |
| `@voila.dev/invoicing` | Documents (invoice, credit note; later quote, pro forma, receipt), series and gap-free numbering, issuance, immutability, jurisdiction profiles (`/fr`, `/lu`), a rendering model for PDFs |
| `@voila.dev/payments` | Payments received, allocation to invoices, payment status, refunds, receivables ageing, dunning schedules |
| `@voila.dev/e-invoicing` | EN 16931 → formats (`/factur-x`, `/xrechnung`, `/ubl`), the `EInvoicingNetwork` contract, e-reporting. See [`e-invoicing.md`](./e-invoicing.md) |
| `@voila.dev/ledger` *(later)* | Double-entry ledger, escrow |
| `@voila.dev/financial-reports` *(later)* | Revenue book, tax return aggregates, the `AccountingExport` contract |

`money` and `tax` do not depend on `invoicing`, so a cart, a quote tool or a pricing page
can use them alone. Heavy dependencies (XML, PDF/A-3) stay behind sub-exports with
optional peers.

Dependencies between the packages:

```
money ← tax ← invoicing ← payments
                  ↑
             e-invoicing
```

Shared from other domains: `effect-ddd` (use cases, gates), `cache-lock` (the numbering
lock), `outbox` (`InvoiceIssued`, `PaymentRecorded` events, jobs), `http` (providers,
webhooks), `email` (sending documents), and from `providers`: `annuaire-entreprises` and
`vies` (checking parties' identifiers).

Still needed before `invoicing`: a storage contract (`StorageService`: S3, local, in
memory) and a PDF contract (`PdfService` with a block model), named in the extraction
plan but not yet in this repository. Where they live (`effect` or a `documents` domain)
is to decide with them.

## Done when

The example issues, in one run: a French invoice under the VAT franchise, a German
invoice with a reverse-charged line, a US invoice with stacked state and city sales tax,
a credit note on one of them, and records a part payment — and a second consumer issues
its real invoices on the same packages.
