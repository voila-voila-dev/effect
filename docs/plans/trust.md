# The `trust` domain — KYC and KYB

Knowing who a product works with: the person (KYC) and the business (KYB). Already
announced in the README as the next domain; this plan sets the first slice.

## Packages

| Package | Contents |
|---|---|
| `@voila.dev/trust-core` | The verification model: subject (person or business), checks, evidence, level of assurance, decision (verified, rejected, needs review, expired), manual review, audit trail, periodic re-checks |
| `@voila.dev/trust-requirements` | Per country, which evidence to ask for, for a person and for a business (FR: registry extract, articles, director's ID). Built to take contributions country by country |
| `@voila.dev/trust-registries` | One connector per business registry, behind one contract: Sirene / RNE through `annuaire-entreprises`, then Companies House, Handelsregister, KBO, GLEIF/LEI; `vies` for VAT numbers |
| `@voila.dev/trust-document` *(later)* | MRZ reading (ICAO 9303), OCR, consistency checks; later NFC passive authentication of e-passports |
| `@voila.dev/trust-face` *(later)* | Selfie to document face match, liveness challenges |
| `@voila.dev/trust-ui` *(later)* | Capture screens (document, selfie, uploads) on `@voila.dev/ui` |
| `@voila.dev/trust-server` *(later)* | A self-hostable API and back office for manual review |

Providers in `domains/providers`: `stripe-identity` (KYC session and webhook) first.

## First slice

- **KYB France**: a SIRET is active, belongs to the company claimed, and one of its
  registered officers matches a person whose KYC passed. Re-checked on a schedule
  (`outbox` cron): a company can be struck off.
- **KYC through Stripe Identity**: start a session, read its result from the webhook,
  record the decision.
- **Manual review**: any check can land in "needs review"; a reviewer's decision is
  recorded with who, when and why.
- **Requirements as data**: a consumer adds its own checks (a licence, an insurance
  certificate) as requirement entries reviewed manually, without new code in the domain.

## Constraints

- No certification claim (PVID, eIDAS): this is reasonable verification and pre-checking,
  not a regulated bank onboarding without an audit.
- Biometric data falls under GDPR art. 9: minimal retention, encryption by design. The
  default is to keep the decision, its date and its evidence references, not copies of
  documents.

## Done when

A French micro-enterprise goes from sign-up to "verified" (KYC + KYB) end to end in the
example, and a struck-off company is caught by the re-check.
