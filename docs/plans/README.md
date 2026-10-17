# Plans

Written 2026-10-17. What comes next in this repository after the effect, email,
providers, docs and UI domains: the capabilities a B2B product needs to bill, get paid
and know who it works with. Each plan follows the repository's rules (`CONTRIBUTING.md`):
a contract per capability (`Context.Service`) with a real and an in-memory
implementation, one package per third party, no product vocabulary.

The first two consumers are **tries.care**, where most of this code exists today, and
**Ryla** (home-care providers in France), which needs it from scratch. Migrating
tries.care onto these packages gets its own plan, written next.

| Plan | What it covers |
|---|---|
| [`financials/`](./financials/README.md) | The `financials` domain: money, taxes, invoices, payments, e-invoicing, then ledger and reports |
| ↳ [`financials/tax.md`](./financials/tax.md) | Taxes for every EU country and the US: VAT as one kind of tax |
| ↳ [`financials/invoicing.md`](./financials/invoicing.md) | Invoices, credit notes, gap-free numbering, jurisdiction profiles, payments |
| ↳ [`financials/e-invoicing.md`](./financials/e-invoicing.md) | Structured formats and the networks of each country's mandate |
| [`trust.md`](./trust.md) | The `trust` domain: KYC and KYB |
| [`urssaf-tiers-de-prestation.md`](./urssaf-tiers-de-prestation.md) | The URSSAF API behind France's *avance immédiate* |

## Roadmap

| # | Where | Deliverable | Done when |
|---|---|---|---|
| 0 | outside | File the URSSAF habilitation; pick the first French plateforme agréée | filed, PA sandbox access |
| 1 | platform | `domains/financials` and `domains/trust` scaffolded | CI green |
| 2 | platform | `money` + `tax` | two different consumers' tax rules expressed as rule sets, tests green |
| 3 | platform | `invoicing` (+ `fr`, `lu` profiles) and `payments` | a franchise invoice, a VAT invoice with a reverse-charged line, a credit note and a part payment, in the example |
| 4 | platform | `trust-core` + `trust-registries` (FR) + `stripe-identity` | KYB of a French company end to end |
| 5 | platform | `urssaf-tiers-de-prestation` | a sandbox payment request reaches "paid" |
| 6 | platform | `e-invoicing` (formats + contract) + first PA provider | sandbox e-reporting round trip |
| 7 | consumers | tries.care migration (own plan); Ryla on the packages | both live on e-invoicing before **1 Sept 2027** |
| later | platform | `ledger`, `financial-reports`, other networks, a US tax engine, `trust-document`/`face`/`ui`/`server` | when a consumer needs them |

Steps 0 and 1 can start now. 1 Sept 2027 (French e-invoicing for SMEs and
micro-enterprises) is the only hard deadline; the URSSAF habilitation is the longest
external wait.

## Open decisions

1. Separate packages (`money`, `tax`, `invoicing`, `payments`…) or one
   `@voila.dev/financials` with sub-exports, as `@voila.dev/ui` did.
2. Which plateforme agréée first: onboarding companies on their behalf by API, B2C
   e-reporting, price per company, sandbox.
3. Ship and maintain an EU VAT rate catalogue, or only the countries consumers use.
4. Stripe Identity for KYC now, or wait for `trust-face`.
5. Persistence adapters (`/drizzle`) in the packages, or in each consumer.
