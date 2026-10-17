# @voila.dev/annuaire-entreprises

## 0.1.0

### Minor Changes

- f1e3bbb: First release of two provider packages. `@voila.dev/annuaire-entreprises`: the French company directory behind a replaceable contract — a SIRET to its company, directors and address, a name search, withheld identities flagged, 429s backed off, outages typed apart from "not found", and an in-memory fake. `@voila.dev/vies`: EU VAT number checks against VIES, with member-state outages (`ViesUnavailableError`) told apart from refused input (`ViesRejectedInputError`), the national VAT formats of every member state, a parser for numbers as people type them, and an in-memory fake.
